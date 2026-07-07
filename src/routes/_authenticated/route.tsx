import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth-helper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        roles: string[];
      }>("/auth/profile");
      return data;
    },
  });

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "User";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
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