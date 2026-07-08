export const PORTAL_TYPES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
  SECURITY: "security",
  EXECUTIVE: "executive",
} as const;

export type PortalType = (typeof PORTAL_TYPES)[keyof typeof PORTAL_TYPES];

/**
 * Central mapping for roles (case-insensitive) to a portal.
 * NOTE: Strings represent backend role identifiers exactly as stored in DB.
 */
export const PORTAL_ROLES: Record<PortalType, readonly string[]> = {
  employee: ["employee", "supervisor", "manager"],
  admin: ["super_admin", "administrator", "gad", "hr", "it_support"],
  security: ["security"],
  executive: ["executive"],
};

/**
 * Default dashboard route per portal.
 */
export const PORTAL_DEFAULT_DASHBOARD: Record<PortalType, string> = {
  employee: "/employee-portal/dashboard",
  admin: "/admin/dashboard",
  security: "/security/dashboard",
  executive: "/executive/dashboard",
};

/**
 * Priority order for choosing a single portal if user has multiple roles.
 * Lower index = higher priority.
 */
export const PORTAL_PRIORITY: readonly PortalType[] = [
  PORTAL_TYPES.ADMIN,
  PORTAL_TYPES.SECURITY,
  PORTAL_TYPES.EXECUTIVE,
  PORTAL_TYPES.EMPLOYEE,
];

export function normalizeRole(role: string): string {
  return role?.trim().toLowerCase();
}

export function normalizeRoles(roles: string[] | undefined | null): string[] {
  return (roles ?? []).map(normalizeRole).filter(Boolean);
}

export function getPortalFromRoles(roles: string[]): PortalType | null {
  const normalized = normalizeRoles(roles);
  if (normalized.length === 0) return null;

  const roleSet = new Set(normalized);

  // Choose portal based on priority + role existence
  for (const portal of PORTAL_PRIORITY) {
    const allowed = PORTAL_ROLES[portal].map(normalizeRole);
    if (allowed.some((r) => roleSet.has(r))) return portal;
  }

  return null;
}

export function isRoleAllowedInPortal(portal: PortalType, role: string): boolean {
  const normalizedRole = normalizeRole(role);
  const allowed = PORTAL_ROLES[portal].map(normalizeRole);
  return allowed.includes(normalizedRole);
}
