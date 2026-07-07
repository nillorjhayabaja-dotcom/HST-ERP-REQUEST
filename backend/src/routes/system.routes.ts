import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createBackup, listBackups } from '../services/backup.service.js';

const router = Router();

router.post('/backup', authenticate, requireRole('administrator', 'it_administrator'), async (req, res) => {
  try {
    const file = await createBackup();
    res.json({ message: 'Backup created', file });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

router.get('/backups', authenticate, requireRole('administrator', 'it_administrator'), async (req, res) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

router.get('/health', authenticate, requireRole('administrator', 'it_administrator'), async (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  });
});

export default router;