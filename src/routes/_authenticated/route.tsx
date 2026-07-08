import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

import { apiClient } from "@/lib/api-client";
import { isAuthenticated, signOut } from "@/lib/auth-helper";
import { onAuthLogout } from "@/lib/auth-events";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { SessionWarningDialog } from "@/components/session-warning-dialog";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  const forceLogout = useCallback(() => {
    signOut().then(() => {
      navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);

  // Listen for forced logout events (e.g., from api-client on 401)
  useEffect(() => {
    const unsub = onAuthLogout(() => {
      navigate({ to: "/auth", replace: true });
    });
    return unsub;
  }, [navigate]);

  // Auto-refresh token before expiration to prevent session timeout
  useTokenRefresh();

  // Idle timeout: auto-logout after 30 minutes of inactivity
  useIdleTimeout(forceLogout, 30 * 60 * 1000);

  const { data: profile, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<{
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        roles: string[];
      }>("/auth/profile");
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    retry: false,
    enabled: isAuthenticated(),
  });

  useEffect(() => {
    if (error) {
      void signOut();
      navigate({ to: "/auth", replace: true });
    }
  }, [error, navigate]);

  if (error) {
    return null;
  }

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Outlet />
      <SessionWarningDialog />
    </div>
  );
}
