'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState } from '../types/auth.types';
import { apiClient, TokenManager } from '../services/api.service';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: 'TEACHER' | 'STUDENT'
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = TokenManager.getAccessToken();

      if (!accessToken) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Try to get user profile from backend
      try {
        const user = await apiClient.get<User>('/api/profile');
        setAuthState({
          user: user as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Token might be expired, try refresh
        try {
          await apiClient.refreshAccessToken();
          const user = await apiClient.get<User>('/api/profile');
          setAuthState({
            user: user as User,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (refreshError) {
          // Refresh failed, clear tokens
          apiClient.logout();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient.login(email, password);
        setAuthState({
          user: response.user as User,
          isAuthenticated: true,
          isLoading: false,
        });
        // Redirect based on user role
        const redirectPath = response.user.role === 'STUDENT' ? '/student/exams' : '/dashboard';
        router.push(redirectPath);
      } catch (error) {
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role: 'TEACHER' | 'STUDENT' = 'TEACHER'
    ) => {
      try {
        const response = await apiClient.register(email, password, firstName, lastName, role);
        setAuthState({
          user: response.user as User,
          isAuthenticated: true,
          isLoading: false,
        });
        // Redirect based on user role
        const redirectPath = response.user.role === 'STUDENT' ? '/student/exams' : '/dashboard';
        router.push(redirectPath);
      } catch (error) {
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    apiClient.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  }, [router]);

  const setUser = useCallback((user: User) => {
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
