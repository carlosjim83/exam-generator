import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

  describe('Success Cases', () => {
    it('should generate new token pair with valid refresh token', async () => {
      // Arrange: Register a user to get a valid refresh token
      const uniqueEmail = `refresh-test-${Date.now()}@example.com`;
      
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

      // Wait 1 second to ensure different timestamp (iat) in new token
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Act: Use refresh token to get new tokens
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
      
      // New tokens should be different from old ones
      expect(refreshBody.refreshToken).not.toBe(oldRefreshToken);
      
      // Verify new access token is valid
      const decoded = jwt.verify(refreshBody.accessToken, env.JWT_SECRET) as any;
      expect(decoded.userId).toBeDefined();
      expect(decoded.email).toBe(uniqueEmail);
      expect(decoded.role).toBe('TEACHER');

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
    });

    it('should return user info with new tokens', async () => {
      // Arrange: Register a user
      const uniqueEmail = `refresh-user-test-${Date.now()}@example.com`;
      
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

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
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
      // Create expired refresh token
      const expiredToken = jwt.sign(
        { userId: 'test-user-id' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '0s' }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

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
      // Create valid token but for non-existent user
      const nonExistentToken = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000000' },
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
      const uniqueEmail = `wrong-token-test-${Date.now()}@example.com`;
      
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

      // Should fail because access token doesn't have all required fields
      expect(response.statusCode).toBe(401);

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
    });
  });
});
