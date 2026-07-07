import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    console.log('Signup attempt:', { email, first_name, last_name, passwordProvided: !!password });
    
    if (!email || !password || !first_name || !last_name) {
      console.log('Missing fields:', { email: !!email, password: !!password, first_name: !!first_name, last_name: !!last_name });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const existing = await prisma.profile.findFirst({ where: { email } });
    if (existing) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profile = await prisma.profile.create({
      data: { email, password: hashedPassword, first_name, last_name, full_name: `${first_name} ${last_name}` },
    });

    const count = await prisma.profile.count();
    await prisma.userRole.create({
      data: { user_id: profile.id, role: count === 1 ? 'administrator' : 'employee' },
    });

    const tokens = generateTokens(profile.id, profile.email!);
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: profile.id, email: profile.email, first_name, last_name, full_name: profile.full_name },
      ...tokens,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const profile = await prisma.profile.findFirst({ where: { email }, include: { user_roles: true } });
    if (!profile) return res.status(401).json({ error: 'Invalid email or password' });

    if (!profile.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, profile.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = generateTokens(profile.id, profile.email!);
    res.json({
      user: {
        id: profile.id, email: profile.email, first_name: profile.first_name,
        last_name: profile.last_name, full_name: profile.full_name,
        roles: profile.user_roles.map((r: { role: string }) => r.role),
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: rt } = req.body;
    if (!rt) return res.status(401).json({ error: 'Refresh token required' });

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    if (!refreshSecret || !jwtSecret) throw new Error('JWT secrets not defined');

    const decoded = jwt.verify(rt, refreshSecret) as { userId: string };
    const profile = await prisma.profile.findUnique({ where: { id: decoded.userId }, include: { user_roles: true } });
    if (!profile) return res.status(401).json({ error: 'Invalid refresh token' });

    const tokens = generateTokens(profile.id, profile.email!);
    res.json(tokens);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const profile = await prisma.profile.findFirst({ where: { email } });
    if (profile) {
      const resetToken = jwt.sign({ userId: profile.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      await sendPasswordResetEmail(email, resetToken);
    }
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const hashed = await bcrypt.hash(new_password, 10);
    await prisma.profile.update({ where: { id: decoded.userId }, data: { password: hashed } });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user?.id },
      include: { department: true, position: true, user_roles: true },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({
      id: profile.id, email: profile.email, first_name: profile.first_name, last_name: profile.last_name,
      full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url,
      date_hired: profile.date_hired, employment_status: profile.employment_status, is_active: profile.is_active,
      department: profile.department, position: profile.position, roles: profile.user_roles.map((r: { role: string }) => r.role),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { first_name, last_name, phone, avatar_url } = req.body;
    const full_name = `${first_name} ${last_name}`;
    const profile = await prisma.profile.update({
      where: { id: req.user?.id },
      data: { first_name, last_name, full_name, phone, avatar_url },
    });
    res.json({
      id: profile.id, email: profile.email, first_name: profile.first_name, last_name: profile.last_name,
      full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function generateTokens(userId: string, email: string) {
  const jwtSecret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
  const token = jwt.sign({ userId, email }, jwtSecret, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });
  return { token, refreshToken };
}