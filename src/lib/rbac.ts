/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * Role hierarchy levels (lower number = higher privilege)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
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

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Human-readable labels for roles
 */
export const ROLE_LABELS: Record<string, string> = {
  super_administrator: "Super Administrator",
  system_administrator: "System Administrator",
  it_support: "IT Support",
  executive: "Executive",
  department_manager: "Department Manager",
  department_supervisor: "Department Supervisor",
  approver: "Approver",
  gad: "General Administration (GAD)",
  hr_officer: "HR Officer",
  vehicle_coordinator: "Vehicle Coordinator",
  purchasing_officer: "Purchasing Officer",
  warehouse_officer: "Warehouse Officer",
  auditor: "Auditor",
  security_guard: "Security Guard",
  employee: "Employee",
};

/**
 * Role group categories for UI organization
 */
export const ROLE_GROUPS: Record<string, { label: string; roles: string[]; color: string }> = {
  administration: {
    label: "Administration",
    roles: ["super_administrator", "system_administrator", "it_support"],
    color: "text-red-600",
  },
  management: {
    label: "Management",
    roles: ["executive", "department_manager", "department_supervisor", "approver"],
    color: "text-purple-600",
  },
  operations: {
    label: "Operations",
    roles: ["gad", "hr_officer", "vehicle_coordinator", "purchasing_officer", "warehouse_officer"],
    color: "text-blue-600",
  },
  security: {
    label: "Security",
    roles: ["security_guard"],
    color: "text-amber-600",
  },
  oversight: {
    label: "Oversight",
    roles: ["auditor"],
    color: "text-green-600",
  },
  employee: {
    label: "Employee",
    roles: ["employee"],
    color: "text-gray-600",
  },
};

/**
 * Check if user has a specific role
 */
export function hasRole(roles: string[], role: string): boolean {
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: string[], allowedRoles: string[]): boolean {
  return roles.some(role => allowedRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(roles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every(role => roles.includes(role));
}

/**
 * Check if user has sufficient role level (lower number = higher privilege)
 * e.g., hasSufficientLevel(userRoles, 5) checks if user is department_manager or above
 */
export function hasSufficientLevel(userRoles: string[], maxLevel: number): boolean {
  for (const role of userRoles) {
    const level = ROLE_HIERARCHY[role];
    if (level !== undefined && level <= maxLevel) {
      return true;
    }
  }
  return false;
}

/**
 * Get the highest privilege level among user's roles
 */
export function getHighestLevel(userRoles: string[]): number {
  let highest = 999;
  for (const role of userRoles) {
    const level = ROLE_HIERARCHY[role];
    if (level !== undefined && level < highest) {
      highest = level;
    }
  }
  return highest;
}

/**
 * Get the best (highest privilege) role label for a user
 */
export function getPrimaryRoleLabel(roles: string[]): string {
  const highest = getHighestLevel(roles);
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level === highest && roles.includes(role)) {
      return ROLE_LABELS[role] || role;
    }
  }
  return "Unknown Role";
}

/**
 * Get all role labels for a user
 */
export function getRoleLabels(roles: string[]): string[] {
  return roles.map(role => ROLE_LABELS[role] || role);
}

/**
 * Check if user is an administrator (super or system)
 */
export function isAdministrator(roles: string[]): boolean {
  return roles.includes("super_administrator") || roles.includes("system_administrator");
}

/**
 * Check if user is a security guard
 */
export function isSecurityGuard(roles: string[]): boolean {
  return roles.includes("security_guard");
}

/**
 * Check if user is an employee (only has employee role)
 */
export function isOnlyEmployee(roles: string[]): boolean {
  return roles.length === 1 && roles[0] === "employee";
}

/**
 * Check if user can approve requests
 */
export function canApprove(roles: string[]): boolean {
  return hasSufficientLevel(roles, 7); // approver and above
}

/**
 * Check if user can manage users
 */
export function canManageUsers(roles: string[]): boolean {
  return hasSufficientLevel(roles, 3); // it_support and above
}

/**
 * Check if user can view all data (not just their own)
 */
export function canViewAll(roles: string[]): boolean {
  return hasSufficientLevel(roles, 5); // department_manager and above
}

/**
 * Get the sidebar variant based on user's primary role
 */
export function getSidebarVariant(roles: string[]): "admin" | "security" | "employee" | "default" {
  if (isAdministrator(roles)) return "admin";
  if (isSecurityGuard(roles)) return "security";
  if (roles.includes("employee") && roles.length === 1) return "employee";
  return "default";
}

/**
 * Permission check function for use in components
 */
export function checkPermission(
  userPermissions: string[],
  userRoles: string[],
  module: string,
  action: string
): boolean {
  // Administrators bypass permission checks
  if (isAdministrator(userRoles)) return true;
  
  return userPermissions.some(
    p => p === `${module}:${action}` || p === `${module}:*`
  );
}