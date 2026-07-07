import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, department_id, is_active } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { deleted_at: null };
    if (search) {
      where.OR = [
        { first_name: { contains: search as string, mode: 'insensitive' } },
        { last_name: { contains: search as string, mode: 'insensitive' } },
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (department_id) where.department_id = department_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where, skip, take: Number(limit),
        include: { department: true, position: true, supervisor: { select: { id: true, full_name: true } }, user_roles: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.profile.count({ where }),
    ]);
    res.json({ profiles, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id },
      include: { department: true, position: true, supervisor: { select: { id: true, full_name: true } }, subordinates: { select: { id: true, full_name: true } }, user_roles: true },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = req.body;
    const full_name = `${data.first_name} ${data.last_name}`;
    const profile = await prisma.profile.create({
      data: { ...data, full_name, created_by: (req as any).user?.id },
    });
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = req.body;
    if (data.first_name || data.last_name) {
      data.full_name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    }
    const profile = await prisma.profile.update({
      where: { id: req.params.id },
      data: { ...data, updated_by: (req as any).user?.id },
    });
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.profile.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date().toISOString(), updated_by: (req as any).user?.id },
    });
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;