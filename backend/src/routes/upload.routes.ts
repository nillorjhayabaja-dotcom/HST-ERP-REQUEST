import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/multiple', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploaded = files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      url: `/uploads/${f.filename}`,
    }));
    res.status(201).json(uploaded);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;