import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { container } from '../config/container.js';

// Request/Response Schemas
const RegisterRequestSchema = Type.Object(
  {
    email: Type.String({ 
      format: 'email',
      description: 'User email address (must be unique)',
      examples: ['teacher@example.com'],
    }),
    password: Type.String({ 
      minLength: 8,
      description: 'Password (minimum 8 characters)',
      examples: ['SecurePass123!'],
    }),
    firstName: Type.String({ 
      minLength: 1,
      description: 'User first name',
      examples: ['John'],
    }),
    lastName: Type.String({ 
      minLength: 1,
      description: 'User last name',
      examples: ['Doe'],
    }),
    role: Type.Union([Type.Literal('TEACHER'), Type.Literal('STUDENT')], {
      description: 'User role (TEACHER or STUDENT)',
      examples: ['TEACHER'],
    }),
  },
  {
    description: 'User registration request',
  }
);

const LoginRequestSchema = Type.Object(
  {
    email: Type.String({ 
      format: 'email',
      description: 'User email address',
      examples: ['teacher@example.com'],
    }),
    password: Type.String({ 
      minLength: 1,
      description: 'User password',
      examples: ['password123'],
    }),
  },
  {
    description: 'User login request',
  }
);

const AuthResponseSchema = Type.Object(
  {
    user: Type.Object({
      id: Type.String({ description: 'User UUID' }),
      email: Type.String({ description: 'User email' }),
      firstName: Type.String({ description: 'User first name' }),
      lastName: Type.String({ description: 'User last name' }),
      role: Type.String({ description: 'User role (TEACHER or STUDENT)' }),
      provider: Type.String({ description: 'Authentication provider (LOCAL, GOOGLE, etc.)' }),
      createdAt: Type.String({ description: 'User creation timestamp (ISO 8601)' }),
      updatedAt: Type.String({ description: 'User last update timestamp (ISO 8601)' }),
    }),
    accessToken: Type.String({ description: 'JWT access token (15 minutes TTL)' }),
    refreshToken: Type.String({ description: 'JWT refresh token (7 days TTL)' }),
  },
  {
    description: 'Successful authentication response',
  }
);

const RefreshRequestSchema = Type.Object(
  {
    refreshToken: Type.String({ 
      minLength: 1,
      description: 'JWT refresh token (7 days TTL)',
      examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
    }),
  },
  {
    description: 'Token refresh request',
  }
);

const ErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ description: 'HTTP status code' }),
    error: Type.String({ description: 'Error name' }),
    message: Type.String({ description: 'Error message' }),
  },
  {
    description: 'Error response',
  }
);

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register - Register new user
  fastify.post(
    '/auth/register',
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
        description: 'Create a new user account with local authentication (email/password). Returns user data and JWT tokens upon successful registration.',
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

  // POST /auth/login - Login with email and password
  fastify.post(
    '/auth/login',
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
        },
        tags: ['auth'],
        summary: 'Login with credentials',
        description: 'Authenticate with email and password. Returns user data and JWT tokens upon successful login.',
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
        if (error.message === 'Invalid credentials' || error.message.includes('OAuth authentication')) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: error.message.includes('OAuth') ? error.message : 'Invalid email or password',
          });
        }

        fastify.log.error(error);
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message || 'Login failed',
        });
      }
    }
  );

  // POST /auth/refresh - Refresh access token
  fastify.post(
    '/auth/refresh',
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
        description: 'Use refresh token to obtain a new access token and refresh token pair. The old refresh token becomes invalid after use.',
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
