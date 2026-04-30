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
  {},
  { additionalProperties: true, description: 'Worker health metrics' }
);

export const JobMetricsResponseSchema = Type.Object(
  {
    found: Type.Boolean(),
    job: Type.Union([Type.Object({}), Type.Null()]),
  },
  { description: 'Job metrics' }
);
