import { AuthResponse, RefreshTokenResponse } from '../types/auth.types';
import { configManager } from '@/lib/config/config-manager';

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Client
class ApiClient {
  private async getBaseURL(): Promise<string> {
    // Wait for config to be initialized before making requests
    if (!configManager.isInitialized()) {
      await configManager.initialize();
    }
    const url = configManager.getApiUrl();
    if (!url) {
      throw new ApiError(500, 'API base URL is not configured. Check your environment variables.');
    }
    return url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseURL = await this.getBaseURL();
    const url = `${baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers
    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // Add access token if available
    const accessToken = TokenManager.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (response.status === 400 && data.errors) {
          throw new ApiError(response.status, data.message, data.errors);
        }
        throw new ApiError(response.status, data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Network error. Please try again.');
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store tokens
    TokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'TEACHER' | 'STUDENT' = 'TEACHER'
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });

    // Store tokens
    TokenManager.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }

    const response = await this.request<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update access token
    const newRefreshToken = TokenManager.getRefreshToken();
    if (newRefreshToken) {
      TokenManager.setTokens(response.accessToken, newRefreshToken);
    }

    return response.accessToken;
  }

  logout(): void {
    TokenManager.clearTokens();
  }

  // Generic authenticated request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export { TokenManager };
