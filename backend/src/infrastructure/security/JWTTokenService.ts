import jwt from 'jsonwebtoken';

import { env } from '@config/env.js';
import type { UserRole } from '@domain/entities/User.js';
import type {
  ITokenService,
  TokenPair,
  DecodedToken,
  DecodedRefreshToken,
  TokenPayload,
} from '@domain/services/ITokenService.js';
import type { Email } from '@domain/value-objects/Email.js';
import type { UserId } from '@domain/value-objects/UserId.js';

/**
 * JWTTokenService
 * Infrastructure implementation of ITokenService using jsonwebtoken
 *
 * @implements {ITokenService}
 */
export class JWTTokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string | number;
  private readonly refreshTokenExpiresIn: string | number;

  constructor() {
    // Load from environment variables
    this.accessTokenSecret = env.JWT_SECRET;
    this.refreshTokenSecret = env.JWT_REFRESH_SECRET;
    this.accessTokenExpiresIn = env.JWT_EXPIRES_IN;
    this.refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN;

    // Validate secrets exist
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error(
        'JWT secrets are not configured. Please set JWT_SECRET and JWT_REFRESH_SECRET in environment variables.'
      );
    }
  }

  /**
   * Generate access and refresh token pair
   * @param userId - User ID value object
   * @param email - Email value object
   * @param role - User role
   * @returns Token pair (accessToken, refreshToken)
   */
  generateTokenPair(
    userId: UserId,
    email: Email,
    role: UserRole,
    refreshTokenVersion = 0
  ): TokenPair {
    const payload: TokenPayload = {
      userId: userId.value,
      email: email.value,
      role,
    };

    // Generate access token (short-lived, contains user info)
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn as any,
    });

    // Generate refresh token (long-lived, includes version for rotation)
    const refreshToken = jwt.sign(
      { userId: userId.value, version: refreshTokenVersion },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiresIn as any,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode an access token
   * @param token - JWT access token string
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): DecodedToken {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as DecodedToken;

      // Validate required fields exist
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new Error('Invalid token payload: missing required fields');
      }

      return decoded;
    } catch (error) {
      // Re-throw JWT errors as-is to maintain compatibility
      if (error instanceof jwt.TokenExpiredError) {
        throw error; // Keep original "jwt expired" message
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw error; // Keep original JWT error messages
      }
      throw error;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token string
   * @returns Decoded refresh token payload
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): DecodedRefreshToken {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as DecodedRefreshToken;

      // Validate required fields exist
      if (!decoded.userId) {
        throw new Error('Invalid refresh token payload: missing userId');
      }
      if (typeof decoded.version !== 'number') {
        throw new Error('Invalid refresh token payload: missing version');
      }

      return decoded;
    } catch (error) {
      // Re-throw JWT errors as-is to maintain compatibility
      if (error instanceof jwt.TokenExpiredError) {
        throw error; // Keep original "jwt expired" message
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw error; // Keep original JWT error messages
      }
      throw error;
    }
  }
}
