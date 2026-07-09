"use client";

import { Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/top-bar";
import { PortalSidebar } from "@/components/layouts/portal-sidebar";
import { PortalBreadcrumb } from "@/components/layouts/breadcrumb";
import { apiClient } from "@/lib/api-client";
import type { PortalDefinition } from "@/lib/roles/role-config";

export function PortalLayout({ portal }: { portal: PortalDefinition }) {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await apiClient.get<{
        email: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
      }>("/auth/profile");
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });

  // Remember last visited portal
  useEffect(() => {
    try {
      window.localStorage.setItem("hst_last_portal", portal.slug);
    } catch {
      // ignore
    }
  }, [portal.slug]);

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    portal.shortLabel;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <PortalSidebar portal={portal} />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <TopBar userEmail={profile?.email ?? ""} userName={displayName} />
          <PortalBreadcrumb />
          <main className="flex-1 min-w-0 animate-in fade-in duration-200">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
