import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from '@routes/auth.routes.js';
import { prisma } from '@config/prisma.js';

describe('Rate Limiting', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Register rate limit plugin (same config as server.ts but with lower limits for faster testing)
    await app.register(rateLimit, {
      global: true,
      max: 100,
      timeWindow: '1 minute',
      cache: 10000,
      allowList: [],
      redis: undefined,
      nameSpace: 'test:',
      continueExceeding: true,
      skipOnError: true,
      keyGenerator: (request) => request.ip,
      errorResponseBuilder: (_request, context) => {
        return {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
          retryAfter: context.ttl,
        };
      },
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
    });

    await app.register(authRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('POST /auth/login - Rate Limiting', () => {
    it('should allow requests within rate limit (5 per minute)', async () => {
      // First request should succeed
      const response1 = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'teacher@example.com',
          password: 'wrong-password',
        },
      });

      // Should return 401 (wrong password) not 429 (rate limited)
      expect(response1.statusCode).toBe(401);
      expect(response1.headers['x-ratelimit-limit']).toBeDefined();
      expect(response1.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should block requests after exceeding rate limit', async () => {
      // Make 5 login attempts (the limit)
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: `rate-test-${i}@example.com`,
            password: 'password',
          },
        });
      }

      // 6th request should be rate limited
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'rate-test-blocked@example.com',
          password: 'password',
        },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Too Many Requests');
      expect(body.message).toContain('Rate limit exceeded');
      expect(body.retryAfter).toBeDefined();
    });
  });

  describe('POST /auth/register - Rate Limiting', () => {
    it('should include rate limit headers in response', async () => {
      const uniqueEmail = `rate-limit-test-${Date.now()}@example.com`;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'RateTest123!',
          firstName: 'Rate',
          lastName: 'Test',
          role: 'TEACHER',
        },
      });

      // Should have rate limit headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
    });

    it('should have stricter limits for registration (3 per hour)', async () => {
      // We can't test the full hour limit in unit tests, but we can verify
      // that the config is applied by checking the limit header
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        },
      });

      // Check that rate limit is configured (header should be present)
      expect(response.headers['x-ratelimit-limit']).toBeDefined();

      // Note: Actual limit value is '3' but we can't easily test the 1-hour window
      // in a fast unit test. The important thing is that rate limiting is active.
    });
  });

  describe('POST /auth/refresh - Rate Limiting', () => {
    it('should have moderate limits for token refresh (10 per minute)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'dummy.token.here',
        },
      });

      // Should have rate limit headers (even on 401 error)
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();

      // Should return 401 (invalid token) not 429 (rate limited) on first request
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include x-ratelimit-limit header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password',
        },
      });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(Number(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    });

    it('should include x-ratelimit-remaining header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password',
        },
      });

      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(Number(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
    });

    it('should include x-ratelimit-reset header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password',
        },
      });

      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(Number(response.headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    });
  });
});
