import { AuthRequest } from './auth.js';

export function hasPermission(user: AuthRequest['user'], module: string, action: string): boolean {
  if (!user) return false;
  if (user.roles.includes('administrator')) return true;
  return user.permissions.some(p => p === `${module}:${action}` || p === `${module}:*`);
}

export function hasRole(user: AuthRequest['user'], ...roles: string[]): boolean {
  if (!user) return false;
  return user.roles.some(r => roles.includes(r));
}

export const ROLES = {
  ADMIN: 'administrator',
  HR: 'hr',
  SECURITY: 'security',
  ENGINEERING: 'engineering',
  QA: 'qa',
  PRODUCTION: 'production',
  WAREHOUSE: 'warehouse',
  PURCHASING: 'purchasing',
  ACCOUNTING: 'accounting',
  MAINTENANCE: 'maintenance',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee',
  EXECUTIVE: 'executive',
  IT_ADMIN: 'it_administrator',
} as const;

export const PERMISSIONS = {
  DEPARTMENTS_READ: 'departments:read',
  DEPARTMENTS_CREATE: 'departments:create',
  DEPARTMENTS_UPDATE: 'departments:update',
  DEPARTMENTS_DELETE: 'departments:delete',
  POSITIONS_READ: 'positions:read',
  POSITIONS_CREATE: 'positions:create',
  POSITIONS_UPDATE: 'positions:update',
  POSITIONS_DELETE: 'positions:delete',
  PROFILES_READ: 'profiles:read',
  PROFILES_CREATE: 'profiles:create',
  PROFILES_UPDATE: 'profiles:update',
  PROFILES_DELETE: 'profiles:delete',
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_DELETE: 'roles:delete',
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_CREATE: 'permissions:create',
  PERMISSIONS_DELETE: 'permissions:delete',
  WORKFLOWS_READ: 'approval_workflows:read',
  WORKFLOWS_CREATE: 'approval_workflows:create',
  WORKFLOWS_UPDATE: 'approval_workflows:update',
  WORKFLOWS_DELETE: 'approval_workflows:delete',
  REQUESTS_READ: 'approval_requests:read',
  REQUESTS_CREATE: 'approval_requests:create',
  REQUESTS_UPDATE: 'approval_requests:update',
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_UPDATE: 'notifications:update',
  NOTIFICATIONS_DELETE: 'notifications:delete',
  AUDIT_READ: 'audit_logs:read',
  CONTROL_NUMBERS_READ: 'control_numbers:read',
  CONTROL_NUMBERS_CREATE: 'control_numbers:create',
  CONTROL_NUMBERS_UPDATE: 'control_numbers:update',
} as const;