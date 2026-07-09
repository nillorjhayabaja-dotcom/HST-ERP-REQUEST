"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { PortalDefinition } from "@/lib/roles/role-config";

export function PortalSidebar({ portal }: { portal: PortalDefinition }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = useMemo(
    () => (u: string) => pathname === u || pathname.startsWith(u + "/"),
    [pathname],
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-md bg-gold text-gold-foreground grid place-items-center text-sm font-bold shrink-0">
            {portal.brandInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{portal.shortLabel} Portal</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                HST Enterprise
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {portal.menu.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={`${group.label}:${item.url}:${item.title}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Link to={item.url as any} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 py-2">
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/60">
            {portal.label} · v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
