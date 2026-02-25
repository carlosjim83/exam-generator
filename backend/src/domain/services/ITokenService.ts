import type { UserRole } from '../entities/User.js';
import type { Email } from '../value-objects/Email.js';
import type { UserId } from '../value-objects/UserId.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface DecodedRefreshToken {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * ITokenService Interface (Port)
 * Defines JWT token operations
 * Implementation is in infrastructure layer
 */
export interface ITokenService {
  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(userId: UserId, email: Email, role: UserRole): TokenPair;

  /**
   * Verify and decode an access token
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): DecodedToken;

  /**
   * Verify and decode a refresh token
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): DecodedRefreshToken;
}
