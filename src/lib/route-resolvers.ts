import type { PortalType } from "@/lib/portal-rbac";
import { PORTAL_DEFAULT_DASHBOARD } from "@/lib/portal-rbac";

export function getDashboardForPortal(portal: PortalType): string {
  return PORTAL_DEFAULT_DASHBOARD[portal];
}

export function getLayoutPathForPortal(portal: PortalType): string {
  switch (portal) {
    case "employee":
      return "/employee-portal";
    case "admin":
      return "/admin";
    case "security":
      return "/security";
    case "executive":
      return "/executive";
    default:
      return "/";
  }
}
