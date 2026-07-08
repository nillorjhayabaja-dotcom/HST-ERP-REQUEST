import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roles = await prisma.userRole.findMany({
      include: { profile: { select: { id: true, full_name: true, email: true } } },
      orderBy: { assigned_at: 'desc' },
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('roles', 'create'), async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const userRole = await prisma.userRole.create({
      data: { user_id, role, assigned_by: (req as any).user?.id },
    });
    res.status(201).json(userRole);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePermission('roles', 'delete'), async (req, res) => {
  try {
    await prisma.userRole.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;