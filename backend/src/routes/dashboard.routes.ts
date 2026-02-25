import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

/**
 * Dashboard Routes
 *
 * Endpoints for dashboard statistics and analytics
 */
export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/dashboard/stats - Get dashboard statistics
  fastify.get(
    '/api/dashboard/stats',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['dashboard'],
        summary: 'Get dashboard statistics',
        description:
          'Returns comprehensive dashboard stats including document counts, exam counts, and recent activity',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Dashboard statistics',
            type: 'object',
            properties: {
              totalDocuments: { type: 'number' },
              totalExams: { type: 'number' },
              documentsChange: { type: 'string' },
              examsChange: { type: 'string' },
              lastActivity: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = (request as any).user.userId;

        // Execute GetDashboardStatsUseCase
        const result = await container.getDashboardStatsUseCase.execute({ userId });

        return reply.status(200).send({
          totalDocuments: result.totalDocuments,
          totalExams: result.totalExams,
          documentsChange: result.documentsChange,
          examsChange: result.examsChange,
          lastActivity: {
            timestamp: result.lastActivity.timestamp.toISOString(),
            description: result.lastActivity.description,
          },
        });
      } catch (error: any) {
        fastify.log.error('Dashboard stats error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to fetch dashboard statistics',
        });
      }
    }
  );
}
