import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    department_id?: string | null;
    position_id?: string | null;
  };
}

/**
 * Role hierarchy levels (lower number = higher privilege)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  super_administrator: 1,
  system_administrator: 2,
  it_support: 3,
  executive: 4,
  department_manager: 5,
  department_supervisor: 6,
  approver: 7,
  gad: 8,
  hr_officer: 9,
  vehicle_coordinator: 10,
  purchasing_officer: 11,
  warehouse_officer: 12,
  auditor: 13,
  security_guard: 14,
  employee: 15,
};

/**
 * Check if a role has sufficient hierarchy level to access
 * e.g. a super_administrator (level 1) can access anything
 */
export function hasSufficientRoleLevel(userRoles: string[], requiredLevel: number): boolean {
  for (const role of userRoles) {
    const level = ROLE_HIERARCHY[role];
    if (level !== undefined && level <= requiredLevel) {
      return true;
    }
  }
  return false;
}

/**
 * Get the highest privilege level among user's roles
 */
export function getHighestRoleLevel(userRoles: string[]): number {
  let highest = 999;
  for (const role of userRoles) {
    const level = ROLE_HIERARCHY[role];
    if (level !== undefined && level < highest) {
      highest = level;
    }
  }
  return highest;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Invalid token format" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };

    const profile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        department_id: true,
        position_id: true,
        is_active: true,
      },
    });

    if (!profile || !profile.is_active) {
      return res.status(401).json({ error: "Unauthorized: Account is inactive or not found" });
    }

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: decoded.userId },
      select: { role: true },
    });

    const roles = userRoles.map((ur: { role: string }) => ur.role);

    const permissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          in: roles as any,
        },
      },
      include: {
        permission: true,
      },
    });

    const uniquePermissions = [
      ...new Set(permissions.map((p: any) => `${p.permission.module}:${p.permission.action}`)),
    ];

    req.user = {
      id: profile.id,
      email: profile.email || decoded.email,
      roles,
      permissions: uniquePermissions as string[],
      department_id: profile.department_id,
      position_id: profile.position_id,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

export const requirePermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Super administrator bypasses all permission checks
    if (req.user.roles.includes("super_administrator")) {
      return next();
    }

    // System administrator can also bypass
    if (req.user.roles.includes("system_administrator")) {
      return next();
    }

    const hasPermission = req.user.permissions.some(
      (p) => p === `${module}:${action}` || p === `${module}:*`,
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    // Also check if the user has a higher role that can supersede
    if (!hasRole) {
      // Super admin and sys admin can do anything
      if (
        req.user.roles.includes("super_administrator") ||
        req.user.roles.includes("system_administrator")
      ) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }

    next();
  };
};

/**
 * Require that user has a role at or above a specific hierarchy level.
 * e.g., requireRoleLevel(5) allows department_manager and above
 */
export const requireRoleLevel = (maxLevel: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (hasSufficientRoleLevel(req.user.roles, maxLevel)) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden: Insufficient role level" });
  };
};

/**
 * Department scoped access - user can only access data from their department
 */
export const requireDepartmentAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // High level roles bypass department scoping
  if (hasSufficientRoleLevel(req.user.roles, 5)) {
    return next();
  }

  // Attach department_id for scoped queries
  (req as any).userDepartmentId = req.user.department_id;
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };

    const profile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, department_id: true, position_id: true, is_active: true },
    });

    if (!profile || !profile.is_active) {
      return next();
    }

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: decoded.userId },
      select: { role: true },
    });

    const roles = userRoles.map((ur: { role: string }) => ur.role);

    const permissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          in: roles as any,
        },
      },
      include: {
        permission: true,
      },
    });

    const uniquePermissions = [
      ...new Set(permissions.map((p: any) => `${p.permission.module}:${p.permission.action}`)),
    ];

    req.user = {
      id: profile.id,
      email: profile.email || decoded.email,
      roles,
      permissions: uniquePermissions as string[],
      department_id: profile.department_id,
      position_id: profile.position_id,
    };

    next();
  } catch (error) {
    next();
  }
};
