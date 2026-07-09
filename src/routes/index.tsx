import { createFileRoute, redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/lib/auth-helper";
import { apiClient } from "@/lib/api-client";
import { applyMockRoleOverride, getDefaultRouteForRoles } from "@/lib/roles/role-config";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" as const });

    const profile = await apiClient.get<{ roles: string[] }>("/auth/profile");
    if (profile.error) throw redirect({ to: "/auth" as const });

    const roles = applyMockRoleOverride(profile.data?.roles ?? []);
    const to = getDefaultRouteForRoles(roles);
    if (to === "/auth") throw redirect({ to: "/auth" as const });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw redirect({ to: to as any });
  },
  component: () => null,
});
