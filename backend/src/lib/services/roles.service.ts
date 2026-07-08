import { useApiQuery, useApiMutation } from "../hooks.js";

export function useRoles() {
  return useApiQuery<any[]>([["roles"]], "/roles");
}

export function useAssignRole() {
  return useApiMutation<any>("POST", "/roles", [["roles"]]);
}

export function useRemoveRole() {
  return useApiMutation<any>("DELETE", "/roles", [["roles"]]);
}

export function usePermissions() {
  return useApiQuery<any[]>([["permissions"]], "/permissions");
}

export function useCreatePermission() {
  return useApiMutation<any>("POST", "/permissions", [["permissions"]]);
}

export function useAssignPermission() {
  return useApiMutation<any>("POST", "/permissions/assign", [["permissions"]]);
}

export function useRemovePermission() {
  return useApiMutation<any>("DELETE", "/permissions/assign", [["permissions"]]);
}
