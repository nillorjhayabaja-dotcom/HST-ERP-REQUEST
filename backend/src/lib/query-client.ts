import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export async function fetchWithAuth<T>(endpoint: string): Promise<T> {
  const response = await apiClient.get<T>(endpoint);
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data!;
}

export async function mutateWithAuth<T>(
  method: "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: any,
): Promise<T> {
  const response = await apiClient[method.toLowerCase() as "post" | "put" | "delete"]<T>(
    endpoint,
    body,
  );
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data!;
}
