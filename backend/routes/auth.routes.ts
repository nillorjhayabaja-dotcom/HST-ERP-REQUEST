import { Router } from 'express';
import { signup, signin, refreshToken, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;