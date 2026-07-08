import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requirePermission('control_numbers', 'read'), async (req, res) => {
  try {
    const settings = await prisma.controlNumberSetting.findMany({ orderBy: { module: 'asc' } });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching control numbers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:module', authenticate, requirePermission('control_numbers', 'read'), async (req, res) => {
  try {
    const setting = await prisma.controlNumberSetting.findUnique({ where: { module: String(req.params.module) } });
    if (!setting) return res.status(404).json({ error: 'Control number setting not found' });
    res.json(setting);
  } catch (error) {
    console.error('Error fetching control number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePermission('control_numbers', 'create'), async (req, res) => {
  try {
    const { module, prefix, padding, next_sequence, format_template, year } = req.body;
    const setting = await prisma.controlNumberSetting.create({
      data: {
        module, prefix, padding: padding ?? 6, next_sequence: next_sequence ?? 1,
        format_template, year: year ?? new Date().getFullYear(),
        updated_by: (req as any).user?.id,
      },
    });
    res.status(201).json(setting);
  } catch (error) {
    console.error('Error creating control number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requirePermission('control_numbers', 'update'), async (req, res) => {
  try {
    const { prefix, padding, next_sequence, format_template, year } = req.body;
    const setting = await prisma.controlNumberSetting.update({
      where: { id: String(req.params.id) },
      data: { prefix, padding, next_sequence, format_template, year, updated_by: (req as any).user?.id },
    });
    res.json(setting);
  } catch (error) {
    console.error('Error updating control number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;