import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AuthService } from '../services/auth.service.js';
import { TokenService } from '../services/token.service.js';

const authService = new AuthService();
const tokenService = new TokenService();

// Request/Response Schemas
const RegisterRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  firstName: Type.String({ minLength: 1 }),
  lastName: Type.String({ minLength: 1 }),
  role: Type.Union([Type.Literal('TEACHER'), Type.Literal('STUDENT')]),
});

const AuthResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    role: Type.String(),
    provider: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
  }),
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

const ErrorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register - Register new user
  fastify.post(
    '/auth/register',
    {
      schema: {
        body: RegisterRequestSchema,
        response: {
          201: AuthResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        tags: ['auth'],
        description: 'Register a new user with local authentication',
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

        // Register user
        const user = await authService.register({
          email,
          password,
          firstName,
          lastName,
          role,
        });

        // Generate tokens
        const tokens = tokenService.generateTokenPair({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Return user + tokens
        return reply.status(201).send({
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
      schema: {
        body: Type.Object({
          email: Type.String({ format: 'email' }),
          password: Type.String({ minLength: 1 }),
        }),
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
        },
        tags: ['auth'],
        description: 'Login with email and password (local authentication)',
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Validate credentials
        const user = await authService.validateCredentials(email, password);

        if (!user) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Generate tokens
        const tokens = tokenService.generateTokenPair({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Return user + tokens
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
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message || 'Login failed',
        });
      }
    }
  );
}
