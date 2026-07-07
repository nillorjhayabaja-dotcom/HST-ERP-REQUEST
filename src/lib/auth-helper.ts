import { apiClient } from "./api-client";

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  roles: string[];
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const response = await apiClient.post<AuthResult>("/auth/signin", { email, password });
  if (response.error) throw new Error(response.error);
  const data = response.data!;
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("refresh_token", data.refreshToken);
  return data;
}

export async function signUp(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<AuthResult> {
  try {
    const response = await apiClient.post<AuthResult>("/auth/signup", data);
    if (response.error) throw new Error(response.error);
    const result = response.data!;
    localStorage.setItem("auth_token", result.token);
    localStorage.setItem("refresh_token", result.refreshToken);
    return result;
  } catch (err: any) {
    console.error('Signup error:', err.response?.data || err.message);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  try {
    await apiClient.post("/auth/signout");
  } catch {
    // ignore
  }
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
}

export async function getProfile(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/profile");
  if (response.error) throw new Error(response.error);
  return response.data!;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem("auth_token") !== null;
}