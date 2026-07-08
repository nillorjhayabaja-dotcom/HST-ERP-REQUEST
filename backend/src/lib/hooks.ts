import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, mutateWithAuth } from "./query-client.js";

export function useApiQuery<T>(key: string[], endpoint: string) {
  return useQuery({
    queryKey: key,
    queryFn: () => fetchWithAuth<T>(endpoint),
  });
}

export function useApiMutation<T>(
  method: "POST" | "PUT" | "DELETE",
  endpoint: string,
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: any) => mutateWithAuth<T>(method, endpoint, body),
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
      }
    },
  });
}
