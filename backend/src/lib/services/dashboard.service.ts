import { useApiQuery } from "../hooks.js";

export function useDashboardStats() {
  return useApiQuery<{
    pending: number;
    approvedToday: number;
    rejectedToday: number;
    employees: number;
    unread: number;
  }>(["dashboard-stats"], "/dashboard/stats");
}

export function useDashboardActivity() {
  return useApiQuery<any[]>(["dashboard-activity"], "/dashboard/activity");
}
