"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  DoorOpen,
  ShieldCheck,
  Car,
  UserCheck,
  UserMinus,
  Bell,
  QrCode,
  ClipboardList,
  ScanLine,
  Clock,
  CalendarCheck,
} from "lucide-react";
import type { ComponentType } from "react";

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

type NavItem = { title: string; url: string; icon: ComponentType<{ className?: string }> };

const workspace: NavItem[] = [
  { title: "Dashboard", url: "/security/dashboard", icon: LayoutDashboard },
  { title: "Notifications", url: "/security/notifications", icon: Bell },
];

const gateAccess: NavItem[] = [
  { title: "Today's Gate Passes", url: "/security/gate-passes/today", icon: ClipboardList },
  { title: "QR Scanner", url: "/security/gate-passes/scanner", icon: ScanLine },
  { title: "Verify Pass", url: "/security/gate-passes/verify", icon: QrCode },
  { title: "Release Gate Pass", url: "/security/gate-passes/release", icon: DoorOpen },
  { title: "All Gate Passes", url: "/security/gate-passes", icon: ClipboardList },
];

const visitorManagement: NavItem[] = [
  { title: "Visitor Check-in", url: "/security/visitors/check-in", icon: UserCheck },
  { title: "Visitor Check-out", url: "/security/visitors/check-out", icon: UserMinus },
  { title: "Visitor Logs", url: "/security/visitors/logs", icon: ClipboardList },
];

const vehicleMonitoring: NavItem[] = [
  { title: "Vehicle Logs", url: "/security/vehicles/logs", icon: Car },
  { title: "Vehicle Check", url: "/security/vehicles/check", icon: ShieldCheck },
];

const timeLogs: NavItem[] = [
  { title: "Record Time Out", url: "/security/logs/time-out", icon: Clock },
  { title: "Record Time In", url: "/security/logs/time-in", icon: CalendarCheck },
];

export function SecuritySidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => pathname === u || pathname.startsWith(u + "/");

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-amber-500/30">
      <SidebarHeader className="border-b border-sidebar-border bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-md bg-amber-600 text-white grid place-items-center text-sm font-bold shrink-0">
            SG
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Security Portal</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                Gate Monitoring System
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {renderGroup("Workspace", workspace)}
        {renderGroup("Gate Access", gateAccess)}
        {renderGroup("Visitors", visitorManagement)}
        {renderGroup("Vehicles", vehicleMonitoring)}
        {renderGroup("Time Logs", timeLogs)}
      </SidebarContent>
      <SidebarFooter className="border-t border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 px-2 py-2">
        {!collapsed && (
          <div className="text-[10px] text-amber-700/60 dark:text-amber-300/60">
            Security Guard · v1.0 Enterprise
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}