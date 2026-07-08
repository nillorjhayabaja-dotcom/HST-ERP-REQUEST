import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { TopBar } from "@/components/top-bar";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    // Verify user has admin role
    try {
      const response = await apiClient.get<{ roles: string[] }>("/auth/profile");
      const roles = response.data?.roles || [];

      // Check if user has any admin role
      const hasAccess = roles.some((r) =>
        [
          "super_administrator",
          "system_administrator",
          "administrator",
          "it_support",
          "hr",
          "gad",
          "internal_auditor",
        ].includes(r),
      );

      if (!hasAccess) {
        throw redirect({ to: "/" });
      }
    } catch (error) {
      // If it's a redirect, re-throw it
      if (error && typeof error === "object" && "to" in error) {
        throw error;
      }
      // For other errors (network issues, etc), redirect to root
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<{
        email: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
      }>("/auth/profile");
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "Admin";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 md:!ml-0">
          <TopBar userEmail={profile?.email ?? ""} userName={displayName} />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
