import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const response = await apiClient.get<{ roles: string[] }>("/auth/profile");
      
      // Only redirect if there's an actual auth error (401/403)
      if (response.error && (response.status === 401 || response.status === 403)) {
        throw redirect({ to: "/employee-portal/dashboard" });
      }
      
      const roles = response.data?.roles || [];
      const allowed = ["super_administrator", "system_administrator", "it_support"];
      
      if (!roles.some(r => allowed.includes(r))) {
        throw redirect({ to: "/employee-portal/dashboard" });
      }
    } catch (error) {
      // Only redirect if it's a redirect error (from our throw redirect above)
      if (error && typeof error === 'object' && 'to' in error) {
        throw error;
      }
      // For other errors (network issues, etc), allow the route to load
      // The individual pages will handle their own data fetching
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
