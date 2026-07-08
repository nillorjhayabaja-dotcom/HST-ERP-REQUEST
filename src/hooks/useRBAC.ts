import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth-helper";
import {
  ROLE_HIERARCHY,
  ROLE_LABELS,
  hasRole,
  hasAnyRole,
  hasSufficientLevel,
  isAdministrator,
  isSecurityGuard,
  canApprove,
  canManageUsers,
  canViewAll,
  getPrimaryRoleLabel,
  getRoleLabels,
  checkPermission,
} from "@/lib/rbac";

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_hired?: string;
  employment_status?: string;
  is_active?: boolean;
  department?: { id: string; name: string; code: string } | null;
  position?: { id: string; title: string } | null;
  roles: string[];
  permissions: string[];
}

/**
 * Hook to get the current user's profile with roles and permissions
 */
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>("/auth/profile");
      if (response.error) {
        throw new Error(response.error);
      }
      // Normalize permissions to array format
      const data = response.data!;
      return {
        ...data,
        permissions: data.permissions || [],
        roles: data.roles || [],
      };
    },
    retry: false,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook providing RBAC helper functions based on current user's roles/permissions.
 * Returns undefined if still loading, null if not authenticated.
 */
export function useRBAC() {
  const { data: profile, isLoading, isError } = useUserProfile();

  if (isLoading) return { loading: true as const, user: undefined };
  if (isError || !profile) return { loading: false as const, user: null };

  const roles = profile.roles || [];
  const permissions = profile.permissions || [];

  return {
    loading: false as const,
    user: profile,
    roles,
    permissions,

    // Basic checks
    hasRole: (role: string) => hasRole(roles, role),
    hasAnyRole: (allowedRoles: string[]) => hasAnyRole(roles, allowedRoles),
    hasSufficientLevel: (level: number) => hasSufficientLevel(roles, level),

    // Convenience checks
    isAdmin: isAdministrator(roles),
    isSecurityGuard: isSecurityGuard(roles),
    canApprove: canApprove(roles),
    canManageUsers: canManageUsers(roles),
    canViewAll: canViewAll(roles),

    // Labels
    primaryRole: getPrimaryRoleLabel(roles),
    roleLabels: getRoleLabels(roles),

    // Permission check
    can: (module: string, action: string) => checkPermission(permissions, roles, module, action),

    // Hierarchy level
    hierarchyLevel: (() => {
      let highest = 999;
      for (const role of roles) {
        const level = ROLE_HIERARCHY[role];
        if (level !== undefined && level < highest) highest = level;
      }
      return highest;
    })(),
  };
}

/**
 * Simple hook to check if user has a specific permission
 */
export function usePermission(module: string, action: string) {
  const rbac = useRBAC();

  if (rbac.loading || !rbac.user) return false;
  return rbac.can(module, action);
}

/**
 * Simple hook to check if user has a specific role
 */
export function useHasRole(role: string) {
  const rbac = useRBAC();

  if (rbac.loading || !rbac.user) return false;
  return rbac.hasRole(role);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]) {
  const rbac = useRBAC();

  if (rbac.loading || !rbac.user) return false;
  return rbac.hasAnyRole(roles);
}
