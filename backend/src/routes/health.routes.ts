import { FastifyInstance } from 'fastify';
import { getWorkerMetrics, getJobMetrics } from '../infrastructure/queue/WorkerMetrics.js';

/**
 * Health check routes for monitoring system status
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // GET /health - Basic health check
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Basic health check',
        description: 'Check if the API is running',
        response: {
          200: {
            description: 'API is healthy',
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    }
  );

  // GET /health/worker - Worker health check with detailed metrics
  fastify.get(
    '/health/worker',
    {
      schema: {
        tags: ['health'],
        summary: 'Worker health check with metrics',
        description: 'Get detailed worker status, queue metrics, and performance data',
        response: {
          200: {
            description: 'Worker metrics',
            type: 'object',
          },
          503: {
            description: 'Worker unhealthy',
            type: 'object',
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const metrics = await getWorkerMetrics();

        // Return 503 if unhealthy
        if (metrics.health.status === 'unhealthy') {
          return reply.status(503).send(metrics);
        }

        return reply.status(200).send(metrics);
      } catch (error: any) {
        fastify.log.error('Worker health check error:', error);

        return reply.status(503).send({
          counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 },
          health: {
            status: 'unhealthy',
            failureRate: 0,
            isProcessing: false,
            hasFailures: false,
          },
          performance: {
            avgProcessingTime: 0,
            avgWaitTime: 0,
            throughput: { last1Hour: 0, last24Hours: 0 },
          },
          recentJobs: { completed: [], failed: [] },
          timestamp: new Date().toISOString(),
          error: error.message || 'Failed to get worker status',
        });
      }
    }
  );

  // GET /health/worker/job/:documentId - Check specific job status with detailed metrics
  fastify.get(
    '/health/worker/job/:documentId',
    {
      schema: {
        tags: ['health'],
        summary: 'Get detailed job metrics for a document',
        description:
          'Check the processing queue job status with performance metrics for a specific document',
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Document UUID' },
          },
          required: ['documentId'],
        },
        response: {
          200: {
            description: 'Job metrics',
            type: 'object',
          },
          500: {
            description: 'Error getting job metrics',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { documentId } = request.params as { documentId: string };
        const jobMetrics = await getJobMetrics(documentId);

        if (!jobMetrics) {
          return reply.status(200).send({
            found: false,
            job: null,
          });
        }

        return reply.status(200).send({
          found: true,
          job: jobMetrics,
        });
      } catch (error: any) {
        fastify.log.error('Get job metrics error:', error);

        return reply.status(500).send({
          error: error.message || 'Failed to get job metrics',
        });
      }
    }
  );
}
