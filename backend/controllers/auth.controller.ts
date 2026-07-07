import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingProfile = await prisma.profile.findFirst({
      where: { email },
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profile = await prisma.profile.create({
      data: {
        email,
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
      },
    });

    const existingUsers = await prisma.profile.count();
    if (existingUsers === 1) {
      await prisma.userRole.create({
        data: {
          user_id: profile.id,
          role: 'administrator',
        },
      });
    } else {
      await prisma.userRole.create({
        data: {
          user_id: profile.id,
          role: 'employee',
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { userId: profile.id, email: profile.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const refreshToken = jwt.sign(
      { userId: profile.id },
      refreshSecret || jwtSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        // Store refresh token in a separate table if needed
      },
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const profile = await prisma.profile.findFirst({
      where: { email },
      include: {
        user_roles: true,
      },
    });

    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { userId: profile.id, email: profile.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const refreshToken = jwt.sign(
      { userId: profile.id },
      refreshSecret || jwtSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
        roles: profile.user_roles.map(ur => ur.role),
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtSecret = process.env.JWT_SECRET;

    if (!refreshSecret || !jwtSecret) {
      throw new Error('JWT secrets are not defined');
    }

    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };

    const profile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      include: {
        user_roles: true,
      },
    });

    if (!profile) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = jwt.sign(
      { userId: profile.id, email: profile.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: profile.id },
      refreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user?.id },
      include: {
        department: true,
        position: true,
        user_roles: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      date_hired: profile.date_hired,
      employment_status: profile.employment_status,
      is_active: profile.is_active,
      department: profile.department,
      position: profile.position,
      roles: profile.user_roles.map(ur => ur.role),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, phone, avatar_url } = req.body;

    const full_name = `${first_name} ${last_name}`;

    const profile = await prisma.profile.update({
      where: { id: (req as AuthRequest).user?.id },
      data: {
        first_name,
        last_name,
        full_name,
        phone,
        avatar_url,
      },
    });

    return res.status(200).json({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
