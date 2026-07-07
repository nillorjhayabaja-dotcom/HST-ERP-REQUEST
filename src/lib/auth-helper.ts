import apiClient from "./api-client";

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
  const { data } = await apiClient.post<AuthResult>("/auth/signin", { email, password });
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
    const { data: result } = await apiClient.post<AuthResult>("/auth/signup", data);
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
  const { data } = await apiClient.get<AuthUser>("/auth/profile");
  return data;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem("auth_token") !== null;
}