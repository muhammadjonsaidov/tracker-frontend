
import { ApiResponse, AuthResponse, UserRow, LastLocationRow, SessionPage, SessionSummaryResponse, PointRow, StreamTokenResponse } from '../types';

const RAW_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const buildUrl = (path: string) => (BASE_URL ? `${BASE_URL}${path}` : path);

const toApiResponse = <T,>(payload: unknown): ApiResponse<T> => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload as ApiResponse<T>;
  }
  return {
    data: payload as T,
    message: '',
    timestamp: new Date().toISOString(),
  };
};

class ApiClient {
  private token: string | null = localStorage.getItem('token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    headers.set('Content-Type', 'application/json');

    try {
      const response = await fetch(buildUrl(path), { ...options, headers });
      
      if (response.status === 401) {
        this.setToken(null);
        window.location.hash = '/login';
        throw new Error('Unauthorized');
      }

      const text = await response.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = text || {};
      }

      if (!response.ok) {
        const message =
          data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string'
            ? (data as any).message
            : typeof data === 'string' && data.trim().length > 0
              ? data
              : response.statusText
                ? `${response.status}: ${response.statusText}`
                : `API request failed: ${response.status}`;
        throw new Error(message);
      }

      return toApiResponse(data) as T;
    } catch (error: any) {
      if (error instanceof Error) throw error;
      throw new Error('Network or server error occurred');
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
  }

  async getUsers(): Promise<ApiResponse<UserRow[]>> {
    return this.request('/api/v1/admin/users');
  }

  async getLastLocations(): Promise<ApiResponse<LastLocationRow[]>> {
    return this.request('/api/v1/admin/users/last-locations');
  }

  async getSessions(params: {
    userId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<SessionPage>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString());
    });
    return this.request(`/api/v1/admin/sessions?${query.toString()}`);
  }

  async getSessionSummary(sessionId: string): Promise<ApiResponse<SessionSummaryResponse>> {
    return this.request(`/api/v1/admin/sessions/${sessionId}/summary`);
  }

  async getSessionPoints(sessionId: string, params: { from?: string; to?: string; max?: number } = {}): Promise<ApiResponse<PointRow[]>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString());
    });
    return this.request(`/api/v1/admin/sessions/${sessionId}/points?${query.toString()}`);
  }

  async getStreamToken(): Promise<ApiResponse<StreamTokenResponse>> {
    return this.request('/api/v1/admin/stream/token');
  }

  getSseUrl(streamToken: string): string {
    const url = new URL(buildUrl('/api/v1/admin/stream/last-locations'), window.location.origin);
    url.searchParams.set('access_token', streamToken);
    return url.toString();
  }
}

export const api = new ApiClient();
