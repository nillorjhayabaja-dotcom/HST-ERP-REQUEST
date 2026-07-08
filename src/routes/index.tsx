import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated, getAccessToken } from "@/lib/auth-helper";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" as const });
    
    // Try to fetch profile to determine role-based redirect
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.ok) {
        throw redirect({ to: "/employee-portal/dashboard" as const });
      }
      
      const profile = await res.json();
      const roles: string[] = profile.roles || [];
      
      // Route based on highest privilege role
      if (roles.includes("super_administrator") || roles.includes("system_administrator")) {
        throw redirect({ to: "/admin/dashboard" as any });
      }
      if (roles.includes("security_guard")) {
        const hasHigherRole = roles.some(r => 
          ["super_administrator", "system_administrator", "it_support", "executive", "department_manager"].includes(r)
        );
        if (!hasHigherRole) {
          throw redirect({ to: "/security/gate-passes/today" as any });
        }
      }
      
      throw redirect({ to: "/employee-portal/dashboard" as const });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'Redirect') {
        throw error;
      }
      throw redirect({ to: "/employee-portal/dashboard" as const });
    }
  },
  component: () => null,
});