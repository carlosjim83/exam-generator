import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient, TokenManager } from '../../services/api.service';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock api service
vi.mock('../../services/api.service', () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    get: vi.fn(),
    refreshAccessToken: vi.fn(),
  },
  TokenManager: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

describe('AuthContext', () => {
  const mockPush = vi.fn();
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'TEACHER' as const,
    provider: 'local',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    // Default: no authenticated user (apiClient.get rejects)
    (apiClient.get as any).mockRejectedValue(new Error('Unauthorized'));
    (apiClient.refreshAccessToken as any).mockRejectedValue(new Error('Refresh failed'));
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return auth context when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('setUser');
    });
  });

  describe('Initial Auth State', () => {
    it('should set authenticated state to false when no access token', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should fetch user profile when access token exists', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('valid-token');
      (apiClient.get as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/profile');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should try to refresh token when profile fetch fails', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('expired-token');
      (apiClient.get as any)
        .mockRejectedValueOnce(new Error('Unauthorized'))
        .mockResolvedValueOnce(mockUser);
      (apiClient.refreshAccessToken as any).mockResolvedValue('new-token');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.refreshAccessToken).toHaveBeenCalled();
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear tokens and set unauthenticated when refresh fails', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('expired-token');
      (apiClient.get as any).mockRejectedValue(new Error('Unauthorized'));
      (apiClient.refreshAccessToken as any).mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login()', () => {
    it('should call apiClient.login with email and password', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.login as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(apiClient.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should update auth state after successful login', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.login as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should redirect to /dashboard after successful login', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.login as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should throw error when login fails', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      const error = new Error('Invalid credentials');
      (apiClient.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register()', () => {
    it('should call apiClient.register with all parameters', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.register as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'John', 'Doe', 'TEACHER');
      });

      expect(apiClient.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'TEACHER'
      );
    });

    it('should default to TEACHER role when not specified', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.register as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'John', 'Doe');
      });

      expect(apiClient.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'TEACHER'
      );
    });

    it('should update auth state after successful registration', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.register as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'John', 'Doe', 'STUDENT');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should redirect to /dashboard after successful registration', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      (apiClient.register as any).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'John', 'Doe', 'TEACHER');
      });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should throw error when registration fails', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);
      const error = new Error('Email already exists');
      (apiClient.register as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register(
            'existing@example.com',
            'password123',
            'John',
            'Doe',
            'TEACHER'
          );
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout()', () => {
    it('should call apiClient.logout', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('valid-token');
      (apiClient.get as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(apiClient.logout).toHaveBeenCalled();
    });

    it('should clear auth state on logout', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('valid-token');
      (apiClient.get as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should redirect to /login after logout', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue('valid-token');
      (apiClient.get as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('setUser()', () => {
    it('should update user in auth state', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newUser = {
        id: '456',
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'STUDENT' as const,
        provider: 'local',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      act(() => {
        result.current.setUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set isAuthenticated to true when setting user', async () => {
      (TokenManager.getAccessToken as any).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
