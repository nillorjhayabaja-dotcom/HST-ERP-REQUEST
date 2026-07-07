const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return { error: data?.error || 'Request failed', status: response.status };
      }

      return { data, status: response.status };
    } catch (error) {
      return { error: (error as Error).message, status: 500 };
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>('POST', endpoint, body);
  }

  put<T>(endpoint: string, body?: any) {
    return this.request<T>('PUT', endpoint, body);
  }

  delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);