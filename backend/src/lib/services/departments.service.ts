import { useApiQuery, useApiMutation } from "../hooks.js";

export function useDepartments() {
  return useApiQuery<any[]>([["departments"]], "/departments");
}

export function useDepartment(id: string) {
  return useApiQuery<any>(["department", id], `/departments/${id}`);
}

export function useCreateDepartment() {
  return useApiMutation<any>("POST", "/departments", [["departments"]]);
}

export function useUpdateDepartment() {
  return useApiMutation<any>("PUT", "/departments", [["departments"]]);
}

export function useDeleteDepartment() {
  return useApiMutation<any>("DELETE", "/departments", [["departments"]]);
}
