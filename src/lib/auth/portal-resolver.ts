import { apiClient } from "@/lib/api-client";
import type { PortalType } from "@/lib/portal-rbac";
import { getPortalFromRoles } from "@/lib/portal-rbac";
import { normalizeRoles } from "@/lib/portal-rbac";

export async function resolveUserPortal(): Promise<{ portal: PortalType | null; roles: string[] }> {
  const profile = await apiClient.get<{ roles: string[] }>("/auth/profile");
  if (profile.error) {
    return { portal: null, roles: [] };
  }

  const roles = normalizeRoles(profile.data?.roles || []);
  const portal = getPortalFromRoles(roles);
  return { portal, roles };
}
