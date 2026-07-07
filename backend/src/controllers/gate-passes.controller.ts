import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';

// Validation schemas
const createGatePassSchema = z.object({
  gate_pass_type_id: z.string().uuid(),
  departure_date: z.string(),
  departure_time: z.string(),
  expected_return_date: z.string().optional(),
  expected_return_time: z.string().optional(),
  destination: z.string().min(1),
  purpose: z.string().min(1),
  remarks: z.string().optional(),
  vehicle_type: z.enum(['company', 'private', 'public_transport', 'walking']).default('private'),
  company_vehicle_id: z.string().optional(),
  private_vehicle_plate: z.string().optional(),
  driver_name: z.string().optional(),
  driver_license: z.string().optional(),
  mileage_start: z.string().optional(),
});

const updateGatePassSchema = createGatePassSchema.partial();

// Helper function to generate control number
async function generateControlNumber(module: string): Promise<string> {
  const setting = await prisma.controlNumberSetting.findUnique({
    where: { module }
  });

  if (!setting) {
    throw new Error('Control number setting not found');
  }

  const currentYear = new Date().getFullYear();
  if (setting.year !== currentYear) {
    await prisma.controlNumberSetting.update({
      where: { module },
      data: {
        year: currentYear,
        next_sequence: 1
      }
    });
    setting.next_sequence = 1;
    setting.year = currentYear;
  }

  const sequence = setting.next_sequence;
  const paddedSequence = String(sequence).padStart(setting.padding, '0');
  const controlNumber = setting.format_template
    .replace('{PREFIX}', setting.prefix)
    .replace('{YEAR}', String(setting.year))
    .replace('{SEQUENCE}', paddedSequence);

  await prisma.controlNumberSetting.update({
    where: { module },
    data: { next_sequence: sequence + 1 }
  });

  return controlNumber;
}

// Helper function to get approval workflow
async function getApprovalWorkflow(gatePassTypeId: string, requiresVehicle: boolean) {
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: {
      module: 'gate_passes',
      is_active: true
    },
    include: {
      steps: {
        orderBy: { step_order: 'asc' }
      }
    }
  });

  return workflow;
}

// Create Gate Pass
export const createGatePass = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createGatePassSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get gate pass type
    const gatePassType = await prisma.gatePassType.findUnique({
      where: { id: validatedData.gate_pass_type_id }
    });

    if (!gatePassType) {
      return res.status(404).json({ error: 'Gate pass type not found' });
    }

    // Generate control number
    const controlNumber = await generateControlNumber('gate_passes');

    // Create gate pass
    const gatePass = await prisma.gatePass.create({
      data: {
        control_number: controlNumber,
        gate_pass_type_id: validatedData.gate_pass_type_id,
        employee_id: userId,
        departure_date: validatedData.departure_date,
        departure_time: validatedData.departure_time,
        expected_return_date: validatedData.expected_return_date,
        expected_return_time: validatedData.expected_return_time,
        destination: validatedData.destination,
        purpose: validatedData.purpose,
        remarks: validatedData.remarks,
        vehicle_type: validatedData.vehicle_type,
        private_vehicle_plate: validatedData.private_vehicle_plate,
        driver_name: validatedData.driver_name,
        driver_license: validatedData.driver_license,
        mileage_start: validatedData.mileage_start,
        status: 'draft'
      },
      include: {
        gate_pass_type: true,
        employee: true
      }
    });

    // Create status history
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: gatePass.id,
        status: 'draft',
        notes: 'Gate pass created',
        changed_by: userId,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : []
      }
    });

    // Create log
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: gatePass.id,
        user_id: userId,
        action: 'created',
        description: 'Gate pass draft created',
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
        user_agent: req.get('user-agent') || undefined
      }
    });

    // Audit log
    await logAudit({
      userId,
      module: 'gate_passes',
      action: 'create',
      entityType: 'gate_pass',
      entityId: gatePass.id,
      newValue: gatePass,
      ipAddress: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
      userAgent: req.get('user-agent') || undefined
    });

    res.status(201).json(gatePass);
  } catch (error) {
    console.error('Error creating gate pass:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all Gate Passes
export const getGatePasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, type, employee_id, page = 1, limit = 50, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { deleted_at: null };

    // Filter by user role
    if (req.user?.roles.includes('employee') && !req.user?.roles.includes('administrator')) {
      where.employee_id = userId;
    } else if (employee_id) {
      where.employee_id = employee_id;
    }

    if (status) where.status = status;
    if (type) where.gate_pass_type_id = type;

    if (search) {
      where.OR = [
        { control_number: { contains: search as string, mode: 'insensitive' } },
        { destination: { contains: search as string, mode: 'insensitive' } },
        { purpose: { contains: search as string, mode: 'insensitive' } },
        { employee: { full_name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const [gatePasses, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          gate_pass_type: true,
          employee: {
            select: {
              id: true,
              full_name: true,
              employee_no: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  full_name: true
                }
              }
            }
          },
          vehicle: true
        }
      }),
      prisma.gatePass.count({ where })
    ]);

    res.json({
      gatePasses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching gate passes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single Gate Pass
export const getGatePassById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        gate_pass_type: true,
        employee: true,
        approvals: {
          include: {
            approver: true
          },
          orderBy: { step_order: 'asc' }
        },
        status_history: {
          orderBy: { changed_at: 'desc' }
        },
        logs: {
          include: {
            user: true
          },
          orderBy: { created_at: 'desc' }
        },
        attachments: true,
        vehicle: true
      }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    res.json(gatePass);
  } catch (error) {
    console.error('Error fetching gate pass:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Gate Pass
export const updateGatePass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateGatePassSchema.parse(req.body);
    const userId = req.user?.id;

    const existingGatePass = await prisma.gatePass.findUnique({
      where: { id }
    });

    if (!existingGatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (existingGatePass.status !== 'draft' && existingGatePass.status !== 'returned') {
      return res.status(400).json({ error: 'Cannot update gate pass in current status' });
    }

    const gatePass = await prisma.gatePass.update({
      where: { id },
      data: validatedData,
      include: {
        gate_pass_type: true,
        employee: true
      }
    });

    // Log update
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId,
        action: 'updated',
        description: 'Gate pass updated',
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
        user_agent: req.get('user-agent') || undefined
      }
    });

    // Audit log
    await logAudit({
      userId,
      module: 'gate_passes',
      action: 'update',
      entityType: 'gate_pass',
      entityId: id,
      oldValue: existingGatePass,
      newValue: gatePass,
      ipAddress: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
      userAgent: req.get('user-agent') || undefined
    });

    res.json(gatePass);
  } catch (error) {
    console.error('Error updating gate pass:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit Gate Pass for Approval
export const submitGatePass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        gate_pass_type: true,
        employee: true
      }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (gatePass.status !== 'draft' && gatePass.status !== 'returned') {
      return res.status(400).json({ error: 'Gate pass cannot be submitted' });
    }

    // Get approval workflow
    const workflow = await getApprovalWorkflow(gatePass.gate_pass_type_id, false);

    if (!workflow) {
      return res.status(400).json({ error: 'No approval workflow configured' });
    }

    // Update gate pass status
    const updatedGatePass = await prisma.gatePass.update({
      where: { id },
      data: {
        status: 'submitted'
      }
    });

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        module: 'gate_passes',
        entity_type: 'gate_pass',
        entity_id: id,
        workflow_id: workflow.id,
        status: 'pending',
        requested_by: userId
      }
    });

    // Create approval entries for each step
    for (const step of workflow.steps) {
      await prisma.gatePassApproval.create({
        data: {
          gate_pass_id: id,
          approver_id: step.approver_user_id || userId, // TODO: Resolve approver by role
          step_order: step.step_order,
          role: step.approver_role,
          created_at: new Date().toISOString()
        }
      });
    }

    // Create status history
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: 'submitted',
        notes: 'Submitted for approval',
        changed_by: userId,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : []
      }
    });

    // Create log
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId,
        action: 'submitted',
        description: 'Gate pass submitted for approval',
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
        user_agent: req.get('user-agent') || undefined
      }
    });

    // TODO: Send notifications to approvers

    res.json(updatedGatePass);
  } catch (error) {
    console.error('Error submitting gate pass:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete Gate Pass (soft delete)
export const deleteGatePass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (gatePass.status !== 'draft') {
      return res.status(400).json({ error: 'Cannot delete gate pass in current status' });
    }

    await prisma.gatePass.update({
      where: { id },
      data: {
        deleted_at: new Date().toISOString()
      }
    });

    // Audit log
    await logAudit({
      userId,
      module: 'gate_passes',
      action: 'delete',
      entityType: 'gate_pass',
      entityId: id,
      oldValue: gatePass,
      ipAddress: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
      userAgent: req.get('user-agent') || undefined
    });

    res.json({ message: 'Gate pass deleted successfully' });
  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Gate Pass Types
export const getGatePassTypes = async (req: AuthRequest, res: Response) => {
  try {
    const types = await prisma.gatePassType.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    res.json(types);
  } catch (error) {
    console.error('Error fetching gate pass types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate QR Code
export const generateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (gatePass.status !== 'approved') {
      return res.status(400).json({ error: 'QR code can only be generated for approved gate passes' });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      id: gatePass.id,
      control_number: gatePass.control_number,
      employee_id: gatePass.employee_id,
      status: gatePass.status,
      generated_at: new Date().toISOString()
    });

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData);

    // Update gate pass with QR code
    const updatedGatePass = await prisma.gatePass.update({
      where: { id },
      data: {
        qr_code_data: qrData,
        qr_code_generated_at: new Date().toISOString()
      }
    });

    res.json({
      qr_code: qrCodeImage,
      qr_data: qrData,
      gate_pass: updatedGatePass
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Dashboard Statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.roles.includes('administrator');

    const whereClause: any = { deleted_at: null };
    if (!isAdmin) {
      whereClause.employee_id = userId;
    }

    const [
      pendingRequests,
      approvedToday,
      rejectedToday,
      released,
      returned,
      pendingApprovals,
      vehicleUsage
    ] = await Promise.all([
      prisma.gatePass.count({
        where: {
          ...whereClause,
          status: { in: ['submitted', 'for_supervisor_approval', 'for_department_head_approval', 'for_vehicle_coordinator_approval', 'for_general_administration_approval'] }
        }
      }),
      prisma.gatePass.count({
        where: {
          ...whereClause,
          status: 'approved',
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          }
        }
      }),
      prisma.gatePass.count({
        where: {
          ...whereClause,
          status: 'rejected',
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          }
        }
      }),
      prisma.gatePass.count({
        where: {
          ...whereClause,
          status: 'released'
        }
      }),
      prisma.gatePass.count({
        where: {
          ...whereClause,
          status: 'returned'
        }
      }),
      prisma.gatePassApproval.count({
        where: {
          approver_id: userId,
          action: null,
          gate_pass: whereClause
        }
      }),
      prisma.gatePass.count({
        where: {
          ...whereClause,
          vehicle_type: 'company'
        }
      })
    ]);

    res.json({
      pendingRequests,
      approvedToday,
      rejectedToday,
      released,
      returned,
      pendingApprovals,
      vehicleUsage
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};