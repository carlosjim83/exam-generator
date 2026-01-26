import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authenticateUser, requireRoles } from '../middleware/auth.middleware.js';

// Response schemas
const ProfileResponseSchema = Type.Object({
  message: Type.String(),
  user: Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: Type.String(),
  }),
});

const DashboardResponseSchema = Type.Object({
  message: Type.String(),
  data: Type.Object({
    totalDocuments: Type.Number(),
    totalExams: Type.Number(),
  }),
});

const ErrorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
});

export async function protectedRoutes(fastify: FastifyInstance) {
  // GET /api/profile - Protected route (requires authentication)
  fastify.get(
    '/api/profile',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['protected'],
        summary: 'Get user profile',
        description: 'Returns the authenticated user\'s profile information. Requires valid JWT token.',
        security: [{ bearerAuth: [] }],
        response: {
          200: ProfileResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user;
      return reply.send({
        message: 'Access granted',
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
      });
    }
  );

  // GET /api/teacher/dashboard - Teacher only route
  fastify.get(
    '/api/teacher/dashboard',
    {
      preHandler: [authenticateUser, requireRoles(['TEACHER'])],
      schema: {
        tags: ['protected'],
        summary: 'Get teacher dashboard',
        description: 'Returns teacher dashboard with statistics. Requires TEACHER role.',
        security: [{ bearerAuth: [] }],
        response: {
          200: DashboardResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        message: 'Welcome to teacher dashboard',
        data: {
          totalDocuments: 10,
          totalExams: 5,
        },
      });
    }
  );
}
