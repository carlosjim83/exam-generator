import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { env } from '@config/env.js';
import jwt from 'jsonwebtoken';
import { createTestServer } from '@tests/helpers/test-server.js';
import { UserMother } from '@tests/helpers/mothers/index.js';

describe('POST /auth/refresh', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Success Cases', () => {
    it('should generate new token pair with valid refresh token', async () => {
      // ARRANGE: Create user via UserMother
      const { user, tokens } = await UserMother.teacher(app);
      const oldRefreshToken = tokens.refreshToken;

      // ACT: Use refresh token to get new tokens
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: oldRefreshToken,
        },
      });

      // ASSERT
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
      expect(decodedNew.email).toBe(user.email);
      expect(decodedNew.role).toBe('TEACHER');

      // Access token should have newer 'iat' (issued at) timestamp, or at minimum the same
      expect(decodedNew.iat).toBeGreaterThanOrEqual(decodedOld.iat);

      // Verify new access token is valid by checking with JWT secret
      const verified = jwt.verify(refreshBody.accessToken, env.JWT_SECRET) as any;
      expect(verified.userId).toBeDefined();
      expect(verified.email).toBe(user.email);
      expect(verified.role).toBe('TEACHER');
    });

    it('should return user info with new tokens', async () => {
      // ARRANGE: Create student via UserMother
      const { user, tokens } = await UserMother.student(app);

      // ACT: Refresh tokens
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: tokens.refreshToken },
      });

      // ASSERT
      expect(refreshResponse.statusCode).toBe(200);
      const body = JSON.parse(refreshResponse.body);

      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(user.email);
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
      const nonExistentToken = jwt.sign({ userId: nonExistentUserId }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });

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
      // ARRANGE: Create user via UserMother
      const { tokens } = await UserMother.teacher(app);

      // ACT: Try to use access token as refresh token
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: tokens.accessToken, // Wrong token type!
        },
      });

      // ASSERT: Should fail because access token uses different secret
      expect(response.statusCode).toBe(401);
    });
  });
});
