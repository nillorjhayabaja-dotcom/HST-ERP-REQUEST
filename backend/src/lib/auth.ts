import { apiClient } from './api-client.js';

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
  const response = await apiClient.post<AuthResult>('/auth/signin', { email, password });
  if (response.error) {
    throw new Error(response.error);
  }
  if (response.data) {
    apiClient.setToken(response.data.token);
    localStorage.setItem('refresh_token', response.data.refreshToken);
  }
  return response.data!;
}

export async function signOut(): Promise<void> {
  apiClient.setToken(null);
  localStorage.removeItem('refresh_token');
}

export async function getProfile(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/auth/profile');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data!;
}

export async function refreshToken(): Promise<AuthResult> {
  const refreshTokenValue = localStorage.getItem('refresh_token');
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }
  const response = await apiClient.post<AuthResult>('/auth/refresh-token', { refreshToken: refreshTokenValue });
  if (response.error) {
    throw new Error(response.error);
  }
  if (response.data) {
    apiClient.setToken(response.data.token);
    localStorage.setItem('refresh_token', response.data.refreshToken);
  }
  return response.data!;
}

export function isAuthenticated(): boolean {
  return apiClient.getToken() !== null;
}