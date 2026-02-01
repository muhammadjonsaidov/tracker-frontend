import {
  ApiResponse,
  AuthResponse,
  UserRow,
  LastLocationRow,
  SessionPage,
  SessionRow,
  SessionSummaryResponse,
  PointRow,
  StreamTokenResponse,
} from '@/shared/types';

// Environment configuration
const RAW_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

// Helper to normalize array responses
const normalizeArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    if ('items' in value && Array.isArray((value as any).items)) {
      return (value as any).items as T[];
    }
    if ('points' in value && Array.isArray((value as any).points)) {
      return (value as any).points as T[];
    }
    if ('data' in value && Array.isArray((value as any).data)) {
      return (value as any).data as T[];
    }
  }
  return [];
};

class ApiClient {
  private token: string | null = null;
  private readonly storageKey = 'token';

  constructor() {
    this.token = this.loadToken();
  }

  private loadToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(this.storageKey, token);
        } else {
          localStorage.removeItem(this.storageKey);
        }
      } catch (e) {
        console.error('Failed to save token:', e);
      }
    }
  }

  getToken() {
    return this.token;
  }

  private getUrl(path: string): string {
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = this.getUrl(path);
    const headers = new Headers(options.headers);

    headers.set('Accept', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Bypass Ngrok warning page for free tier
    headers.set('ngrok-skip-browser-warning', 'true');

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, { ...options, headers });

      // Check for authentication error
      if (response.status === 401) {
        this.setToken(null);
        // Optional: Redirect to login or dispatch event
        // window.location.href = '/login'; 
        throw new Error('Unauthorized');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON. Check API URL configuration.');
      }

      let data: any;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Failed to parse server response as JSON');
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Ensure consistent response structure
      if ('data' in data && 'timestamp' in data && 'message' in data) {
        return data as ApiResponse<T>;
      }

      return {
        timestamp: new Date().toISOString(),
        message: 'Success',
        data: data as T,
      };

    } catch (error: any) {
      console.error(`API Request Failed [${url}]:`, error);
      throw error;
    }
  }

  // --- Auth Endpoints ---

  async login(usernameOrEmail: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse<void>> {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  // --- Admin Endpoints ---

  async getUsers(): Promise<ApiResponse<UserRow[]>> {
    const res = await this.request<any>('/api/v1/admin/users');
    // Normalize data if it's wrapped awkwardly (e.g. spring data rest styles)
    const normalized = normalizeArray<UserRow>(res.data);
    return { ...res, data: normalized };
  }

  async getLastLocations(): Promise<ApiResponse<LastLocationRow[]>> {
    const res = await this.request<any>('/api/v1/admin/users/last-locations');
    const normalized = normalizeArray<LastLocationRow>(res.data);
    return { ...res, data: normalized };
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
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const res = await this.request<any>(`/api/v1/admin/sessions?${query.toString()}`);

    // Check if the response matches SessionPage structure, else normalize
    if (res.data && 'items' in res.data) {
      return res as ApiResponse<SessionPage>;
    }

    // Fallback normalization
    const items = normalizeArray<SessionRow>(res.data);
    return {
      ...res,
      data: {
        items,
        page: params.page || 0,
        size: items.length,
        totalElements: items.length,
        totalPages: 1
      }
    };
  }

  async getSessionSummary(sessionId: string): Promise<ApiResponse<SessionSummaryResponse>> {
    return this.request(`/api/v1/admin/sessions/${sessionId}/summary`);
  }

  async getSessionPoints(
    sessionId: string,
    params: { from?: string; to?: string; max?: number } = {}
  ): Promise<ApiResponse<PointRow[]>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    const res = await this.request<any>(`/api/v1/admin/sessions/${sessionId}/points?${query.toString()}`);
    const normalized = normalizeArray<PointRow>(res.data);
    return { ...res, data: normalized };
  }

  async getStreamToken(): Promise<ApiResponse<StreamTokenResponse>> {
    return this.request('/api/v1/admin/stream/token');
  }

  getSseUrl(streamToken: string): string {
    const url = new URL(this.getUrl('/api/v1/admin/stream/last-locations'));
    url.searchParams.set('access_token', streamToken);
    url.searchParams.set('ngrok-skip-browser-warning', 'true');
    return url.toString();
  }
}

export const api = new ApiClient();
