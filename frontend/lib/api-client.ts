/**
 * Centralized API Client
 *
 * This module provides a unified API client for all frontend HTTP requests.
 * It handles authentication, token management, and error handling consistently.
 *
 * SECURITY: Tokens are stored in memory only (never localStorage) to prevent XSS.
 * Authentication cookies are sent automatically via `credentials: 'include'`.
 */

import { configManager } from '@/lib/config/config-manager';

// ============================================================================
// Token Manager
// ============================================================================

/**
 * Token Manager - Handles JWT token storage and retrieval
 *
 * IMPORTANT: Tokens are stored in memory only to prevent XSS attacks.
 * Never use localStorage for auth tokens. The backend sets httpOnly cookies,
 * and the frontend sends them via `credentials: 'include'`.
 *
 * Memory tokens act as a fallback for Authorization headers until cookies
 * are fully relied upon.
 */
export class TokenManager {
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  /**
   * Get the current access token (from memory)
   */
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the current refresh token (from memory)
   */
  static getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Store both tokens in memory
   */
  static setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Clear all tokens (logout)
   */
  static clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
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
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * Get the base URL for API requests
   */
  private get baseURL(): string {
    return configManager.getApiUrl();
  }

  /**
   * Make an authenticated HTTP request with automatic token refresh on 401
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.requestWithAuth<T>(endpoint, options);
  }

  /**
   * Core request logic that supports retry after token refresh
   */
  private async requestWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
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

    // Add access token if available (fallback until cookies are fully relied upon)
    const accessToken = TokenManager.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
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
        // Handle JWT expired or unauthorized - attempt refresh once
        if (response.status === 401) {
          if (retryCount > 0) {
            // Already retried after refresh, fail permanently
            TokenManager.clearTokens();
            if (typeof globalThis.window !== 'undefined') {
              globalThis.window.dispatchEvent(new CustomEvent('api:session-expired'));
            }
            throw new ApiError(response.status, data.message || 'Session expired');
          }

          // Avoid infinite loops on the refresh endpoint itself
          if (endpoint === '/api/auth/refresh') {
            TokenManager.clearTokens();
            if (typeof globalThis.window !== 'undefined') {
              globalThis.window.dispatchEvent(new CustomEvent('api:session-expired'));
            }
            throw new ApiError(response.status, data.message || 'Session expired');
          }

          await this.performRefresh(options.signal ?? undefined);
          return this.requestWithAuth<T>(endpoint, options, retryCount + 1);
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

  /**
   * Perform token refresh, deduplicating concurrent requests
   */
  private async performRefresh(signal?: AbortSignal): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh(signal);

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Execute the actual refresh request
   *
   * Sends credentials: 'include' so the backend can read the httpOnly
   * refresh-token cookie. The body is kept as a fallback for backwards
   * compatibility while the cookie migration is in progress.
   */
  private async doRefresh(signal?: AbortSignal): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Refresh failed');
      }

      const data = (await response.json()) as RefreshTokenResponse;
      TokenManager.setTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      TokenManager.clearTokens();
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.dispatchEvent(new CustomEvent('api:session-expired'));
      }
      throw error;
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
  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', signal });
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      signal,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      signal,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', signal });
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
      credentials: 'include',
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
    credentials: 'include',
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
