/**
 * Worker Metrics Service
 *
 * Provides detailed metrics and statistics about document processing queue.
 * Used for monitoring, alerting, and observability dashboards.
 */

import { documentQueue } from './DocumentQueue.js';
import { Job } from 'bullmq';

export interface WorkerMetrics {
  // Queue counts
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };

  // Health indicators
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    failureRate: number; // Percentage (0-100)
    isProcessing: boolean;
    hasFailures: boolean;
  };

  // Performance metrics
  performance: {
    avgProcessingTime: number; // milliseconds
    avgWaitTime: number; // milliseconds
    throughput: {
      last1Hour: number;
      last24Hours: number;
    };
  };

  // Recent jobs
  recentJobs: {
    completed: Array<{
      jobId: string;
      documentId: string;
      completedAt: Date;
      processingTime: number;
      attemptsMade: number;
    }>;
    failed: Array<{
      jobId: string;
      documentId: string;
      failedAt: Date;
      reason: string;
      attemptsMade: number;
    }>;
  };

  // Timestamp
  timestamp: string;
}

export interface JobMetrics {
  jobId: string;
  documentId: string;
  state: string;
  progress: number;
  attemptsMade: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt: Date | null;
  finishedAt: Date | null;
  waitTime: number | null;
  processingTime: number | null;
  failedReason: string | null;
}

/**
 * Get comprehensive worker metrics
 */
export async function getWorkerMetrics(): Promise<WorkerMetrics> {
  // Get queue counts
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    documentQueue.getWaitingCount(),
    documentQueue.getActiveCount(),
    documentQueue.getCompletedCount(),
    documentQueue.getFailedCount(),
    documentQueue.getDelayedCount(),
  ]);

  const total = waiting + active + completed + failed;

  // Get recent jobs for detailed analysis
  const [completedJobs, failedJobs] = await Promise.all([
    documentQueue.getCompleted(0, 10), // Last 10 completed
    documentQueue.getFailed(0, 10), // Last 10 failed
  ]);

  // Calculate performance metrics
  const performance = await calculatePerformanceMetrics(completedJobs);

  // Determine health status
  const failureRate = total > 0 ? (failed / total) * 100 : 0;
  const health = determineHealthStatus(failed, failureRate, active);

  // Format recent jobs
  const recentCompleted = await Promise.all(
    completedJobs.map(async (job) => {
      const processingTime =
        job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : 0;

      return {
        jobId: job.id!,
        documentId: job.data.documentId,
        completedAt: new Date(job.finishedOn!),
        processingTime,
        attemptsMade: job.attemptsMade,
      };
    })
  );

  const recentFailed = await Promise.all(
    failedJobs.map(async (job) => ({
      jobId: job.id!,
      documentId: job.data.documentId,
      failedAt: new Date(job.finishedOn || job.processedOn || Date.now()),
      reason: job.failedReason || 'Unknown error',
      attemptsMade: job.attemptsMade,
    }))
  );

  return {
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total,
    },
    health,
    performance,
    recentJobs: {
      completed: recentCompleted,
      failed: recentFailed,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get detailed metrics for a specific job
 */
export async function getJobMetrics(documentId: string): Promise<JobMetrics | null> {
  const jobId = `doc-${documentId}`;
  const job = await documentQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = typeof job.progress === 'number' ? job.progress : 0;

  const waitTime = job.processedOn ? job.processedOn - job.timestamp : null;
  const processingTime =
    job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null;

  return {
    jobId: job.id!,
    documentId: job.data.documentId,
    state,
    progress: typeof progress === 'number' ? progress : 0,
    attemptsMade: job.attemptsMade,
    maxAttempts: job.opts.attempts || 3,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : null,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    waitTime,
    processingTime,
    failedReason: job.failedReason || null,
  };
}

/**
 * Calculate performance metrics from completed jobs
 */
async function calculatePerformanceMetrics(completedJobs: Job[]) {
  if (completedJobs.length === 0) {
    return {
      avgProcessingTime: 0,
      avgWaitTime: 0,
      throughput: {
        last1Hour: 0,
        last24Hours: 0,
      },
    };
  }

  // Calculate average processing time
  const processingTimes = completedJobs
    .filter((job) => job.finishedOn && job.processedOn)
    .map((job) => job.finishedOn! - job.processedOn!);

  const avgProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

  // Calculate average wait time
  const waitTimes = completedJobs
    .filter((job) => job.processedOn)
    .map((job) => job.processedOn! - job.timestamp);

  const avgWaitTime =
    waitTimes.length > 0 ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length : 0;

  // Calculate throughput
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // Get all completed jobs (up to 1000)
  const allCompleted = await documentQueue.getCompleted(0, 1000);

  const last1Hour = allCompleted.filter(
    (job) => job.finishedOn && job.finishedOn >= oneHourAgo
  ).length;
  const last24Hours = allCompleted.filter(
    (job) => job.finishedOn && job.finishedOn >= twentyFourHoursAgo
  ).length;

  return {
    avgProcessingTime,
    avgWaitTime,
    throughput: {
      last1Hour,
      last24Hours,
    },
  };
}

/**
 * Determine health status based on metrics
 */
function determineHealthStatus(
  failed: number,
  failureRate: number,
  active: number
): WorkerMetrics['health'] {
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Unhealthy: >50% failure rate OR >20 failed jobs
  if (failureRate > 50 || failed > 20) {
    status = 'unhealthy';
  }
  // Degraded: >20% failure rate OR >10 failed jobs
  else if (failureRate > 20 || failed > 10) {
    status = 'degraded';
  }

  return {
    status,
    failureRate,
    isProcessing: active > 0,
    hasFailures: failed > 0,
  };
}

/**
 * Get simple queue health status (for health check endpoint)
 */
export async function getQueueHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
}> {
  const metrics = await getWorkerMetrics();

  return {
    status: metrics.health.status,
    message:
      metrics.health.status !== 'healthy'
        ? `Failure rate: ${metrics.health.failureRate.toFixed(1)}%, Failed jobs: ${metrics.counts.failed}`
        : undefined,
  };
}
