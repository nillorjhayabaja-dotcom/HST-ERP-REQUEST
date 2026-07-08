import { Request, Response } from "express";
import { PrismaClient, GatePassStatus, GatePassPriority, ApprovalActionType } from "@prisma/client";
import { generateControlNumber } from "../utils/control-number";

const prisma = new PrismaClient();

// Helpers ----------------------------------------------------------------

const includeRelations = {
  gate_pass_type: true,
  employee: {
    include: {
      department: true,
      position: true,
    },
  },
  current_approver: {
    include: {
      department: true,
      position: true,
    },
  },
  trip: true,
  transportation: {
    include: { company_vehicle: true },
  },
  security_log: true,
  meal_allowance: true,
  approvals: {
    orderBy: { step_order: "asc" },
    include: {
      approver: {
        select: {
          id: true,
          full_name: true,
          first_name: true,
          last_name: true,
          email: true,
          employee_no: true,
          avatar_url: true,
        },
      },
    },
  },
  status_history: {
    orderBy: { changed_at: "desc" },
  },
} as const;

function requireFields(body: any, fields: string[]) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length) {
    const err: any = new Error(`Missing required field(s): ${missing.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
}

function formatGatePass(gp: any) {
  const employeeName =
    gp.employee?.full_name ||
    `${gp.employee?.first_name ?? ""} ${gp.employee?.last_name ?? ""}`.trim() ||
    gp.employee?.email ||
    "Unknown";

  const currentApproverName = gp.current_approver
    ? gp.current_approver.full_name ||
      `${gp.current_approver.first_name ?? ""} ${gp.current_approver.last_name ?? ""}`.trim()
    : null;

  return {
    ...gp,
    employee_name: employeeName,
    employee_department_name: gp.employee?.department?.name ?? null,
    employee_employee_no: gp.employee?.employee_no ?? null,
    current_approver_name: currentApproverName,
    // Flatten trip fields for backward compatibility with frontend
    departure_date: gp.trip?.departure_date ?? null,
    departure_time: gp.trip?.departure_time ?? null,
    expected_return_date: gp.trip?.expected_return_date ?? null,
    expected_return_time: gp.trip?.expected_return_time ?? null,
    actual_return_date: gp.trip?.actual_return_date ?? null,
    actual_return_time: gp.trip?.actual_return_time ?? null,
    destination: gp.trip?.destination ?? null,
    purpose: gp.trip?.purpose ?? null,
    trip_remarks: gp.trip?.remarks ?? null,
    // Flatten transportation fields
    transportation_method: gp.transportation?.method ?? null,
    company_vehicle_id: gp.transportation?.company_vehicle_id ?? null,
    private_vehicle_plate: gp.transportation?.private_vehicle_plate ?? null,
    private_vehicle_type: gp.transportation?.private_vehicle_type ?? null,
    public_transport_type: gp.transportation?.public_transport_type ?? null,
    driver_name: gp.transportation?.driver_name ?? null,
    driver_license: gp.transportation?.driver_license ?? null,
    vehicle_assignment: gp.transportation?.vehicle_assignment ?? null,
  };
}

function buildApprovalTimeline(gp: any) {
  const steps: any[] = [];

  const createEvent =
    [...(gp.status_history ?? [])].reverse().find((h: any) => h.status === "draft") ||
    (gp.created_at
      ? { status: "draft", changed_at: gp.created_at, notes: "Gate pass created" }
      : null);

  if (createEvent) {
    steps.push({
      id: `create-${gp.id}`,
      step: "created",
      status: "completed",
      timestamp: createEvent.changed_at,
      actor: employeeNameFromGp(gp),
      comment: createEvent.notes || "Gate pass created",
    });
  }

  for (const ap of gp.approvals ?? []) {
    const approverName =
      ap.approver?.full_name ||
      `${ap.approver?.first_name ?? ""} ${ap.approver?.last_name ?? ""}`.trim() ||
      "Approver";
    const status =
      ap.action === "approve" ? "approved" : ap.action === "reject" ? "rejected" : "pending";
    steps.push({
      id: ap.id,
      step: ap.role || ap.step_order?.toString() || "approval",
      status,
      timestamp: ap.acted_at ?? ap.created_at,
      actor: approverName,
      comment: ap.comment ?? null,
      action: ap.action,
      step_order: ap.step_order,
    });
  }

  if (typeof gp.status === "string" && gp.status.startsWith("pending_")) {
    const hasPending = (gp.approvals ?? []).some((a: any) => !a.action);
    if (!hasPending) {
      steps.push({
        id: `pending-${gp.id}`,
        step: gp.status,
        status: "in_progress",
        timestamp: gp.updated_at,
        actor: gp.current_approver_name || "Awaiting approver",
        comment: "Awaiting approval",
      });
    }
  }

  if (
    ["approved", "released", "completed", "rejected", "cancelled", "expired"].includes(gp.status)
  ) {
    const terminalEvent = (gp.status_history ?? []).find((h: any) => h.status === gp.status) || {
      status: gp.status,
      changed_at: gp.updated_at,
    };
    steps.push({
      id: `terminal-${gp.id}-${gp.status}`,
      step: gp.status,
      status: "completed",
      timestamp: terminalEvent.changed_at,
      actor: gp.employee_name,
      comment: `Gate pass ${gp.status}`,
    });
  }

  return steps;
}

function employeeNameFromGp(gp: any) {
  return (
    gp.employee?.full_name ||
    `${gp.employee?.first_name ?? ""} ${gp.employee?.last_name ?? ""}`.trim() ||
    "System"
  );
}

// ------------------------------ LIST ----------------------------------
export async function listGatePasses(req: Request, res: Response) {
  try {
    const {
      status,
      department,
      type,
      priority,
      search,
      page = "1",
      limit = "20",
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deleted_at: null };

    if (status) {
      const statuses = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (priority) {
      where.priority = priority;
    }

    if (department) {
      where.employee = { department_id: department };
    }

    if (type) {
      const typeRecord = await prisma.gatePassType.findFirst({ where: { code: type } });
      if (typeRecord) where.gate_pass_type_id = typeRecord.id;
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { control_number: { contains: q, mode: "insensitive" } },
        { employee: { full_name: { contains: q, mode: "insensitive" } } },
        { employee: { employee_no: { contains: q, mode: "insensitive" } } },
        { trip: { destination: { contains: q, mode: "insensitive" } } },
        { trip: { purpose: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.trip = where.trip || {};
      if (dateFrom)
        where.trip.departure_date = { ...(where.trip.departure_date || {}), gte: dateFrom };
      if (dateTo) where.trip.departure_date = { ...(where.trip.departure_date || {}), lte: dateTo };
    }

    const orderBy: any =
      sortBy && ["control_number", "status", "priority", "created_at"].includes(sortBy)
        ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
        : { created_at: "desc" };

    const [gatePassesRaw, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.gatePass.count({ where }),
    ]);

    const gatePasses = gatePassesRaw.map((gp) => formatGatePass(gp));

    res.json({
      gatePasses,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    console.error("listGatePasses", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ----------------------------- DETAIL ---------------------------------
export async function getGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const gp = await prisma.gatePass.findFirst({
      where: { OR: [{ id }, { control_number: id }], deleted_at: null },
      include: includeRelations,
    });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    const formatted = formatGatePass(gp);
    res.json({ ...formatted, approval_timeline: buildApprovalTimeline(gp) });
  } catch (err: any) {
    console.error("getGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ----------------------------- CREATE ---------------------------------
export async function createGatePass(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const body = req.body ?? {};

    const control_number = await generateControlNumber("gate_pass");

    // Create the GatePass
    const gp = await prisma.gatePass.create({
      data: {
        control_number,
        gate_pass_type_id: body.gate_pass_type_id ?? null,
        employee_id: body.employee_id || userId || "",
        status: body.status ?? "draft",
        priority: (body.priority as GatePassPriority) ?? "normal",
        purpose_category: body.purpose_category ?? "personal",
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
      include: includeRelations,
    });

    // If trip details provided, create GatePassTrip
    if (body.departure_date || body.destination) {
      await prisma.gatePassTrip.create({
        data: {
          gate_pass_id: gp.id,
          departure_date: body.departure_date || "",
          departure_time: body.departure_time || "",
          expected_return_date: body.expected_return_date ?? null,
          expected_return_time: body.expected_return_time ?? null,
          destination: body.destination || "",
          purpose: body.purpose || "",
          remarks: body.remarks ?? null,
        },
      });
    }

    // If transportation details provided and is official business
    if (body.purpose_category === "official_business" && body.transportation_method) {
      await prisma.gatePassTransportation.create({
        data: {
          gate_pass_id: gp.id,
          method: body.transportation_method,
          company_vehicle_id: body.company_vehicle_id ?? null,
          private_vehicle_plate: body.private_vehicle_plate ?? null,
          private_vehicle_type: body.private_vehicle_type ?? null,
          public_transport_type: body.public_transport_type ?? null,
          driver_name: body.driver_name ?? null,
          driver_license: body.driver_license ?? null,
          vehicle_assignment: body.vehicle_assignment ?? null,
        },
      });
    }

    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: gp.id,
        status: gp.status,
        notes: "Gate pass created",
        changed_by: userId ?? null,
      },
    });

    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: gp.id,
        user_id: userId ?? null,
        action: "created",
        description: `Gate pass ${gp.control_number} created`,
      },
    });

    const full = await prisma.gatePass.findUnique({
      where: { id: gp.id },
      include: includeRelations,
    });
    res.status(201).json(formatGatePass(full));
  } catch (err: any) {
    console.error("createGatePass", err);
    res.status(err.statusCode ?? 500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ----------------------------- UPDATE ---------------------------------
export async function updateGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const body = req.body ?? {};

    const existing = await prisma.gatePass.findFirst({
      where: { id, deleted_at: null },
      include: { trip: true, transportation: true },
    });
    if (!existing) return res.status(404).json({ error: "Gate pass not found" });

    // Update trip if it exists
    if (existing.trip) {
      await prisma.gatePassTrip.update({
        where: { gate_pass_id: id },
        data: {
          departure_date: body.departure_date ?? existing.trip.departure_date,
          departure_time: body.departure_time ?? existing.trip.departure_time,
          expected_return_date: body.expected_return_date ?? existing.trip.expected_return_date,
          expected_return_time: body.expected_return_time ?? existing.trip.expected_return_time,
          destination: body.destination ?? existing.trip.destination,
          purpose: body.purpose ?? existing.trip.purpose,
          remarks: body.remarks !== undefined ? body.remarks : existing.trip.remarks,
        },
      });
    }

    // Update transportation if it exists
    if (existing.transportation) {
      await prisma.gatePassTransportation.update({
        where: { gate_pass_id: id },
        data: {
          method: body.transportation_method ?? existing.transportation.method,
          company_vehicle_id:
            body.company_vehicle_id !== undefined
              ? body.company_vehicle_id
              : existing.transportation.company_vehicle_id,
          private_vehicle_plate:
            body.private_vehicle_plate !== undefined
              ? body.private_vehicle_plate
              : existing.transportation.private_vehicle_plate,
          private_vehicle_type:
            body.private_vehicle_type !== undefined
              ? body.private_vehicle_type
              : existing.transportation.private_vehicle_type,
          public_transport_type:
            body.public_transport_type !== undefined
              ? body.public_transport_type
              : existing.transportation.public_transport_type,
          driver_name:
            body.driver_name !== undefined ? body.driver_name : existing.transportation.driver_name,
          driver_license:
            body.driver_license !== undefined
              ? body.driver_license
              : existing.transportation.driver_license,
          vehicle_assignment:
            body.vehicle_assignment !== undefined
              ? body.vehicle_assignment
              : existing.transportation.vehicle_assignment,
        },
      });
    }

    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "updated",
        description: `Gate pass ${id} updated`,
      },
    });

    const updated = await prisma.gatePass.findUnique({ where: { id }, include: includeRelations });
    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("updateGatePass", err);
    res.status(err.statusCode ?? 500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ----------------------------- DELETE ---------------------------------
export async function deleteGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const existing = await prisma.gatePass.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ error: "Gate pass not found" });
    await prisma.gatePass.update({
      where: { id },
      data: { deleted_at: new Date().toISOString(), updated_by: userId ?? null },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("deleteGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

const STATUS_FLOW: Record<string, GatePassStatus | null> = {
  draft: "submitted",
  submitted: "pending_supervisor",
  pending_supervisor: "pending_department_head",
  pending_department_head: "pending_general_admin",
  pending_general_admin: "pending_security",
  pending_security: "approved",
  approved: "released",
  released: "completed",
  pending_vehicle_assignee: null,
  returned_for_revision: null,
  completed: null,
  rejected: null,
  cancelled: null,
  expired: null,
};

// ----------------------------- SUBMIT ---------------------------------
export async function submitGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const gp = await prisma.gatePass.findFirst({ where: { id, deleted_at: null } });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    if (gp.status !== "draft") {
      return res.status(400).json({ error: `Cannot submit gate pass in status ${gp.status}` });
    }

    const newStatus: GatePassStatus = "submitted";
    const approver = await pickNextApprover(gp.employee_id);

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status: newStatus,
        current_approver_id: approver?.id ?? null,
        updated_by: userId ?? null,
      },
      include: includeRelations,
    });

    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: newStatus,
        notes: "Submitted for approval",
        changed_by: userId ?? null,
      },
    });

    if (approver) {
      await prisma.gatePassApproval.create({
        data: {
          gate_pass_id: id,
          approver_id: approver.id,
          step_order: 1,
          role: "department_head",
        },
      });
    }

    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "submitted",
        description: "Submitted for approval",
      },
    });

    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("submitGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

async function pickNextApprover(employeeId: string) {
  const employee = await prisma.profile.findUnique({ where: { id: employeeId } });
  if (employee?.supervisor_id) {
    const supervisor = await prisma.profile.findUnique({ where: { id: employee.supervisor_id } });
    if (supervisor) return supervisor;
  }
  return prisma.profile.findFirst({
    where: { user_roles: { some: { role: "department_head" } } },
  });
}

// ----------------------------- APPROVE ---------------------------------
export async function approveGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const body = req.body ?? {};
    const comment: string | undefined = body.comment;
    const stepOrder: number | undefined = body.step_order;

    const gp = await prisma.gatePass.findFirst({
      where: { id, deleted_at: null },
      include: { approvals: { orderBy: { step_order: "asc" } } },
    });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });

    if (
      ![
        "pending_supervisor",
        "pending_department_head",
        "pending_vehicle_assignee",
        "pending_general_admin",
        "pending_security",
        "submitted",
      ].includes(gp.status)
    ) {
      return res.status(400).json({ error: `Cannot approve from status ${gp.status}` });
    }

    const pendingApproval = stepOrder
      ? gp.approvals.find((a) => a.step_order === stepOrder && !a.action)
      : gp.approvals.find((a) => !a.action);

    if (pendingApproval) {
      await prisma.gatePassApproval.update({
        where: { id: pendingApproval.id },
        data: {
          action: "approve",
          comment: comment ?? null,
          acted_at: new Date().toISOString(),
          approver_id: userId ?? pendingApproval.approver_id,
        },
      });
    } else if (userId) {
      await prisma.gatePassApproval.create({
        data: {
          gate_pass_id: id,
          approver_id: userId,
          step_order: (gp.approvals.length || 0) + 1,
          action: "approve",
          comment: comment ?? null,
          acted_at: new Date().toISOString(),
        },
      });
    }

    const nextStatus: GatePassStatus = (STATUS_FLOW[gp.status] as GatePassStatus) ?? gp.status;
    const nextApprover = await pickNextApprover(gp.employee_id);

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status: nextStatus,
        current_approver_id: nextApprover?.id ?? null,
        updated_by: userId ?? null,
      },
      include: includeRelations,
    });

    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: nextStatus,
        notes: comment ?? `Approved`,
        changed_by: userId ?? null,
      },
    });

    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "approved",
        description: `Approved step ${gp.status}${comment ? `: ${comment}` : ""}`,
      },
    });

    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("approveGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ----------------------------- REJECT ----------------------------------
export async function rejectGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const body = req.body ?? {};
    const comment: string | undefined = body.comment;

    const gp = await prisma.gatePass.findFirst({
      where: { id, deleted_at: null },
      include: { approvals: { orderBy: { step_order: "asc" } } },
    });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });

    const pendingApproval = gp.approvals.find((a) => !a.action);
    if (pendingApproval) {
      await prisma.gatePassApproval.update({
        where: { id: pendingApproval.id },
        data: {
          action: "reject",
          comment: comment ?? null,
          acted_at: new Date().toISOString(),
          approver_id: userId ?? pendingApproval.approver_id,
        },
      });
    } else if (userId) {
      await prisma.gatePassApproval.create({
        data: {
          gate_pass_id: id,
          approver_id: userId,
          step_order: (gp.approvals.length || 0) + 1,
          action: "reject",
          comment: comment ?? null,
          acted_at: new Date().toISOString(),
        },
      });
    }

    const updated = await prisma.gatePass.update({
      where: { id },
      data: { status: "rejected", current_approver_id: null, updated_by: userId ?? null },
      include: includeRelations,
    });

    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: "rejected",
        notes: comment ?? "Rejected",
        changed_by: userId ?? null,
      },
    });

    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "rejected",
        description: comment ?? "Rejected",
      },
    });

    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("rejectGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// -------------------------- DASHBOARD ---------------------------------
export async function dashboardGatePasses(_req: Request, res: Response) {
  try {
    const baseWhere = { deleted_at: null } as const;

    const [total, draft, submitted, pending, approved, released, completed, rejected] =
      await Promise.all([
        prisma.gatePass.count({ where: { ...baseWhere } }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "draft" } }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "submitted" } }),
        prisma.gatePass.count({
          where: {
            ...baseWhere,
            status: {
              in: [
                "pending_supervisor",
                "pending_department_head",
                "pending_vehicle_assignee",
                "pending_general_admin",
                "pending_security",
              ],
            },
          },
        }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "approved" } }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "released" } }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "completed" } }),
        prisma.gatePass.count({ where: { ...baseWhere, status: "rejected" } }),
      ]);

    res.json({
      stats: { total, draft, submitted, pending, approved, released, completed, rejected },
    });
  } catch (err: any) {
    console.error("dashboardGatePasses", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- ACTIVITIES ------------------------------
export async function recentActivities(_req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt((_req.query.limit as string) || "20", 10) || 20, 100);

    const logs = await prisma.gatePassLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        gate_pass: { select: { id: true, control_number: true } },
        user: {
          select: {
            id: true,
            full_name: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    const activities = logs.map((log) => ({
      id: log.id,
      type: log.action,
      action: log.action,
      description: log.description ?? "",
      timestamp: log.created_at,
      gate_pass_id: log.gate_pass_id,
      control_number: log.gate_pass?.control_number ?? null,
      actor: log.user
        ? {
            id: log.user.id,
            name:
              log.user.full_name ||
              `${log.user.first_name ?? ""} ${log.user.last_name ?? ""}`.trim() ||
              log.user.email,
            avatar_url: log.user.avatar_url,
          }
        : null,
    }));

    res.json({ activities });
  } catch (err: any) {
    console.error("recentActivities", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- ANALYTICS --------------------------------
export async function analyticsGatePasses(_req: Request, res: Response) {
  try {
    const all = await prisma.gatePass.findMany({
      where: { deleted_at: null },
      select: {
        status: true,
        priority: true,
        gate_pass_type_id: true,
        purpose_category: true,
        trip: { select: { departure_date: true } },
        employee: {
          select: {
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const monthlyCounts: Record<string, number> = {};
    const monthlyApprovedCounts: Record<string, number> = {};
    const departmentCounts: Record<string, { count: number; department?: any }> = {};

    for (const gp of all) {
      statusCounts[gp.status] = (statusCounts[gp.status] ?? 0) + 1;
      priorityCounts[gp.priority] = (priorityCounts[gp.priority] ?? 0) + 1;
      typeCounts[gp.gate_pass_type_id ?? ""] = (typeCounts[gp.gate_pass_type_id ?? ""] ?? 0) + 1;

      const depDate = gp.trip?.departure_date;
      if (depDate) {
        const ym = depDate.slice(0, 7);
        monthlyCounts[ym] = (monthlyCounts[ym] ?? 0) + 1;
        if (gp.status === "approved" || gp.status === "completed" || gp.status === "released") {
          monthlyApprovedCounts[ym] = (monthlyApprovedCounts[ym] ?? 0) + 1;
        }
      }

      const deptName = gp.employee?.department?.name || "Unknown";
      if (!departmentCounts[deptName]) {
        departmentCounts[deptName] = { count: 0, department: gp.employee?.department };
      }
      departmentCounts[deptName].count++;
    }

    const typeRows = await prisma.gatePassType.findMany();
    const byType = typeRows.map((t) => ({
      type: { id: t.id, name: t.name },
      count: typeCounts[t.id] ?? 0,
    }));

    const monthly = Object.entries(monthlyCounts)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, count]) => ({
        month,
        count,
        approved_count: monthlyApprovedCounts[month] ?? 0,
      }));

    const departmentDistribution = Object.entries(departmentCounts).map(([deptName, data]) => ({
      department: data.department || { id: "unknown", name: deptName },
      count: data.count,
    }));

    const approvalStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    res.json({
      monthlyRequests: monthly,
      departmentDistribution,
      approvalStatus,
      requestTypeDistribution: byType,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      total: all.length,
    });
  } catch (err: any) {
    console.error("analyticsGatePasses", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- TYPES ------------------------------------
export async function listGatePassTypes(_req: Request, res: Response) {
  try {
    const types = await prisma.gatePassType.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    res.json({ types });
  } catch (err: any) {
    console.error("listGatePassTypes", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- PRINT ------------------------------------
export async function printGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const gp = await prisma.gatePass.findFirst({ where: { id, deleted_at: null } });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });

    const now = new Date().toISOString();
    await prisma.gatePass.update({
      where: { id },
      data: {
        print_count: (gp.print_count ?? 0) + 1,
        last_printed_at: now,
      },
    });
    await prisma.gatePassPrintLog.create({
      data: { gate_pass_id: id, printed_by: userId ?? null, copies: 1 },
    });
    res.json({ success: true, print_count: (gp.print_count ?? 0) + 1, last_printed_at: now });
  } catch (err: any) {
    console.error("printGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- RELEASE ----------------------------------
export async function releaseGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const gp = await prisma.gatePass.findFirst({ where: { id, deleted_at: null } });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    if (gp.status !== "approved") {
      return res.status(400).json({ error: `Cannot release from status ${gp.status}` });
    }
    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status: "released",
        released_at: new Date().toISOString(),
        current_approver_id: null,
        updated_by: userId ?? null,
      },
      include: includeRelations,
    });
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: "released",
        notes: "Released by security",
        changed_by: userId ?? null,
      },
    });
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "released",
        description: "Released at gate",
      },
    });
    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("releaseGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- COMPLETE ---------------------------------
export async function completeGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const gp = await prisma.gatePass.findFirst({
      where: { id, deleted_at: null },
      include: { trip: true },
    });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    if (gp.status !== "released") {
      return res.status(400).json({ error: `Cannot complete from status ${gp.status}` });
    }
    const body = req.body ?? {};
    const now = new Date().toISOString();

    // Update trip with actual return info
    if (gp.trip) {
      await prisma.gatePassTrip.update({
        where: { gate_pass_id: id },
        data: {
          actual_return_date: body.actual_return_date ?? now.slice(0, 10),
          actual_return_time: body.actual_return_time ?? now.slice(11, 19),
        },
      });
    }

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status: "completed",
        completed_at: now,
        current_approver_id: null,
        updated_by: userId ?? null,
      },
      include: includeRelations,
    });
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: "completed",
        notes: "Completed on return",
        changed_by: userId ?? null,
      },
    });
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "completed",
        description: "Completed on return",
      },
    });
    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("completeGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

// ---------------------------- CANCEL ----------------------------------
export async function cancelGatePass(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    const gp = await prisma.gatePass.findFirst({ where: { id, deleted_at: null } });
    if (!gp) return res.status(404).json({ error: "Gate pass not found" });
    if (["completed", "cancelled"].includes(gp.status)) {
      return res.status(400).json({ error: `Cannot cancel from status ${gp.status}` });
    }
    const updated = await prisma.gatePass.update({
      where: { id },
      data: { status: "cancelled", current_approver_id: null, updated_by: userId ?? null },
      include: includeRelations,
    });
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: "cancelled",
        notes: "Cancelled",
        changed_by: userId ?? null,
      },
    });
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId ?? null,
        action: "cancelled",
        description: "Cancelled",
      },
    });
    res.json(formatGatePass(updated));
  } catch (err: any) {
    console.error("cancelGatePass", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}
