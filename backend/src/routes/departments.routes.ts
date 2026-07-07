import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('departments', 'read'), async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { deleted_at: null },
      include: {
        parent: true,
        children: true,
        _count: { select: { profiles: true, positions: true } },
      },
    });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, requirePermission('departments', 'read'), async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        children: true,
        profiles: true,
        positions: true,
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('departments', 'create'), async (req, res) => {
  try {
    const { code, name, description, parent_id, is_active } = req.body;

    const department = await prisma.department.create({
      data: {
        code,
        name,
        description,
        parent_id,
        is_active: is_active ?? true,
        created_by: (req as any).user?.id,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requirePermission('departments', 'update'), async (req, res) => {
  try {
    const { code, name, description, parent_id, is_active } = req.body;

    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        code,
        name,
        description,
        parent_id,
        is_active,
        updated_by: (req as any).user?.id,
      },
    });

    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePermission('departments', 'delete'), async (req, res) => {
  try {
    await prisma.department.update({
      where: { id: req.params.id },
      data: {
        deleted_at: new Date().toISOString(),
        updated_by: (req as any).user?.id,
      },
    });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;