import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { UserId } from '@domain/value-objects/UserId.js';
import {
  AuthResponseSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  RegisterRequestSchema,
} from '@schemas/auth.js';
import { ErrorResponseSchema } from '@schemas/common.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register - Register new user
  fastify.post(
    '/api/auth/register',
    {
      config: {
        rateLimit: {
          max: 3, // Only 3 registrations per timeWindow
          timeWindow: '1 hour', // Per hour
        },
      },
      schema: {
        body: RegisterRequestSchema,
        response: {
          201: AuthResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Register new user',
        description:
          'Create a new user account with local authentication (email/password). Returns user data and JWT tokens upon successful registration.',
      },
    },
    async (request, reply) => {
      try {
        const { email, password, firstName, lastName, role } = request.body as {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          role: 'TEACHER' | 'STUDENT';
        };

        // Execute RegisterUserUseCase
        const result = await container.registerUserUseCase.execute({
          email,
          password,
          firstName,
          lastName,
          role,
        });

        // Return user + tokens
        return reply.status(201).send({
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            provider: result.user.provider,
            createdAt: result.user.createdAt.toISOString(),
            updatedAt: result.user.updatedAt.toISOString(),
          },
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });
      } catch (error: any) {
        // Handle email already exists
        if (error.message === 'Email already exists') {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: 'Email already exists',
          });
        }

        // Handle other errors
        fastify.log.error(error);
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message || 'Registration failed',
        });
      }
    }
  );

  // POST /api/auth/login - Login with email and password
  fastify.post(
    '/api/auth/login',
    {
      config: {
        rateLimit: {
          max: 5, // Only 5 login attempts per timeWindow (anti-brute force)
          timeWindow: '1 minute',
        },
      },
      schema: {
        body: LoginRequestSchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Login with credentials',
        description:
          'Authenticate with email and password. Returns user data and JWT tokens upon successful login.',
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Execute LoginUserUseCase
        const result = await container.loginUserUseCase.execute({
          email,
          password,
        });

        // Return user + tokens
        return reply.status(200).send({
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            provider: result.user.provider,
            createdAt: result.user.createdAt.toISOString(),
            updatedAt: result.user.updatedAt.toISOString(),
          },
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });
      } catch (error: any) {
        // Handle invalid credentials
        if (
          error.message === 'Invalid credentials' ||
          error.message.includes('OAuth authentication')
        ) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message.includes('OAuth') ? error.message : 'Invalid email or password',
          });
        }

        fastify.log.error(error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Login failed',
        });
      }
    }
  );

  // GET /api/auth/me - Get current authenticated user
  fastify.get(
    '/api/auth/me',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['auth'],
        summary: 'Get current user',
        description: 'Returns the currently authenticated user based on the JWT token',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: { type: 'string' },
              provider: { type: 'string' },
            },
          },
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user!;
        // Fetch full user details from repository
        const fullUser = await container.userRepository.findById(UserId.create(user.userId));
        if (!fullUser) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'User not found',
          });
        }
        return reply.status(200).send({
          id: fullUser.id.toString(),
          email: fullUser.email,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          role: fullUser.role,
          provider: fullUser.provider,
          createdAt: fullUser.createdAt.toISOString(),
          updatedAt: fullUser.updatedAt.toISOString(),
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message || 'Authentication failed',
        });
      }
    }
  );

  // POST /api/auth/refresh - Refresh access token
  fastify.post(
    '/api/auth/refresh',
    {
      config: {
        rateLimit: {
          max: 10, // 10 refresh requests per minute (normal usage)
          timeWindow: '1 minute',
        },
      },
      schema: {
        body: RefreshRequestSchema,
        response: {
          200: AuthResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        tags: ['auth'],
        summary: 'Refresh access token',
        description:
          'Use refresh token to obtain a new access token and refresh token pair. The old refresh token becomes invalid after use.',
      },
    },
    async (request, reply) => {
      try {
        const { refreshToken } = request.body as {
          refreshToken: string;
        };

        // Execute RefreshTokenUseCase
        const result = await container.refreshTokenUseCase.execute({
          refreshToken,
        });

        // Get user from repository to return full user data
        const userId = container.tokenService.verifyRefreshToken(refreshToken).userId;
        const user = await container.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Return user + new tokens
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
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });
      } catch (error: any) {
        fastify.log.error(error);

        // Handle JWT errors specifically
        if (error.message.includes('token') || error.message.includes('Token')) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message || 'Invalid or expired refresh token',
          });
        }

        // Handle other errors
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: error.message || 'Token refresh failed',
        });
      }
    }
  );
}
