import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      include: { role_permissions: { include: { permission: true } } },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('permissions', 'create'), async (req, res) => {
  try {
    const { module, action, description } = req.body;
    const permission = await prisma.permission.create({
      data: { module, action, description },
    });
    res.status(201).json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/assign', authenticate, requirePermission('permissions', 'create'), async (req, res) => {
  try {
    const { role, permission_id } = req.body;
    const rolePermission = await prisma.rolePermission.create({
      data: { role, permission_id },
    });
    res.status(201).json(rolePermission);
  } catch (error) {
    console.error('Error assigning permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/assign/:id', authenticate, requirePermission('permissions', 'delete'), async (req, res) => {
  try {
    await prisma.rolePermission.delete({ where: { id: req.params.id } });
    res.json({ message: 'Permission unassigned successfully' });
  } catch (error) {
    console.error('Error unassigning permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;