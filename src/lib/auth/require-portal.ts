import { redirect } from "@tanstack/react-router";

import { apiClient } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth-helper";
import {
  ROLE_TO_PORTAL,
  applyMockRoleOverride,
  resolvePortalFromRoles,
  PORTALS,
  type PortalSlug,
} from "@/lib/roles/role-config";

/**
 * Route guard for portal layouts.
 *
 * - Not signed in → /auth
 * - Wrong portal → /forbidden
 * - firstLogin flag → /complete-profile (mock: localStorage.hst_first_login === "true")
 *
 * Admin-tier roles (super-admin, admin) can access any portal.
 */
export async function requirePortal(portal: PortalSlug): Promise<{ roles: string[] }> {
  if (!isAuthenticated()) {
    throw redirect({ to: "/auth" as const });
  }

  let roles: string[] = [];
  try {
    const res = await apiClient.get<{ roles: string[] }>("/auth/profile");
    if (res.error || !res.data) {
      throw redirect({ to: "/auth" as const });
    }
    roles = res.data.roles ?? [];
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    throw redirect({ to: "/auth" as const });
  }

  // Mock first-login flow (frontend-only until backend surfaces the flag)
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem("hst_first_login") === "true") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw redirect({ to: "/complete-profile" as any });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
    }
  }

  const effectiveRoles = applyMockRoleOverride(roles);
  const userPortal = resolvePortalFromRoles(effectiveRoles);

  // Admin tier can view any portal
  const isAdminTier = effectiveRoles.some((r) => {
    const p = ROLE_TO_PORTAL[r?.toLowerCase()];
    return p === "super-admin" || p === "admin";
  });

  if (!isAdminTier && userPortal !== portal) {
    throw redirect({ to: "/forbidden" as const });
  }

  return { roles: effectiveRoles };
}

export function getPortalDefinition(portal: PortalSlug) {
  return PORTALS[portal];
}
