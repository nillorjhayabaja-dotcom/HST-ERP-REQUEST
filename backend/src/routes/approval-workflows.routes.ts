import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('approval_workflows', 'read'), async (req, res) => {
  try {
    const { module, is_active } = req.query;
    const where: any = { deleted_at: null };
    if (module) where.module = module;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    const workflows = await prisma.approvalWorkflow.findMany({
      where,
      include: { steps: { orderBy: { step_order: 'asc' } }, _count: { select: { requests: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, requirePermission('approval_workflows', 'read'), async (req, res) => {
  try {
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: req.params.id },
      include: { steps: { orderBy: { step_order: 'asc' } }, requests: true },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('approval_workflows', 'create'), async (req, res) => {
  try {
    const { name, description, module, is_active, steps } = req.body;
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        name, description, module, is_active: is_active ?? true,
        created_by: (req as any).user?.id,
        steps: { create: steps || [] },
      },
      include: { steps: true },
    });
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requirePermission('approval_workflows', 'update'), async (req, res) => {
  try {
    const { name, description, module, is_active, steps } = req.body;
    const workflow = await prisma.approvalWorkflow.update({
      where: { id: req.params.id },
      data: {
        name, description, module, is_active,
        updated_by: (req as any).user?.id,
        steps: steps ? { deleteMany: {}, create: steps } : undefined,
      },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    });
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePermission('approval_workflows', 'delete'), async (req, res) => {
  try {
    await prisma.approvalWorkflow.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date().toISOString(), updated_by: (req as any).user?.id },
    });
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;