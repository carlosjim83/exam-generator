import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { authenticateUser, requireRoles } from '@middleware/auth.middleware.js';
import { ErrorResponseSchema } from '@schemas/common.js';
import { ProfileResponseSchema, TeacherDashboardResponseSchema } from '@schemas/protected.js';

export async function protectedRoutes(fastify: FastifyInstance) {
  // GET /api/profile - Protected route (requires authentication)
  fastify.get(
    '/api/profile',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['protected'],
        summary: 'Get user profile',
        description:
          "Returns the authenticated user's complete profile information. Requires valid JWT token.",
        security: [{ bearerAuth: [] }],
        response: {
          200: ProfileResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const jwtUser = request.user!;

      // Load complete user data from database
      const userRepository = container.userRepository;
      const userId = UserId.create(jwtUser.userId);
      const user = await userRepository.findById(userId);

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Return complete user profile
      return reply.send({
        id: user.id.value,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider: user.provider,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
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
          200: TeacherDashboardResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
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
