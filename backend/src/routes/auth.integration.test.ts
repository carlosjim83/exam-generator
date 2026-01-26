import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { protectedRoutes } from './protected.routes.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';

describe('Auth Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Create Fastify instance with minimal config (no logging for tests)
    app = Fastify({ logger: false });

    // Register routes
    await app.register(authRoutes);
    await app.register(protectedRoutes);

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean test users before each test to avoid conflicts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'integration-test@example.com',
            'student-test@example.com',
            'duplicate-test@example.com',
          ],
        },
      },
    });
  });

  describe('Happy Path: Full Authentication Flow', () => {
    it('should complete full flow: register → login → access protected route', async () => {
      const testUser = {
        email: 'integration-test@example.com',
        password: 'SecurePass123!',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'TEACHER' as const,
      };

      // STEP 1: Register new user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser,
      });

      expect(registerResponse.statusCode).toBe(201);
      const registerBody = JSON.parse(registerResponse.body);
      expect(registerBody.user.email).toBe(testUser.email);
      expect(registerBody.accessToken).toBeDefined();
      expect(registerBody.refreshToken).toBeDefined();

      const registerToken = registerBody.accessToken;

      // STEP 2: Login with same credentials
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginBody = JSON.parse(loginResponse.body);
      expect(loginBody.user.email).toBe(testUser.email);
      expect(loginBody.user.role).toBe(testUser.role);
      expect(loginBody.accessToken).toBeDefined();
      expect(loginBody.refreshToken).toBeDefined();

      const loginToken = loginBody.accessToken;

      // STEP 3: Access protected route with register token
      const protectedResponse1 = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          authorization: `Bearer ${registerToken}`,
        },
      });

      expect(protectedResponse1.statusCode).toBe(200);
      const protectedBody1 = JSON.parse(protectedResponse1.body);
      expect(protectedBody1.user.email).toBe(testUser.email);

      // STEP 4: Access protected route with login token
      const protectedResponse2 = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          authorization: `Bearer ${loginToken}`,
        },
      });

      expect(protectedResponse2.statusCode).toBe(200);
      const protectedBody2 = JSON.parse(protectedResponse2.body);
      expect(protectedBody2.user.email).toBe(testUser.email);
    });

    it('should access teacher-only route after teacher registration', async () => {
      const teacherUser = {
        email: 'integration-test@example.com',
        password: 'TeacherPass123!',
        firstName: 'Teacher',
        lastName: 'Integration',
        role: 'TEACHER' as const,
      };

      // Register as teacher
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: teacherUser,
      });

      expect(registerResponse.statusCode).toBe(201);
      const { accessToken } = JSON.parse(registerResponse.body);

      // Access teacher dashboard
      const dashboardResponse = await app.inject({
        method: 'GET',
        url: '/api/teacher/dashboard',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(dashboardResponse.statusCode).toBe(200);
      const dashboardBody = JSON.parse(dashboardResponse.body);
      expect(dashboardBody.message).toBe('Welcome to teacher dashboard');
      expect(dashboardBody.data).toBeDefined();
    });
  });

  describe('Error Cases: Authentication Failures', () => {
    it('should reject login with wrong password', async () => {
      const testUser = {
        email: 'integration-test@example.com',
        password: 'CorrectPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER' as const,
      };

      // Register user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser,
      });

      expect(registerResponse.statusCode).toBe(201);

      // Try to login with wrong password
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testUser.email,
          password: 'WrongPassword123!',
        },
      });

      expect(loginResponse.statusCode).toBe(401);
      const loginBody = JSON.parse(loginResponse.body);
      expect(loginBody.error).toBe('Unauthorized');
      expect(loginBody.message).toBe('Invalid email or password');
    });

    it('should reject login for non-existent user', async () => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        },
      });

      expect(loginResponse.statusCode).toBe(401);
      const loginBody = JSON.parse(loginResponse.body);
      expect(loginBody.error).toBe('Unauthorized');
      expect(loginBody.message).toBe('Invalid email or password');
    });

    it('should reject duplicate registration with same email', async () => {
      const testUser = {
        email: 'duplicate-test@example.com',
        password: 'Password123!',
        firstName: 'Duplicate',
        lastName: 'Test',
        role: 'STUDENT' as const,
      };

      // First registration (should succeed)
      const firstRegister = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser,
      });

      expect(firstRegister.statusCode).toBe(201);

      // Second registration with same email (should fail)
      const secondRegister = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          ...testUser,
          firstName: 'Different',
          lastName: 'Name',
        },
      });

      expect(secondRegister.statusCode).toBe(409);
      const secondBody = JSON.parse(secondRegister.body);
      expect(secondBody.error).toBe('Conflict');
      expect(secondBody.message).toBe('Email already exists');
    });
  });

  describe('Protected Routes: Authorization', () => {
    it('should reject access to protected route without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Missing authorization header');
    });

    it('should reject access with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      // JWT can throw different error messages (jwt malformed, invalid token, etc.)
      expect(body.message).toBeDefined();
      expect(body.message.length).toBeGreaterThan(0);
    });

    it('should reject access with expired token', async () => {
      // Create expired token manually
      const expiredToken = jwt.sign(
        {
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'TEACHER',
        },
        env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Wait to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('jwt expired');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow TEACHER to access teacher-only routes', async () => {
      const teacherUser = {
        email: 'integration-test@example.com',
        password: 'TeacherPass123!',
        firstName: 'Teacher',
        lastName: 'Test',
        role: 'TEACHER' as const,
      };

      // Register as teacher
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: teacherUser,
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      // Access teacher dashboard
      const dashboardResponse = await app.inject({
        method: 'GET',
        url: '/api/teacher/dashboard',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(dashboardResponse.statusCode).toBe(200);
    });

    it('should reject STUDENT access to teacher-only routes', async () => {
      const studentUser = {
        email: 'student-test@example.com',
        password: 'StudentPass123!',
        firstName: 'Student',
        lastName: 'Test',
        role: 'STUDENT' as const,
      };

      // Register as student
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: studentUser,
      });

      const { accessToken } = JSON.parse(registerResponse.body);

      // Try to access teacher dashboard
      const dashboardResponse = await app.inject({
        method: 'GET',
        url: '/api/teacher/dashboard',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(dashboardResponse.statusCode).toBe(403);
      const body = JSON.parse(dashboardResponse.body);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('Insufficient permissions');
      expect(body.message).toContain('TEACHER');
    });

    it('should allow both TEACHER and STUDENT to access general protected routes', async () => {
      const teacherUser = {
        email: 'integration-test@example.com',
        password: 'TeacherPass123!',
        firstName: 'Teacher',
        lastName: 'Test',
        role: 'TEACHER' as const,
      };

      const studentUser = {
        email: 'student-test@example.com',
        password: 'StudentPass123!',
        firstName: 'Student',
        lastName: 'Test',
        role: 'STUDENT' as const,
      };

      // Register both users
      const teacherRegister = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: teacherUser,
      });

      const studentRegister = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: studentUser,
      });

      const teacherToken = JSON.parse(teacherRegister.body).accessToken;
      const studentToken = JSON.parse(studentRegister.body).accessToken;

      // Both should access /api/profile
      const teacherProfile = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: { authorization: `Bearer ${teacherToken}` },
      });

      const studentProfile = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: { authorization: `Bearer ${studentToken}` },
      });

      expect(teacherProfile.statusCode).toBe(200);
      expect(studentProfile.statusCode).toBe(200);

      const teacherBody = JSON.parse(teacherProfile.body);
      const studentBody = JSON.parse(studentProfile.body);

      expect(teacherBody.user.role).toBe('TEACHER');
      expect(studentBody.user.role).toBe('STUDENT');
    });
  });

  describe('Data Validation', () => {
    it('should reject registration with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email-format',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'TEACHER',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should reject registration with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
          role: 'TEACHER',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should reject registration with invalid role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN', // Invalid role (only TEACHER/STUDENT allowed)
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });
  });
});
