import { useApiQuery, useApiMutation } from "../hooks.js";

export function useControlNumbers() {
  return useApiQuery<any[]>([["control-numbers"]], "/control-numbers");
}

export function useControlNumber(module: string) {
  return useApiQuery<any>(["control-number", module], `/control-numbers/${module}`);
}

export function useCreateControlNumber() {
  return useApiMutation<any>("POST", "/control-numbers", [["control-numbers"]]);
}

export function useUpdateControlNumber() {
  return useApiMutation<any>("PUT", "/control-numbers", [["control-numbers"]]);
}
