import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

import { apiClient } from "@/lib/api-client";
import { isAuthenticated, signOut } from "@/lib/auth-helper";
import { onAuthLogout } from "@/lib/auth-events";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSidebar } from "@/components/employee-sidebar";
import { TopBar } from "@/components/top-bar";

export const Route = createFileRoute("/_authenticated/employee-portal")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });

    // Redirect users to their appropriate portals based on role
    try {
      const response = await apiClient.get<{ roles: string[] }>("/auth/profile");

      if (response.error) {
        // If we can't fetch profile, redirect to root for re-authentication
        throw redirect({ to: "/" });
      }

      const roles = response.data?.roles || [];

      // Redirect admin roles to admin dashboard
      if (
        roles.some((r) =>
          [
            "super_administrator",
            "system_administrator",
            "administrator",
            "it_support",
            "hr",
            "gad",
            "internal_auditor",
          ].includes(r),
        )
      ) {
        throw redirect({ to: "/admin/dashboard" });
      }
      // Redirect security and vehicle coordinator to security dashboard
      else if (roles.includes("security_guard") || roles.includes("vehicle_coordinator")) {
        throw redirect({ to: "/security/dashboard" });
      }
      // Allow executives, managers, supervisors, and regular employees to access employee portal
    } catch (error) {
      // If it's a redirect, re-throw it
      if (error && typeof error === "object" && "to" in error) {
        throw error;
      }
      // For other errors, redirect to root
      throw redirect({ to: "/" });
    }
  },
  component: EmployeePortalLayout,
});

function EmployeePortalLayout() {
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <EmployeeSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <TopBar userEmail={profile?.email ?? ""} userName={displayName} />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
