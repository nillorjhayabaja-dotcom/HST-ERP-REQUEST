import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('notifications', 'read'), async (req, res) => {
  try {
    const { is_read, type, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { user_id: (req as any).user?.id };
    if (is_read !== undefined) where.is_read = is_read === 'true';
    if (type) where.type = type;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where, skip, take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    res.json({ notifications, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, requirePermission('notifications', 'read'), async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', authenticate, requirePermission('notifications', 'update'), async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true, read_at: new Date().toISOString() },
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePermission('notifications', 'delete'), async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;