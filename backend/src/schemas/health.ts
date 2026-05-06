import { Type } from '@sinclair/typebox';

// --- Health schemas ---

export const HealthStatusResponseSchema = Type.Object(
  {
    status: Type.String(),
    timestamp: Type.String(),
    api: Type.Object({
      status: Type.String(),
    }),
    worker: Type.Object({
      status: Type.String(),
      isOnline: Type.Boolean(),
      uptime: Type.Number(),
      queueBacklog: Type.Number(),
      failureRate: Type.Number(),
    }),
  },
  { description: 'Health status' }
);

export const HealthDegradedResponseSchema = Type.Object(
  {
    status: Type.String(),
    timestamp: Type.String(),
    api: Type.Object({
      status: Type.String(),
    }),
    worker: Type.Object({
      status: Type.String(),
      error: Type.String(),
    }),
  },
  { description: 'Health degraded' }
);

export const WorkerHealthResponseSchema = Type.Object(
  {
    worker: Type.Object({
      status: Type.String(),
      isOnline: Type.Boolean(),
      startTime: Type.Optional(Type.String()),
      uptime: Type.Number(),
      lastActivity: Type.Optional(Type.String()),
      timeSinceLastActivity: Type.Optional(Type.Number()),
    }),
    queue: Type.Object({
      waiting: Type.Number(),
      active: Type.Number(),
      completed: Type.Number(),
      failed: Type.Number(),
      failureRate: Type.Number(),
    }),
    performance: Type.Object({
      avgProcessingTime: Type.Number(),
      avgWaitTime: Type.Number(),
      throughput: Type.Object({
        last1Hour: Type.Number(),
        last24Hours: Type.Number(),
      }),
    }),
    recentJobs: Type.Object({
      completed: Type.Array(
        Type.Object({
          jobId: Type.String(),
          documentId: Type.String(),
          completedAt: Type.String(),
          processingTime: Type.Number(),
          attemptsMade: Type.Number(),
        })
      ),
      failed: Type.Array(
        Type.Object({
          jobId: Type.String(),
          documentId: Type.String(),
          failedAt: Type.String(),
          reason: Type.String(),
          attemptsMade: Type.Number(),
        })
      ),
    }),
    timestamp: Type.String(),
    error: Type.Optional(Type.String()),
  },
  { description: 'Worker health metrics' }
);

export const JobMetricsResponseSchema = Type.Object(
  {
    found: Type.Boolean(),
    job: Type.Union([Type.Object({}), Type.Null()]),
  },
  { description: 'Job metrics' }
);
