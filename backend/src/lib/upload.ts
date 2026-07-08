import { apiClient } from "./api-client.js";

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const token = apiClient.getToken();
  const response = await fetch(`${apiClient["baseURL"]}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return data;
}

export async function uploadFiles(
  files: File[],
): Promise<Array<{ url: string; filename: string }>> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const token = apiClient.getToken();
  const response = await fetch(`${apiClient["baseURL"]}/upload/multiple`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return data;
}
