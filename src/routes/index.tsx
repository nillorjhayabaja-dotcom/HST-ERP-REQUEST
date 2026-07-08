import { createFileRoute, redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/lib/auth-helper";
import { apiClient } from "@/lib/api-client";
import { resolveRedirectAfterLogin } from "@/lib/auth/redirect-after-login";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" as const });

    const profile = await apiClient.get<{ roles: string[] }>("/auth/profile");
    if (profile.error) throw redirect({ to: "/auth" as const });

    const roles = profile.data?.roles ?? [];
    const { to } = await resolveRedirectAfterLogin({ roles, preserveIntendedTo: false });
    throw redirect({ to: to as any });
  },
  component: () => null,
});
