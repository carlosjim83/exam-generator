/**
 * Auth API Service
 *
 * Re-exports the centralized API client for authentication.
 * This file exists for backward compatibility.
 */

export {
  apiClient,
  TokenManager,
  ApiError,
  getAuthToken,
  fetchWithAuth,
  type AuthResponse,
  type RefreshTokenResponse,
} from '@/lib/api-client';
