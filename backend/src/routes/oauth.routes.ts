import oauthPlugin from '@fastify/oauth2';
import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { env } from '@config/env.js';
import { prisma } from '@config/prisma.js';
import type { UserRole } from '@domain/entities/User.js';
import { AuthProvider } from '@domain/entities/User.js';
import { Email } from '@domain/value-objects/Email.js';
import { UserId } from '@domain/value-objects/UserId.js';

export async function oauthRoutes(fastify: FastifyInstance) {
  // Register Google OAuth2 plugin
  await fastify.register(oauthPlugin, {
    name: 'googleOAuth',
    scope: ['profile', 'email'], // Request user profile and email
    credentials: {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/api/auth/google',
    callbackUri: env.GOOGLE_CALLBACK_URL,
    // Custom state generation to include role
    generateStateFunction: (request) => {
      // Get role from query parameter (default to TEACHER)
      const role = (request.query as any).role || 'TEACHER';
      return JSON.stringify({ role, timestamp: Date.now() });
    },
    // Custom state checker - validates state from query param
    checkStateFunction(request) {
      try {
        const state = (request.query as any).state;
        const stateData = JSON.parse(state);
        // Basic validation: state must have role and timestamp
        return (
          stateData &&
          typeof stateData.role === 'string' &&
          typeof stateData.timestamp === 'number' &&
          Date.now() - stateData.timestamp < 10 * 60 * 1000 // 10 min expiry
        );
      } catch {
        return false;
      }
    },
  });

  // GET /api/auth/google/callback - Handle OAuth callback
  fastify.get('/api/auth/google/callback', async (request, reply) => {
    try {
      // Exchange authorization code for access token
      const { token } = await (fastify as any).googleOAuth.getAccessTokenFromAuthorizationCodeFlow(
        request
      );

      // Extract role from OAuth state
      let role: 'TEACHER' | 'STUDENT' = 'TEACHER'; // Default
      try {
        const state = (request.query as any).state;
        if (state) {
          const stateData = JSON.parse(state);
          if (stateData.role === 'TEACHER' || stateData.role === 'STUDENT') {
            role = stateData.role;
          }
        }
      } catch (error) {
        fastify.log.warn({ error }, 'Failed to parse OAuth state, using default role TEACHER');
      }

      fastify.log.info(`OAuth flow initiated with role: ${role}`);

      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const googleUser = (await userInfoResponse.json()) as {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
      };

      fastify.log.info({ user: googleUser }, 'Google user info');

      // Check if email is verified
      if (!googleUser.verified_email) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Email not verified. Please verify your email with Google.',
        });
      }

      // Find or create user in database
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // User exists - check if it's a Google user or needs linking
        if (user.provider !== AuthProvider.GOOGLE) {
          // User exists with different provider (LOCAL, GITHUB, etc.)
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: `Email ${googleUser.email} is already registered with ${user.provider} provider. Please login with ${user.provider}.`,
          });
        }

        // User exists with Google provider - update providerId if needed
        if (user.providerId !== googleUser.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { providerId: googleUser.id },
          });
        }
      } else {
        // Create new user with role from OAuth state
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.given_name || 'Google',
            lastName: googleUser.family_name || 'User',
            provider: AuthProvider.GOOGLE,
            providerId: googleUser.id,
            password: null, // OAuth users don't have passwords
            role: role, // Use role from OAuth state
          },
        });

        fastify.log.info(`Created new Google user: ${user.email} with role: ${role}`);
      }

      // Generate JWT tokens using container
      const userId = UserId.create(user.id);
      const email = Email.create(user.email);
      const tokens = container.tokenService.generateTokenPair(userId, email, user.role as UserRole);

      // Redirect to frontend with tokens in URL hash fragment
      // Hash fragments are NOT sent to the server, avoiding logs/history exposure
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
      const hashParams = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        provider: user.provider,
      }).toString();
      const redirectUrl = `${frontendUrl}/auth/callback#${hashParams}`;

      return reply.redirect(redirectUrl);
    } catch (error: any) {
      fastify.log.error('Google OAuth error:', error);

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Google OAuth authentication failed',
      });
    }
  });

  // ============================================================================
  // MOCK OAUTH (Development Only)
  // ============================================================================
  const ENABLE_MOCK = env.ENABLE_OAUTH_MOCK === 'true';

  if (ENABLE_MOCK) {
    fastify.log.warn('⚠️  OAuth Mock Mode ENABLED - For development only!');

    // GET /api/auth/google/mock?role=TEACHER|STUDENT
    fastify.get('/api/auth/google/mock', async (request, reply) => {
      const role = (request.query as any).role || 'TEACHER';

      // Validate role
      if (role !== 'TEACHER' && role !== 'STUDENT') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid role. Must be TEACHER or STUDENT',
        });
      }

      const mockEmail = `mock.${role.toLowerCase()}@example.com`;

      try {
        // Find or create mock user
        let user = await prisma.user.findUnique({
          where: { email: mockEmail },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: mockEmail,
              firstName: 'Mock',
              lastName: role === 'TEACHER' ? 'Teacher' : 'Student',
              provider: AuthProvider.GOOGLE,
              providerId: `mock_google_${Date.now()}`,
              password: null,
              role: role as any,
            },
          });
        }

        // Generate tokens
        const userId = UserId.create(user.id);
        const userEmail = Email.create(user.email);
        const tokens = container.tokenService.generateTokenPair(
          userId,
          userEmail,
          user.role as UserRole
        );

        // Redirect to frontend with tokens in URL hash fragment
        const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
        const hashParams = new URLSearchParams({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
          provider: user.provider,
        }).toString();
        const redirectUrl = `${frontendUrl}/auth/callback#${hashParams}`;

        return reply.redirect(redirectUrl);
      } catch (error: any) {
        fastify.log.error('Mock OAuth error:', error);
        const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
        return reply.redirect(`${frontendUrl}/login?error=mock_oauth_failed`);
      }
    });
  }
}
