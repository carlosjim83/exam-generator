import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from './token.service';
import jwt from 'jsonwebtoken';

// We'll test with real JWT, not mocked, for better integration testing
describe('TokenService', () => {
  let tokenService: TokenService;
  const testSecret = 'test-secret-key-for-jwt';
  const testRefreshSecret = 'test-refresh-secret-key';

  beforeEach(() => {
    // Override env for testing
    process.env.JWT_SECRET = testSecret;
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const token = tokenService.generateAccessToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const payload = {
        userId: 'user-456',
        email: 'teacher@example.com',
        role: 'TEACHER',
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should include expiration time', () => {
      const payload = {
        userId: 'user-789',
        email: 'student@example.com',
        role: 'STUDENT',
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const payload = {
        userId: 'user-123',
      };

      const token = tokenService.generateRefreshToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId in refresh token', () => {
      const payload = {
        userId: 'user-999',
      };

      const token = tokenService.generateRefreshToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(payload.userId);
    });

    it('should have longer expiration than access token', () => {
      const accessPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const refreshPayload = {
        userId: 'user-123',
      };

      const accessToken = tokenService.generateAccessToken(accessPayload);
      const refreshToken = tokenService.generateRefreshToken(refreshPayload);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = tokenService.verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      const decoded = tokenService.verifyAccessToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create token that expires immediately
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const expiredToken = jwt.sign(payload, testSecret, { expiresIn: '0s' });
      
      // Wait a tiny bit to ensure expiration
      const decoded = tokenService.verifyAccessToken(expiredToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const wrongSecretToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });
      
      const decoded = tokenService.verifyAccessToken(wrongSecretToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const payload = {
        userId: 'user-456',
      };

      const token = tokenService.generateRefreshToken(payload);
      const decoded = tokenService.verifyRefreshToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(payload.userId);
    });

    it('should return null for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      
      const decoded = tokenService.verifyRefreshToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for refresh token signed with wrong secret', () => {
      const payload = {
        userId: 'user-789',
      };

      const wrongSecretToken = jwt.sign(payload, 'wrong-refresh-secret', { expiresIn: '7d' });
      
      const decoded = tokenService.verifyRefreshToken(wrongSecretToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const tokens = tokenService.generateTokenPair(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    it('should generate valid tokens in pair', () => {
      const payload = {
        userId: 'user-456',
        email: 'teacher@example.com',
        role: 'TEACHER',
      };

      const tokens = tokenService.generateTokenPair(payload);

      const accessDecoded = tokenService.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(accessDecoded?.userId).toBe(payload.userId);
      expect(refreshDecoded?.userId).toBe(payload.userId);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = tokenService.decodeToken(token);

      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt';
      
      const decoded = tokenService.decodeToken(malformedToken);
      
      expect(decoded).toBeNull();
    });

    it('should decode even expired token (without verification)', () => {
      const payload = {
        userId: 'user-999',
        email: 'expired@example.com',
        role: 'STUDENT',
      };

      const expiredToken = jwt.sign(payload, testSecret, { expiresIn: '0s' });
      const decoded = tokenService.decodeToken(expiredToken);

      // decodeToken doesn't verify, so it should still decode expired tokens
      expect(decoded?.userId).toBe(payload.userId);
    });
  });

  describe('getTokenExpirationDate', () => {
    it('should return expiration date for valid token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };

      const token = tokenService.generateAccessToken(payload);
      const expDate = tokenService.getTokenExpirationDate(token);

      expect(expDate).toBeInstanceOf(Date);
      expect(expDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for token without expiration', () => {
      const payload = {
        userId: 'user-456',
      };

      const noExpToken = jwt.sign(payload, testSecret); // No expiration
      const expDate = tokenService.getTokenExpirationDate(noExpToken);

      expect(expDate).toBeNull();
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const expDate = tokenService.getTokenExpirationDate(invalidToken);

      expect(expDate).toBeNull();
    });
  });
});
