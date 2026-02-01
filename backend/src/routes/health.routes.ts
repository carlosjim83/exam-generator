import { FastifyInstance } from 'fastify';
import { getQueueMetrics, getJobStatus } from '../infrastructure/queue/DocumentQueue.js';

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

  // GET /health/worker - Worker health check
  fastify.get(
    '/health/worker',
    {
      schema: {
        tags: ['health'],
        summary: 'Worker health check',
        description: 'Check worker status and queue metrics',
        response: {
          200: {
            description: 'Worker status and metrics',
            type: 'object',
            properties: {
              status: { type: 'string' },
              queue: {
                type: 'object',
                properties: {
                  waiting: { type: 'number' },
                  active: { type: 'number' },
                  completed: { type: 'number' },
                  failed: { type: 'number' },
                  total: { type: 'number' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
          503: {
            description: 'Worker unhealthy',
            type: 'object',
            properties: {
              status: { type: 'string' },
              error: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const metrics = await getQueueMetrics();

        // Consider worker unhealthy if there are too many failed jobs
        const isHealthy = metrics.failed < 10 || metrics.failed / metrics.total < 0.5;

        if (!isHealthy) {
          return reply.status(503).send({
            status: 'unhealthy',
            error: `Too many failed jobs: ${metrics.failed}/${metrics.total}`,
            queue: metrics,
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(200).send({
          status: 'ok',
          queue: metrics,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        fastify.log.error('Worker health check error:', error);

        return reply.status(503).send({
          status: 'error',
          error: error.message || 'Failed to get worker status',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /health/worker/job/:documentId - Check specific job status
  fastify.get(
    '/health/worker/job/:documentId',
    {
      schema: {
        tags: ['health'],
        summary: 'Get job status for a document',
        description: 'Check the processing queue job status for a specific document',
        params: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Document UUID' },
          },
          required: ['documentId'],
        },
        response: {
          200: {
            description: 'Job status',
            type: 'object',
            properties: {
              found: { type: 'boolean' },
              job: {
                type: 'object',
                nullable: true,
                properties: {
                  jobId: { type: 'string' },
                  state: { type: 'string' },
                  attemptsMade: { type: 'number' },
                  timestamp: { type: 'number' },
                  processedOn: { type: 'number', nullable: true },
                  finishedOn: { type: 'number', nullable: true },
                  failedReason: { type: 'string', nullable: true },
                },
              },
            },
          },
          500: {
            description: 'Error getting job status',
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
        const jobStatus = await getJobStatus(documentId);

        if (!jobStatus) {
          return reply.status(200).send({
            found: false,
            job: null,
          });
        }

        return reply.status(200).send({
          found: true,
          job: jobStatus,
        });
      } catch (error: any) {
        fastify.log.error('Get job status error:', error);

        return reply.status(500).send({
          error: error.message || 'Failed to get job status',
        });
      }
    }
  );
}
