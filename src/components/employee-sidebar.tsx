"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Bell,
  UserCircle2,
  DoorOpen,
  ClipboardList,
  CalendarDays,
  BadgeCheck,
  Car,
  Package,
  ShoppingCart,
  FileClock,
  HelpCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-helper";
import { toast } from "sonner";

// Note: TanStack routes are strongly typed; this sidebar uses existing route strings only.


type NavItem = { title: string; url: string; icon: ComponentType<{ className?: string }> };

const workspace: NavItem[] = [
  { title: "Dashboard", url: "/employee-portal/dashboard", icon: LayoutDashboard },
  { title: "Notifications", url: "/employee-portal/notifications", icon: Bell },
  { title: "My Profile", url: "/employee-portal/profile", icon: UserCircle2 },
];

const modules: NavItem[] = [
  { title: "Gate Pass", url: "/employee-portal/gate-passes", icon: DoorOpen },
  { title: "Leave", url: "/employee-portal/leave", icon: CalendarDays },
  { title: "MRF", url: "/employee-portal/mrf", icon: ClipboardList },
  { title: "Visitors", url: "/employee-portal/visitors", icon: BadgeCheck },
  { title: "Vehicles", url: "/employee-portal/vehicles", icon: Car },
  { title: "Assets", url: "/employee-portal/assets", icon: Package },
  { title: "Purchase Req.", url: "/employee-portal/purchase-requests", icon: ShoppingCart },
];

const history: NavItem[] = [
  { title: "My Requests", url: "/employee-portal/my-requests", icon: FileClock },
  { title: "My Activities", url: "/employee-portal/my-activities", icon: FileClock },
];

const support: NavItem[] = [
  { title: "Help", url: "/employee-portal/help", icon: HelpCircle },
];

export function EmployeeSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = useMemo(() => {
    return (u: string) => pathname === u || pathname.startsWith(u + "/");
  }, [pathname]);

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
            ES
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Employee Portal</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">Self-Service</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {renderGroup("Workspace", workspace)}
        {renderGroup("Modules", modules)}
        {renderGroup("History", history)}
        {renderGroup("Support", support)}
      </SidebarContent>

      <SidebarFooter className="px-2 py-2">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => {
              void signOut().then(() => toast.success("Signed out"));
            }}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-destructive"
              onClick={() => {
                void signOut().then(() => toast.success("Signed out"));
              }}
            >
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}