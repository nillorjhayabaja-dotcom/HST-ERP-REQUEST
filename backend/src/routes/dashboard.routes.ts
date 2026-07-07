import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();

    const [pending, approvedToday, rejectedToday, employees, unread] = await Promise.all([
      prisma.approvalRequest.count({ where: { status: 'pending', deleted_at: null } }),
      prisma.approvalRequest.count({ where: { status: 'approved', updated_at: { gte: iso }, deleted_at: null } }),
      prisma.approvalRequest.count({ where: { status: 'rejected', updated_at: { gte: iso }, deleted_at: null } }),
      prisma.profile.count({ where: { is_active: true, deleted_at: null } }),
      prisma.notification.count({ where: { user_id: userId, is_read: false } }),
    ]);

    res.json({ pending, approvedToday, rejectedToday, employees, unread });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/activity', authenticate, async (req, res) => {
  try {
    const activity = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { created_at: 'desc' },
      select: { id: true, module: true, action: true, entity_type: true, created_at: true },
    });
    res.json(activity);
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;