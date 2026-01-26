import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface DecodedRefreshToken extends RefreshTokenPayload {
  iat: number;
  exp: number;
}

export class TokenService {
  /**
   * Generate an access token (short-lived)
   * @param payload - Token payload (userId, email, role)
   * @returns JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Generate a refresh token (long-lived)
   * @param payload - Refresh token payload (userId only)
   * @returns JWT refresh token
   */
  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * Generate both access and refresh tokens
   * @param payload - Token payload (userId, email, role)
   * @returns Object with accessToken and refreshToken
   */
  generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({
      userId: payload.userId,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify and decode an access token
   * @param token - JWT access token
   * @returns Decoded token payload
   * @throws Error if token is invalid, expired, or malformed
   */
  verifyAccessToken(token: string): DecodedToken {
    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
    return decoded;
  }

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token
   * @returns Decoded token payload
   * @throws Error if token is invalid, expired, or malformed
   */
  verifyRefreshToken(token: string): DecodedRefreshToken {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET
    ) as DecodedRefreshToken;
    return decoded;
  }

  /**
   * Decode a token without verification (doesn't validate signature or expiration)
   * Useful for reading token data before validation
   * @param token - JWT token
   * @returns Decoded token or null if malformed
   */
  decodeToken(token: string): any | null {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the expiration date from a token
   * @param token - JWT token
   * @returns Expiration date or null if not found
   */
  getTokenExpirationDate(token: string): Date | null {
    const decoded = this.decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return null;
    }

    // Convert Unix timestamp (seconds) to milliseconds
    return new Date(decoded.exp * 1000);
  }
}
