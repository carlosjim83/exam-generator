import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser, requireRoles } from './auth.middleware.js';
import { TokenService } from '../services/token.service.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let app: FastifyInstance;
  let tokenService: TokenService;

  beforeEach(async () => {
    app = Fastify();
    tokenService = new TokenService();

    // Register a test route that uses the middleware
    app.get(
      '/protected',
      { preHandler: authenticateUser },
      async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Success', user: (request as any).user };
      }
    );

    // Register a test route with role-based authorization
    app.get(
      '/teacher-only',
      { preHandler: [authenticateUser, requireRoles(['TEACHER'])] },
      async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Teacher area' };
      }
    );

    // Register a test route with multiple allowed roles
    app.get(
      '/teacher-or-student',
      { preHandler: [authenticateUser, requireRoles(['TEACHER', 'STUDENT'])] },
      async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Accessible by both' };
      }
    );

    await app.ready();
  });

  describe('authenticateUser', () => {
    it('should attach user to request when token is valid', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user).toMatchObject({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      });
      // Verify JWT metadata is also present
      expect(body.user.iat).toBeDefined();
      expect(body.user.exp).toBeDefined();
    });

    it('should return 401 when Authorization header is missing', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Missing authorization header');
    });

    it('should return 401 when token format is invalid (no Bearer prefix)', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: token, // Missing "Bearer " prefix
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Invalid authorization format. Expected: Bearer <token>');
    });

    it('should return 401 when token is expired', async () => {
      // Arrange: Generate token with 0s expiry (immediately expired)
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'TEACHER',
      };
      
      const expiredToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '0s' });

      // Wait to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('jwt expired');
    });

    it('should return 401 when token signature is invalid', async () => {
      // Arrange: Manually create an invalid token
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNjAwMDAwMDAwfQ.INVALID_SIGNATURE';

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('invalid signature');
    });

    it('should return 401 when token is malformed', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer not-a-valid-jwt',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('jwt malformed');
    });
  });

  describe('requireRoles', () => {
    it('should allow access when user has required role (TEACHER)', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-123',
        email: 'teacher@example.com',
        role: 'TEACHER',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/teacher-only',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Teacher area');
    });

    it('should return 403 when user lacks required role (STUDENT trying TEACHER route)', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-456',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/teacher-only',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toBe('Insufficient permissions. Required roles: TEACHER');
    });

    it('should allow access when user has one of multiple allowed roles (TEACHER)', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-123',
        email: 'teacher@example.com',
        role: 'TEACHER',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/teacher-or-student',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Accessible by both');
    });

    it('should allow access when user has one of multiple allowed roles (STUDENT)', async () => {
      // Arrange
      const token = tokenService.generateAccessToken({
        userId: 'user-456',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/teacher-or-student',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Accessible by both');
    });
  });
});
