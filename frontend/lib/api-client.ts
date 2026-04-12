/**
 * Centralized API Client
 *
 * This module provides a unified API client for all frontend HTTP requests.
 * It handles authentication, token management, and error handling consistently.
 */

import { configManager } from '@/lib/config/config-manager';

// ============================================================================
// Token Manager
// ============================================================================

/**
 * Token Manager - Handles JWT token storage and retrieval
 * Uses localStorage with consistent key names: 'access_token' and 'refresh_token'
 */
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Get the current access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get the current refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store both tokens
   */
  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear all tokens (logout)
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user has valid tokens
   */
  static hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  /**
   * Check if user is authenticated (has access token)
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// ============================================================================
// API Error
// ============================================================================

/**
 * API Error class - Provides structured error information
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400 && !!this.errors;
  }

  /**
   * Check if error is a not found error
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if error is a forbidden error
   */
  isForbiddenError(): boolean {
    return this.statusCode === 403;
  }
}

// ============================================================================
// API Client
// ============================================================================

/**
 * API Client - Centralized HTTP client with authentication
 */
export class ApiClient {
  /**
   * Get the base URL for API requests
   */
  private get baseURL(): string {
    return configManager.getApiUrl();
  }

  /**
   * Make an authenticated HTTP request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};

    // Only add Content-Type if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge existing headers
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
        // Handle JWT expired or unauthorized
        if (response.status === 401) {
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?error=session_expired';
          }
          throw new ApiError(response.status, data.message || 'Session expired');
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

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'TEACHER' | 'STUDENT' = 'TEACHER'
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });

    TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }

    const response = await this.request<RefreshTokenResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update tokens
    TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response.accessToken;
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    TokenManager.clearTokens();
  }

  // ==========================================================================
  // Generic HTTP Methods
  // ==========================================================================

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get the base URL for external use (e.g., file uploads)
   */
  getBaseUrl(): string {
    return this.baseURL;
  }

  /**
   * Make an unauthenticated request (for public endpoints)
   */
  async publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};

    // Only add Content-Type if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
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
}

// ============================================================================
// Types
// ============================================================================

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Helper function to get auth token (for backward compatibility)
 * @deprecated Use TokenManager.getAccessToken() instead
 */
export function getAuthToken(): string | null {
  return TokenManager.getAccessToken();
}

/**
 * Helper function for authenticated fetch (for backward compatibility)
 * @deprecated Use apiClient.get/post/put/patch/delete methods instead
 */
export async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = TokenManager.getAccessToken();
  const baseUrl = configManager.getApiUrl();

  const headers: Record<string, string> = {};

  // Only add Content-Type if there's a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      errorData.errors
    );
  }

  return response.json();
}
