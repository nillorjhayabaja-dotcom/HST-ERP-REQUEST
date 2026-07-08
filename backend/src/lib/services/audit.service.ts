import { useApiQuery } from "../hooks.js";

export function useAuditLogs(params?: {
  module?: string;
  action?: string;
  entity_type?: string;
  user_id?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.module) query.set("module", params.module);
  if (params?.action) query.set("action", params.action);
  if (params?.entity_type) query.set("entity_type", params.entity_type);
  if (params?.user_id) query.set("user_id", params.user_id);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const queryString = query.toString();
  return useApiQuery<{ logs: any[]; total: number; page: number; limit: number }>(
    ["audit-logs", JSON.stringify(params || {})],
    `/audit-logs${queryString ? `?${queryString}` : ""}`,
  );
}

export function useAuditLog(id: string) {
  return useApiQuery<any>(["audit-log", id], `/audit-logs/${id}`);
}
