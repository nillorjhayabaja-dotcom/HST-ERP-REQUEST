import { useApiQuery, useApiMutation } from "../hooks.js";

export function usePositions(params?: { department_id?: string; is_active?: boolean }) {
  const query = new URLSearchParams();
  if (params?.department_id) query.set("department_id", params.department_id);
  if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
  const queryString = query.toString();
  return useApiQuery<any[]>(
    ["positions", JSON.stringify(params || {})],
    `/positions${queryString ? `?${queryString}` : ""}`,
  );
}

export function usePosition(id: string) {
  return useApiQuery<any>(["position", id], `/positions/${id}`);
}

export function useCreatePosition() {
  return useApiMutation<any>("POST", "/positions", [["positions"]]);
}

export function useUpdatePosition() {
  return useApiMutation<any>("PUT", "/positions", [["positions"]]);
}

export function useDeletePosition() {
  return useApiMutation<any>("DELETE", "/positions", [["positions"]]);
}
