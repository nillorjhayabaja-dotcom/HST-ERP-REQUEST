"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Workflow,
  Hash,
  Settings2,
  ShieldCheck,
  FileBarChart,
  Bell,
  UserCircle2,
  KeyRound,
  Database,
  Activity,
  Lock,
  Server,
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

type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const workspace: NavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "My Profile", url: "/admin/profile", icon: UserCircle2 },
];

const userManagement: NavItem[] = [
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Roles", url: "/admin/roles", icon: KeyRound },
  { title: "Permissions", url: "/admin/permissions", icon: Lock },
];

const organization: NavItem[] = [
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Positions", url: "/admin/positions", icon: UserCircle2 },
  { title: "Approval Workflows", url: "/admin/workflows", icon: Workflow },
  { title: "Control Numbers", url: "/admin/control-numbers", icon: Hash },
];

const system: NavItem[] = [
  { title: "System Settings", url: "/admin/settings", icon: Settings2 },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ShieldCheck },
  { title: "Database Backup", url: "/admin/backup", icon: Database },
  { title: "System Health", url: "/admin/health", icon: Activity },
  { title: "Server Config", url: "/admin/server", icon: Server },
];

const oversight: NavItem[] = [
  { title: "Reports", url: "/admin/reports", icon: FileBarChart },
  { title: "Gate Pass Settings", url: "/admin/gate-pass-settings", icon: Settings2 },
];

export function AdminSidebar() {
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-md bg-gold text-gold-foreground grid place-items-center text-sm font-bold shrink-0">
            AD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate text-sidebar-foreground">
                Admin Panel
              </div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                System Administration
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {renderGroup("Workspace", workspace)}
        {renderGroup("User Management", userManagement)}
        {renderGroup("Organization", organization)}
        {renderGroup("System", system)}
        {renderGroup("Oversight", oversight)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar px-2 py-2">
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/60">
            Administrator · v1.0 Enterprise
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
