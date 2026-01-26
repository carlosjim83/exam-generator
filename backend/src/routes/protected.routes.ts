import { FastifyInstance } from 'fastify';
import { authenticateUser, requireRoles } from '../middleware/auth.middleware.js';

export async function protectedRoutes(fastify: FastifyInstance) {
  // GET /api/profile - Protected route (requires authentication)
  fastify.get(
    '/api/profile',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['protected'],
        description: 'Get authenticated user profile',
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
        description: 'Teacher dashboard (TEACHER role required)',
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
