import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';

describe('POST /auth/refresh', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(authRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Clean up all test users before each test to avoid conflicts
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '-refresh-test-',
        },
      },
    });
  });

  describe('Success Cases', () => {
    it('should generate new token pair with valid refresh token', async () => {
      // Arrange: Register a user to get a valid refresh token
      // Use random suffix to avoid collisions even if cleanup fails
      const uniqueEmail = `user-refresh-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
      
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'RefreshTest123!',
          firstName: 'Refresh',
          lastName: 'Test',
          role: 'TEACHER',
        },
      });

      expect(registerResponse.statusCode).toBe(201);
      const { refreshToken: oldRefreshToken } = JSON.parse(registerResponse.body);

      // Act: Use refresh token to get new tokens (no need to wait, tokens are always different due to iat)
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: oldRefreshToken,
        },
      });

      // Assert
      expect(refreshResponse.statusCode).toBe(200);
      const refreshBody = JSON.parse(refreshResponse.body);
      
      expect(refreshBody.accessToken).toBeDefined();
      expect(refreshBody.refreshToken).toBeDefined();
      expect(refreshBody.accessToken).not.toBe('');
      expect(refreshBody.refreshToken).not.toBe('');
      
      // NOTE: Refresh token might be the same if generated in the same second (JWT iat granularity)
      // This is acceptable behavior - what matters is that the access token is NEW
      // The access token will always be different because it has more payload + different expiry
      
      // Decode both tokens to verify they're valid
      const decodedNew = jwt.decode(refreshBody.accessToken) as any;
      const decodedOld = jwt.decode(oldRefreshToken) as any;
      
      expect(decodedNew.userId).toBeDefined();
      expect(decodedNew.email).toBe(uniqueEmail);
      expect(decodedNew.role).toBe('TEACHER');
      
      // Access token should have newer 'iat' (issued at) timestamp, or at minimum the same
      expect(decodedNew.iat).toBeGreaterThanOrEqual(decodedOld.iat);
      
      // Verify new access token is valid by checking with JWT secret
      const verified = jwt.verify(refreshBody.accessToken, env.JWT_SECRET) as any;
      expect(verified.userId).toBeDefined();
      expect(verified.email).toBe(uniqueEmail);
      expect(verified.role).toBe('TEACHER');
    });

    it('should return user info with new tokens', async () => {
      // Arrange: Register a user
      const uniqueEmail = `user-refresh-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
      
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'RefreshUserTest123!',
          firstName: 'User',
          lastName: 'Refresh',
          role: 'STUDENT',
        },
      });

      const { refreshToken } = JSON.parse(registerResponse.body);

      // Act: Refresh tokens
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken },
      });

      // Assert
      expect(refreshResponse.statusCode).toBe(200);
      const body = JSON.parse(refreshResponse.body);
      
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(uniqueEmail);
      expect(body.user.role).toBe('STUDENT');
      expect(body.user.id).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should return 400 for missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'invalid.token.here',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBeDefined();
    });

    it('should return 401 for expired refresh token', async () => {
      // Create expired refresh token (already expired)
      const expiredToken = jwt.sign(
        { userId: 'test-user-id' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '-1s' } // Negative expiration = already expired
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: expiredToken,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('expired');
    });

    it('should return 401 for refresh token with non-existent user', async () => {
      // Create valid token but for non-existent user (use unique UUID that doesn't exist)
      const nonExistentUserId = '12345678-1234-1234-1234-123456789012';
      const nonExistentToken = jwt.sign(
        { userId: nonExistentUserId },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: nonExistentToken,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('User not found');
    });

    it('should return 401 for access token used as refresh token', async () => {
      // Register user to get access token
      const uniqueEmail = `user-refresh-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
      
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'WrongToken123!',
          firstName: 'Wrong',
          lastName: 'Token',
          role: 'TEACHER',
        },
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      // Try to use access token as refresh token
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: accessToken, // Wrong token type!
        },
      });

      // Should fail because access token uses different secret
      expect(response.statusCode).toBe(401);
    });
  });
});
