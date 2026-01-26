import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { container } from '../config/container.js';
import { UserId } from '../domain/value-objects/UserId.js';
import { Email } from '../domain/value-objects/Email.js';
import { UserRole } from '../domain/entities/User.js';
import { AuthProvider } from '@prisma/client';

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
    startRedirectPath: '/auth/google',
    callbackUri: env.GOOGLE_CALLBACK_URL,
  });

  // GET /auth/google - Initiate Google OAuth flow
  // This route is automatically handled by @fastify/oauth2
  // It redirects the user to Google's consent screen

  // GET /auth/google/callback - Handle OAuth callback
  fastify.get('/auth/google/callback', async (request, reply) => {
    try {
      // Exchange authorization code for access token
      const { token } = await fastify.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);

      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const googleUser = await userInfoResponse.json() as {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
      };

      fastify.log.info('Google user info:', googleUser);

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
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.given_name || 'Google',
            lastName: googleUser.family_name || 'User',
            provider: AuthProvider.GOOGLE,
            providerId: googleUser.id,
            password: null, // OAuth users don't have passwords
            role: 'TEACHER', // Default role (can be changed later)
          },
        });

        fastify.log.info(`Created new Google user: ${user.email}`);
      }

      // Generate JWT tokens using container
      const userId = UserId.create(user.id);
      const email = Email.create(user.email);
      const tokens = container.tokenService.generateTokenPair(
        userId,
        email,
        user.role as UserRole
      );

      // In production, you'd want to:
      // 1. Redirect to frontend with tokens in URL params or cookies
      // 2. Or use a state parameter to maintain session
      // For now, return JSON for testing
      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          provider: user.provider,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Google OAuth authentication successful',
      });
    } catch (error: any) {
      fastify.log.error('Google OAuth error:', error);

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || 'Google OAuth authentication failed',
      });
    }
  });
}
