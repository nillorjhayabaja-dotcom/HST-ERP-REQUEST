import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: decoded.userId },
      select: { role: true },
    });

    const roles = userRoles.map(ur => ur.role);

    const permissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          in: roles,
        },
      },
      include: {
        permission: true,
      },
    });

    const uniquePermissions = [...new Set(permissions.map(p => `${p.permission.module}:${p.permission.action}`))];

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles,
      permissions: uniquePermissions,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requirePermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasPermission = req.user.permissions.some(
      p => p === `${module}:${action}` || p === `${module}:*` || req.user?.roles.includes('administrator')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: decoded.userId },
      select: { role: true },
    });

    const roles = userRoles.map(ur => ur.role);

    const permissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          in: roles,
        },
      },
      include: {
        permission: true,
      },
    });

    const uniquePermissions = [...new Set(permissions.map(p => `${p.permission.module}:${p.permission.action}`))];

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles,
      permissions: uniquePermissions,
    };

    next();
  } catch (error) {
    next();
  }
};