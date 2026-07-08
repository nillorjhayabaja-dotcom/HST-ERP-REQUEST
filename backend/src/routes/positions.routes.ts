import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('positions', 'read'), async (req, res) => {
  try {
    const { department_id, is_active } = req.query;
    const where: any = { deleted_at: null };
    if (department_id) where.department_id = department_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    const positions = await prisma.position.findMany({
      where,
      include: { department: true, _count: { select: { profiles: true } } },
      orderBy: { title: 'asc' },
    });
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, requirePermission('positions', 'read'), async (req, res) => {
  try {
    const position = await prisma.position.findUnique({
      where: { id: String(req.params.id) },
      include: { department: true, profiles: true },
    });
    if (!position) return res.status(404).json({ error: 'Position not found' });
    res.json(position);
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('positions', 'create'), async (req, res) => {
  try {
    const { code, title, department_id, is_active } = req.body;
    const position = await prisma.position.create({
      data: { code, title, department_id, is_active: is_active ?? true, created_by: (req as any).user?.id },
    });
    res.status(201).json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requirePermission('positions', 'update'), async (req, res) => {
  try {
    const { code, title, department_id, is_active } = req.body;
    const position = await prisma.position.update({
      where: { id: String(req.params.id) },
      data: { code, title, department_id, is_active, updated_by: (req as any).user?.id },
    });
    res.json(position);
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePermission('positions', 'delete'), async (req, res) => {
  try {
    await prisma.position.update({
      where: { id: String(req.params.id) },
      data: { deleted_at: new Date().toISOString(), updated_by: (req as any).user?.id },
    });
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;