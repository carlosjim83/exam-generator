import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import {
  DashboardStatsResponseSchema,
  RecentClassExamsResponseSchema,
} from '@schemas/dashboard.js';
import { ErrorResponseSchema, UnauthorizedResponseSchema } from '@schemas/common.js';

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
          200: DashboardStatsResponseSchema,
          401: UnauthorizedResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;

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
          message: 'Failed to fetch dashboard statistics',
        });
      }
    }
  );

  // GET /api/dashboard/class-exams - Get recent class exams for teacher
  fastify.get(
    '/api/dashboard/class-exams',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['dashboard'],
        summary: 'Get recent class exams for teacher',
        description:
          'Returns recent class exams with exam title, class name, and publication status',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 50,
              default: 10,
              description: 'Maximum number of exams to return',
            },
          },
        },
        response: {
          200: RecentClassExamsResponseSchema,
          401: UnauthorizedResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;
        const query = request.query as { limit?: number };
        const limit = query.limit ? Math.min(Math.max(query.limit, 1), 50) : 10;

        // Execute ListRecentClassExamsUseCase
        const result = await container.listRecentClassExamsUseCase.execute({
          teacherId: userId,
          limit,
        });

        return reply.status(200).send({
          classExams: result.classExams.map((exam) => ({
            id: exam.id,
            examId: exam.examId,
            classId: exam.classId,
            examTitle: exam.examTitle,
            className: exam.className,
            dueDate: exam.dueDate ? exam.dueDate.toISOString() : null,
            isPublished: exam.isPublished,
            questionCount: exam.questionCount,
            submittedCount: exam.submittedCount,
            createdAt: exam.createdAt.toISOString(),
          })),
        });
      } catch (error: any) {
        fastify.log.error('Recent class exams error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch recent class exams',
        });
      }
    }
  );
}
