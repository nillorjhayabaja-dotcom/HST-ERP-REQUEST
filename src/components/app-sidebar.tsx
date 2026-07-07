import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  ClipboardList,
  CalendarDays,
  UserCircle2,
  Car,
  Package,
  ShoppingCart,
  Bell,
  ShieldCheck,
  Settings2,
  Building2,
  FileBarChart,
  Workflow,
  Hash,
  BadgeCheck,
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "My Profile", url: "/profile", icon: UserCircle2 },
];

const modules: NavItem[] = [
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Gate Pass", url: "/gate-pass", icon: DoorOpen },
  { title: "MRF", url: "/mrf", icon: ClipboardList },
  { title: "Leave", url: "/leave", icon: CalendarDays },
  { title: "Visitors", url: "/visitors", icon: BadgeCheck },
  { title: "Vehicles", url: "/vehicles", icon: Car },
  { title: "Assets", url: "/assets", icon: Package },
  { title: "Purchase Req.", url: "/purchase-requests", icon: ShoppingCart },
];

const oversight: NavItem[] = [
  { title: "Approvals", url: "/approvals", icon: Workflow },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Audit Logs", url: "/audit-logs", icon: ShieldCheck },
];

const administration: NavItem[] = [
  { title: "Users & Roles", url: "/admin/users", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Workflows", url: "/admin/workflows", icon: Workflow },
  { title: "Control Numbers", url: "/admin/control-numbers", icon: Hash },
  { title: "System Settings", url: "/admin/settings", icon: Settings2 },
];

export function AppSidebar() {
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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-md bg-gold text-gold-foreground grid place-items-center text-sm font-bold shrink-0">
            HS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">HST Portal</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                HS Technologies (Phils.)
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Workspace", workspace)}
        {renderGroup("Modules", modules)}
        {renderGroup("Oversight", oversight)}
        {renderGroup("Administration", administration)}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <div className="px-2 py-2 text-[10px] text-sidebar-foreground/50">
            v1.0 · Enterprise Edition
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
