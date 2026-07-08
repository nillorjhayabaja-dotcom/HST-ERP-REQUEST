import type { PortalType } from "@/lib/portal-rbac";
import { getPortalFromRoles, PORTAL_PRIORITY, normalizeRoles } from "@/lib/portal-rbac";
import { getDashboardForPortal, getLayoutPathForPortal } from "@/lib/route-resolvers";

export function resolveRedirectTarget(args: {
  intendedTo?: string;
  preserved?: boolean;
  roles: string[];
  fallbackPortal?: PortalType;
}): { to: string; portal: PortalType | null } {
  const normalizedRoles = normalizeRoles(args.roles);
  const portal = getPortalFromRoles(normalizedRoles) ?? args.fallbackPortal ?? null;
  if (!portal) {
    return { to: "/auth", portal: null };
  }

  // If intended destination exists and is within the user’s portal, preserve it.
  if (args.preserved && args.intendedTo) {
    const layoutPrefix = getLayoutPathForPortal(portal);
    if (
      args.intendedTo === getDashboardForPortal(portal) ||
      args.intendedTo.startsWith(layoutPrefix + "/") ||
      args.intendedTo.startsWith(layoutPrefix)
    ) {
      return { to: args.intendedTo, portal };
    }
  }

  return { to: getDashboardForPortal(portal), portal };
}

export async function resolveRedirectAfterLogin(args: {
  roles: string[];
  intendedTo?: string;
  preserveIntendedTo?: boolean;
}): Promise<{ to: string; portal: PortalType | null }> {
  return resolveRedirectTarget({
    roles: args.roles,
    intendedTo: args.intendedTo,
    preserved: !!args.preserveIntendedTo,
  });
}

export function chooseBestPortal(roles: string[]): PortalType | null {
  const normalizedRoles = normalizeRoles(roles);
  // Mirror getPortalFromRoles but explicit for readability
  return getPortalFromRoles(normalizedRoles);
}
