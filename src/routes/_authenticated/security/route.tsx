import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SecuritySidebar } from "@/components/security-sidebar";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/security")({
  ssr: false,
  beforeLoad: async () => {
    // Verify user has security_guard role
    try {
      const response = await apiClient.get<{ roles: string[] }>("/auth/profile");
      const roles = response.data?.roles || [];
      if (!roles.includes("security_guard") && !roles.includes("super_administrator") && !roles.includes("system_administrator")) {
        throw redirect({ to: "/" });
      }
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: SecurityLayout,
});

function SecurityLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SecuritySidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
