/**
 * Role-based routing configuration.
 *
 * Central contract mapping backend role identifiers to frontend portals
 * (URL slug + sidebar menu). Extend PORTAL_MENU[portal] and ROLE_TO_PORTAL
 * to add a new role without touching any layout file.
 */

import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  FileClock,
  ClipboardList,
  BadgeCheck,
  Bell,
  UserCircle2,
  Car,
  Package,
  ShoppingCart,
  CalendarDays,
  DoorOpen,
  BarChart3,
  Settings,
  Workflow,
  Hash,
  QrCode,
  Truck,
  Warehouse,
  ClipboardCheck,
  FileSearch,
  Activity,
  PieChart,
  Wallet,
  Briefcase,
  UserCheck,
} from "lucide-react";

export type PortalSlug =
  | "super-admin"
  | "admin"
  | "executive"
  | "manager"
  | "supervisor"
  | "gad"
  | "hr"
  | "security"
  | "purchasing"
  | "warehouse"
  | "vehicle"
  | "auditor"
  | "employee";

export type MenuItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export type PortalDefinition = {
  slug: PortalSlug;
  label: string;
  shortLabel: string;
  brandInitials: string;
  dashboardRoute: string;
  menu: MenuGroup[];
};

/**
 * Canonical backend role → portal slug.
 * Aliases (e.g. "administrator", "admin") also mapped for resilience.
 */
export const ROLE_TO_PORTAL: Record<string, PortalSlug> = {
  super_administrator: "super-admin",
  super_admin: "super-admin",
  system_administrator: "admin",
  administrator: "admin",
  admin: "admin",
  it_support: "admin",
  it_administrator: "admin",
  executive: "executive",
  department_manager: "manager",
  manager: "manager",
  department_supervisor: "supervisor",
  supervisor: "supervisor",
  approver: "manager",
  gad: "gad",
  hr_officer: "hr",
  hr: "hr",
  security_guard: "security",
  security: "security",
  purchasing_officer: "purchasing",
  purchasing: "purchasing",
  warehouse_officer: "warehouse",
  warehouse: "warehouse",
  vehicle_coordinator: "vehicle",
  auditor: "auditor",
  employee: "employee",
};

/**
 * Priority order — lowest index wins when a user has multiple roles.
 */
export const PORTAL_PRIORITY: PortalSlug[] = [
  "super-admin",
  "admin",
  "executive",
  "auditor",
  "manager",
  "supervisor",
  "hr",
  "gad",
  "security",
  "purchasing",
  "warehouse",
  "vehicle",
  "employee",
];

export function resolvePortalFromRoles(roles: string[]): PortalSlug | null {
  const portals = new Set<PortalSlug>();
  for (const raw of roles) {
    const key = raw?.trim().toLowerCase();
    const portal = ROLE_TO_PORTAL[key];
    if (portal) portals.add(portal);
  }
  if (portals.size === 0) return null;
  for (const p of PORTAL_PRIORITY) {
    if (portals.has(p)) return p;
  }
  return null;
}

// ---------- Menus ----------

const employeeCore: MenuGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", url: "/employee-portal/dashboard", icon: LayoutDashboard },
      { title: "Notifications", url: "/employee-portal/notifications", icon: Bell },
      { title: "My Profile", url: "/employee-portal/profile", icon: UserCircle2 },
    ],
  },
  {
    label: "Modules",
    items: [
      { title: "Gate Pass", url: "/employee-portal/gate-passes", icon: DoorOpen },
      { title: "Leave", url: "/employee-portal/leave", icon: CalendarDays },
      { title: "MRF", url: "/employee-portal/mrf", icon: ClipboardList },
      { title: "Visitors", url: "/employee-portal/visitors", icon: BadgeCheck },
      { title: "Vehicles", url: "/employee-portal/vehicles", icon: Car },
      { title: "Assets", url: "/employee-portal/assets", icon: Package },
      { title: "Purchase Req.", url: "/employee-portal/purchase-requests", icon: ShoppingCart },
    ],
  },
  {
    label: "History",
    items: [
      { title: "My Requests", url: "/employee-portal/my-requests", icon: FileClock },
      { title: "My Activities", url: "/employee-portal/my-activities", icon: Activity },
    ],
  },
];

const approverModules: MenuItem[] = [
  { title: "Gate Pass", url: "/employee-portal/gate-passes", icon: DoorOpen },
  { title: "Leave", url: "/employee-portal/leave", icon: CalendarDays },
  { title: "MRF", url: "/employee-portal/mrf", icon: ClipboardList },
  { title: "Purchase Requests", url: "/employee-portal/purchase-requests", icon: ShoppingCart },
];

export const PORTALS: Record<PortalSlug, PortalDefinition> = {
  "super-admin": {
    slug: "super-admin",
    label: "Super Administrator",
    shortLabel: "Super Admin",
    brandInitials: "SA",
    dashboardRoute: "/super-admin/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/super-admin/dashboard", icon: LayoutDashboard },
          { title: "System Health", url: "/admin/settings", icon: Activity },
        ],
      },
      {
        label: "Governance",
        items: [
          { title: "Users & Roles", url: "/admin/users", icon: Users },
          { title: "Departments", url: "/admin/departments", icon: Building2 },
          { title: "Workflows", url: "/admin/workflows", icon: Workflow },
          { title: "Control Numbers", url: "/admin/control-numbers", icon: Hash },
        ],
      },
      {
        label: "Oversight",
        items: [
          { title: "Audit Logs", url: "/shared/audit-logs", icon: FileSearch },
          { title: "Reports", url: "/shared/reports", icon: BarChart3 },
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
        ],
      },
    ],
  },
  admin: {
    slug: "admin",
    label: "System Administrator",
    shortLabel: "Admin",
    brandInitials: "AD",
    dashboardRoute: "/admin/dashboard",
    menu: [
      {
        label: "Overview",
        items: [{ title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard }],
      },
      {
        label: "Operations",
        items: [
          { title: "Employees", url: "/admin/users", icon: Users },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
          { title: "Reports", url: "/shared/reports", icon: BarChart3 },
        ],
      },
      {
        label: "Configuration",
        items: [
          { title: "Users & Roles", url: "/admin/roles", icon: ShieldCheck },
          { title: "Departments", url: "/admin/departments", icon: Building2 },
          { title: "Workflows", url: "/admin/workflows", icon: Workflow },
          { title: "Control Numbers", url: "/admin/control-numbers", icon: Hash },
          { title: "System Settings", url: "/admin/settings", icon: Settings },
        ],
      },
      {
        label: "Oversight",
        items: [
          { title: "Audit Logs", url: "/shared/audit-logs", icon: FileSearch },
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
        ],
      },
    ],
  },
  executive: {
    slug: "executive",
    label: "Executive",
    shortLabel: "Executive",
    brandInitials: "EX",
    dashboardRoute: "/executive/dashboard",
    menu: [
      {
        label: "Insights",
        items: [
          { title: "Dashboard", url: "/executive/dashboard", icon: LayoutDashboard },
          { title: "Company Analytics", url: "/shared/reports", icon: PieChart },
          { title: "Department Performance", url: "/shared/reports", icon: BarChart3 },
          { title: "Approval Summary", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  manager: {
    slug: "manager",
    label: "Department Manager",
    shortLabel: "Manager",
    brandInitials: "DM",
    dashboardRoute: "/manager/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/manager/dashboard", icon: LayoutDashboard },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
          { title: "Department Requests", url: "/manager/requests", icon: FileClock },
          { title: "Reports", url: "/shared/reports", icon: BarChart3 },
        ],
      },
      { label: "Modules", items: approverModules },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  supervisor: {
    slug: "supervisor",
    label: "Department Supervisor",
    shortLabel: "Supervisor",
    brandInitials: "SV",
    dashboardRoute: "/supervisor/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/supervisor/dashboard", icon: LayoutDashboard },
          { title: "Team Requests", url: "/supervisor/requests", icon: FileClock },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      { label: "Modules", items: approverModules },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  gad: {
    slug: "gad",
    label: "General Administration",
    shortLabel: "GAD",
    brandInitials: "GD",
    dashboardRoute: "/gad/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/gad/dashboard", icon: LayoutDashboard },
          { title: "Final Approvals", url: "/shared/approvals", icon: ClipboardCheck },
          { title: "Company Vehicles", url: "/employee-portal/vehicles", icon: Car },
          { title: "Gate Pass", url: "/employee-portal/gate-passes", icon: DoorOpen },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  hr: {
    slug: "hr",
    label: "HR Officer",
    shortLabel: "HR",
    brandInitials: "HR",
    dashboardRoute: "/hr/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/hr/dashboard", icon: LayoutDashboard },
          { title: "Employees", url: "/admin/users", icon: Users },
          { title: "Leave Requests", url: "/employee-portal/leave", icon: CalendarDays },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      {
        label: "Analytics",
        items: [{ title: "Reports", url: "/shared/reports", icon: BarChart3 }],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  security: {
    slug: "security",
    label: "Security Guard",
    shortLabel: "Security",
    brandInitials: "SG",
    dashboardRoute: "/security/dashboard",
    menu: [
      {
        label: "Operations",
        items: [
          { title: "Dashboard", url: "/security/dashboard", icon: LayoutDashboard },
          { title: "Today's Gate Pass", url: "/security/gate-passes/today", icon: DoorOpen },
          { title: "Gate Release", url: "/security/gate-passes/release", icon: BadgeCheck },
          { title: "QR Scanner", url: "/security/gate-passes/scanner", icon: QrCode },
          { title: "Visitor Check-In", url: "/security/visitors/check-in", icon: UserCheck },
          { title: "Visitor Check-Out", url: "/security/visitors/check-out", icon: UserCheck },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  purchasing: {
    slug: "purchasing",
    label: "Purchasing Officer",
    shortLabel: "Purchasing",
    brandInitials: "PO",
    dashboardRoute: "/purchasing/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/purchasing/dashboard", icon: LayoutDashboard },
          {
            title: "Purchase Requests",
            url: "/employee-portal/purchase-requests",
            icon: ShoppingCart,
          },
          { title: "MRF", url: "/employee-portal/mrf", icon: ClipboardList },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  warehouse: {
    slug: "warehouse",
    label: "Warehouse Officer",
    shortLabel: "Warehouse",
    brandInitials: "WH",
    dashboardRoute: "/warehouse/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/warehouse/dashboard", icon: LayoutDashboard },
          { title: "MRF", url: "/employee-portal/mrf", icon: ClipboardList },
          { title: "Assets", url: "/employee-portal/assets", icon: Warehouse },
          { title: "Gate Pass", url: "/employee-portal/gate-passes", icon: DoorOpen },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  vehicle: {
    slug: "vehicle",
    label: "Vehicle Coordinator",
    shortLabel: "Vehicle",
    brandInitials: "VC",
    dashboardRoute: "/vehicle/dashboard",
    menu: [
      {
        label: "Overview",
        items: [
          { title: "Dashboard", url: "/vehicle/dashboard", icon: LayoutDashboard },
          { title: "Vehicle Requests", url: "/employee-portal/vehicles", icon: Car },
          { title: "Fleet", url: "/employee-portal/vehicles", icon: Truck },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  auditor: {
    slug: "auditor",
    label: "Internal Auditor",
    shortLabel: "Auditor",
    brandInitials: "AU",
    dashboardRoute: "/auditor/dashboard",
    menu: [
      {
        label: "Oversight",
        items: [
          { title: "Dashboard", url: "/auditor/dashboard", icon: LayoutDashboard },
          { title: "Audit Logs", url: "/shared/audit-logs", icon: FileSearch },
          { title: "Reports", url: "/shared/reports", icon: BarChart3 },
          { title: "Approvals", url: "/shared/approvals", icon: ClipboardCheck },
        ],
      },
      {
        label: "Personal",
        items: [
          { title: "Notifications", url: "/shared/notifications", icon: Bell },
          { title: "My Profile", url: "/shared/profile", icon: UserCircle2 },
        ],
      },
    ],
  },
  employee: {
    slug: "employee",
    label: "Employee",
    shortLabel: "Employee",
    brandInitials: "ES",
    dashboardRoute: "/employee-portal/dashboard",
    menu: employeeCore,
  },
};

/** All roles in the system (in display order). */
export const ALL_ROLES: string[] = [
  "super_administrator",
  "system_administrator",
  "executive",
  "department_manager",
  "department_supervisor",
  "gad",
  "hr_officer",
  "security_guard",
  "purchasing_officer",
  "warehouse_officer",
  "vehicle_coordinator",
  "auditor",
  "employee",
];

export function getDefaultRouteForRoles(roles: string[]): string {
  const portal = resolvePortalFromRoles(roles);
  if (!portal) return "/auth";
  return PORTALS[portal].dashboardRoute;
}

/**
 * DEV-only: read mock role override from localStorage.
 * Returns null in production or when unset.
 */
export function getMockRoleOverride(): string | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("hst_mock_role") || null;
  } catch {
    return null;
  }
}

/** Apply mock override to a real role list (DEV only). */
export function applyMockRoleOverride(roles: string[]): string[] {
  const override = getMockRoleOverride();
  if (!override) return roles;
  return [override];
}

const _iconRefs = { Briefcase, Wallet }; // keep tree-shakable imports referenced
void _iconRefs;
