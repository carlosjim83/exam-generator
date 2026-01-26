// User entity from backend
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT';
  provider: string;
  createdAt: string;
  updatedAt: string;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// Auth context state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
