import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import {
  createGatePass,
  getGatePasses,
  getGatePassById,
  updateGatePass,
  deleteGatePass,
  submitGatePass,
  getGatePassTypes,
  generateQRCode,
  getDashboardStats
} from '../controllers/gate-passes.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Gate Pass Types
router.get('/types', requirePermission('gate_passes', 'read'), getGatePassTypes);

// Dashboard Stats
router.get('/dashboard/stats', requirePermission('gate_passes', 'read'), getDashboardStats);

// CRUD operations
router.post('/', requirePermission('gate_passes', 'create'), createGatePass);
router.get('/', requirePermission('gate_passes', 'read'), getGatePasses);
router.get('/:id', requirePermission('gate_passes', 'read'), getGatePassById);
router.put('/:id', requirePermission('gate_passes', 'update'), updateGatePass);
router.delete('/:id', requirePermission('gate_passes', 'delete'), deleteGatePass);

// Actions
router.post('/:id/submit', requirePermission('gate_passes', 'update'), submitGatePass);
router.post('/:id/qr-code', requirePermission('gate_passes', 'read'), generateQRCode);

// Security Guard Routes
router.post('/:id/release', requirePermission('gate_passes', 'update'), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as any).user?.id;
    const { guard_name, notes } = req.body;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id: id }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (gatePass.status !== 'approved') {
      return res.status(400).json({ error: 'Gate pass must be approved before release' });
    }

    const updatedGatePass = await prisma.gatePass.update({
      where: { id: id },
      data: {
        status: 'released',
        released_at: new Date().toISOString()
      }
    });

    // Create status history
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: 'released',
        notes: `Released by ${guard_name || 'Security'}. ${notes || ''}`,
        changed_by: userId,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : []
      } as any
    });

    // Create log
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId,
        action: 'released',
        description: `Gate pass released by security guard: ${guard_name || 'Unknown'}`,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
        user_agent: req.get('user-agent') || undefined
      } as any
    });

    res.json(updatedGatePass);
  } catch (error) {
    console.error('Error releasing gate pass:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/return', requirePermission('gate_passes', 'update'), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as any).user?.id;
    const { guard_name, notes } = req.body;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id: id }
    });

    if (!gatePass) {
      return res.status(404).json({ error: 'Gate pass not found' });
    }

    if (gatePass.status !== 'released') {
      return res.status(400).json({ error: 'Gate pass must be released before return' });
    }

    const updatedGatePass = await prisma.gatePass.update({
      where: { id: id },
      data: {
        status: 'completed',
        actual_return_date: new Date().toISOString().split('T')[0],
        actual_return_time: new Date().toISOString().split('T')[1].split('.')[0],
        completed_at: new Date().toISOString()
      }
    });

    // Create status history
    await prisma.gatePassStatusHistory.create({
      data: {
        gate_pass_id: id,
        status: 'completed',
        notes: `Returned by ${guard_name || 'Security'}. ${notes || ''}`,
        changed_by: userId,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : []
      } as any
    });

    // Create log
    await prisma.gatePassLog.create({
      data: {
        gate_pass_id: id,
        user_id: userId,
        action: 'returned',
        description: `Gate pass returned by security guard: ${guard_name || 'Unknown'}`,
        ip_address: req.ip ? (Array.isArray(req.ip) ? req.ip : [req.ip]) : [],
        user_agent: req.get('user-agent') || undefined
      } as any
    });

    res.json(updatedGatePass);
  } catch (error) {
    console.error('Error returning gate pass:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// QR Code Verification
router.post('/verify-qr', requirePermission('gate_passes', 'read'), async (req, res) => {
  try {
    const { qr_data } = req.body;

    if (!qr_data) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    let qrData;
    try {
      qrData = JSON.parse(qr_data);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    const gatePass = await prisma.gatePass.findUnique({
      where: { id: qrData.id },
      include: {
        employee: true,
        gate_pass_type: true,
        vehicle: true
      }
    });

    if (!gatePass) {
      return res.status(404).json({ 
        error: 'Invalid Pass',
        message: 'Gate pass not found'
      });
    }

    if (gatePass.deleted_at) {
      return res.status(404).json({ 
        error: 'Invalid Pass',
        message: 'Gate pass has been cancelled'
      });
    }

    if (gatePass.status === 'rejected') {
      return res.status(400).json({ 
        error: 'Rejected',
        message: 'Gate pass has been rejected'
      });
    }

    if (gatePass.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Cancelled',
        message: 'Gate pass has been cancelled'
      });
    }

    if (gatePass.status === 'expired') {
      return res.status(400).json({ 
        error: 'Expired',
        message: 'Gate pass has expired'
      });
    }

    if (gatePass.status === 'completed') {
      return res.status(400).json({ 
        error: 'Already Used',
        message: 'Gate pass has already been used'
      });
    }

    if (gatePass.status !== 'approved' && gatePass.status !== 'released') {
      return res.status(400).json({ 
        error: 'Invalid Status',
        message: `Gate pass status is: ${gatePass.status}`
      });
    }

    res.json({
      valid: true,
      gate_pass: gatePass
    });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;