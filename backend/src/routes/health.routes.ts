import type { FastifyInstance } from 'fastify';

import { workerHealthService } from '@infrastructure/queue/DocumentWorker.js';
import { getWorkerMetrics, getJobMetrics } from '@infrastructure/queue/WorkerMetrics.js';

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
        description: 'Check if the API and worker are running',
        response: {
          200: {
            description: 'API is healthy',
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              api: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                },
              },
              worker: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  isOnline: { type: 'boolean' },
                  uptime: { type: 'number' },
                  queueBacklog: { type: 'number' },
                  failureRate: { type: 'number' },
                },
              },
            },
          },
          503: {
            description: 'Service degraded or unhealthy',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // Get worker health status
        const workerHealth = await workerHealthService.getHealth();

        // Determine overall status
        // API is UP, but overall health depends on worker
        const overallStatus = workerHealth.status === 'healthy' ? 'healthy' : workerHealth.status;
        const httpStatus = workerHealth.status === 'unhealthy' ? 503 : 200;

        return reply.status(httpStatus).send({
          status: overallStatus,
          timestamp: new Date().toISOString(),
          api: {
            status: 'ok', // API is always ok if we reach this handler
          },
          worker: {
            status: workerHealth.status,
            isOnline: workerHealth.isWorkerOnline,
            uptime: workerHealth.uptime,
            queueBacklog: workerHealth.waitingJobs,
            failureRate: workerHealth.failureRate,
          },
        });
      } catch (error: any) {
        fastify.log.error('Health check error:', error);

        // API is up, but worker check failed
        return reply.status(503).send({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          api: {
            status: 'ok',
          },
          worker: {
            status: 'unhealthy',
            error: error.message || 'Failed to check worker status',
          },
        });
      }
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
            additionalProperties: true, // Allow any properties in response
          },
          503: {
            description: 'Worker unhealthy',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // Get health status from WorkerHealthService (worker lifecycle + basic metrics)
        const healthStatus = await workerHealthService.getHealth();

        // Get detailed job metrics from WorkerMetrics (job details, performance, etc.)
        const jobMetrics = await getWorkerMetrics();

        // Combine both: Worker health + Job details
        const combinedMetrics = {
          // Worker health and lifecycle (from WorkerHealthService)
          worker: {
            status: healthStatus.status,
            isOnline: healthStatus.isWorkerOnline,
            startTime: healthStatus.workerStartTime,
            uptime: healthStatus.uptime,
            lastActivity: healthStatus.lastActivity,
            timeSinceLastActivity: healthStatus.timeSinceLastActivity,
          },

          // Queue metrics (from WorkerHealthService)
          queue: {
            waiting: healthStatus.waitingJobs,
            active: healthStatus.activeJobs,
            completed: healthStatus.completedJobs,
            failed: healthStatus.failedJobs,
            failureRate: healthStatus.failureRate,
          },

          // Detailed job metrics and performance (from WorkerMetrics)
          performance: jobMetrics.performance,
          recentJobs: jobMetrics.recentJobs,

          timestamp: new Date().toISOString(),
        };

        // Return 503 if unhealthy
        if (healthStatus.status === 'unhealthy') {
          return reply.status(503).send(combinedMetrics);
        }

        return reply.status(200).send(combinedMetrics);
      } catch (error: any) {
        fastify.log.error('Worker health check error:', error);

        return reply.status(503).send({
          worker: {
            status: 'unhealthy',
            isOnline: false,
            uptime: 0,
            timeSinceLastActivity: 0,
          },
          queue: {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            failureRate: 0,
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
