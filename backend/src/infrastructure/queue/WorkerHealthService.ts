/**
 * Worker Health Service
 *
 * Monitors BullMQ worker health and queue metrics.
 * Provides health status for monitoring and alerting in production.
 *
 * Health Statuses:
 * - healthy: Worker is processing, acceptable failure rate (<10%), no significant queue backlog
 * - degraded: Warning signs (failure rate 10-30%, moderate backlog, no recent activity)
 * - unhealthy: Critical issues (failure rate >30%, queue blocked, worker offline)
 */

import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

// Type for Redis connection options (not instance)
export type RedisConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
  enableReadyCheck: boolean;
  retryStrategy: (times: number) => number;
  tls?: { servername: string };
};

// ============================================================================
// Type Definitions
// ============================================================================

export type WorkerHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface WorkerHealthResult {
  status: WorkerHealthStatus;
  workerQueueName: string;
  isWorkerOnline: boolean;
  activeJobs: number;
  waitingJobs: number;
  failedJobs: number;
  completedJobs: number;
  totalJobsProcessed: number;
  failureRate: number;
  lastActivity?: number;
  timeSinceLastActivity: number;
  workerStartTime?: number;
  uptime: number;
}

export interface WorkerMetrics {
  queue: {
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  worker: {
    startTime?: number;
    uptime: number;
    isOnline: boolean;
  };
  performance: {
    failureRate: number;
    avgProcessingTimeMs: number;
    totalJobsProcessed: number;
  };
  timeSinceLastActivity: number;
  timestamp: number;
}

export interface JobProcessedEvent {
  documentId: string;
  processingTimeMs: number;
  success: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const HEALTH_CONFIG = {
  // Thresholds for health status determination
  CRITICAL_FAILURE_RATE: 0.3, // 30%
  DEGRADED_FAILURE_RATE: 0.1, // 10%

  // Maximum acceptable waiting jobs before unhealthy
  CRITICAL_QUEUE_BACKLOG: 50,
  DEGRADED_QUEUE_BACKLOG: 20,

  // Maximum time without activity before unhealthy (milliseconds)
  MAX_INACTIVITY_MS: 5 * 60 * 1000, // 5 minutes

  // Maximum time without activity before degraded (milliseconds)
  MAX_DEGRADED_INACTIVITY_MS: 2 * 60 * 1000, // 2 minutes
} as const;

// ============================================================================
// Worker Health Service Implementation
// ============================================================================

export class WorkerHealthService {
  private queue: Queue;
  private queueName: string;

  // Internal state
  private workerStartTime?: number;
  private lastActivityTimestamp?: number;
  private processingTimes: number[] = []; // Store recent processing times for average calculation
  private totalJobsProcessed = 0;
  private isShutDown = false;
  private workerRegistered = false; // Track if worker has started

  constructor(params: {
    workerQueueName: string;
    queue: Queue;
    redisConnection: Redis | RedisConnectionOptions;
  }) {
    this.queueName = params.workerQueueName;
    this.queue = params.queue;
    // redisConnection reserved for future use (direct Redis health checks)
  }

  // ==========================================================================
  // Public API - Health Checks
  // ==========================================================================

  /**
   * Get comprehensive health status of the worker and queue
   *
   * @returns Worker health result with status, metrics, and flags
   */
  async getHealth(): Promise<WorkerHealthResult> {
    if (this.isShutDown) {
      return this.buildHealthResult({
        status: 'unhealthy',
        isWorkerOnline: false,
        reason: 'Worker shutdown',
      });
    }

    try {
      const jobCounts = await this.queue.getJobCounts();
      const activeJobs = await this.queue.getActive();
      const failedJobs = await this.queue.getFailed();

      const completed = jobCounts.completed || 0;
      const failed = jobCounts.failed || 0;

      // Calculate failure rate
      const totalAttempted = completed + failed;
      const failureRate = totalAttempted > 0 ? failed / totalAttempted : 0;

      // Determine worker online status
      // Worker is "online" if it has been registered (started) and not shut down
      // Having active jobs is just a bonus indicator, not a requirement
      const isWorkerOnline = this.workerRegistered && !this.isShutDown;

      // Auto-track activity if we see active jobs
      const now = Date.now();
      if (activeJobs.length > 0 && !this.lastActivityTimestamp) {
        this.lastActivityTimestamp = now;
      }

      // Calculate time since last activity
      const timeSinceLastActivity = this.lastActivityTimestamp
        ? now - this.lastActivityTimestamp
        : Infinity;

      // Determine health status
      const status = this.determineHealthStatus({
        activeJobs: activeJobs.length,
        waitingJobs: jobCounts.waiting || 0,
        failedJobs: failedJobs.length,
        failureRate,
        timeSinceLastActivity,
        isWorkerOnline,
      });

      return this.buildHealthResult({
        status,
        isWorkerOnline,
        activeJobs: activeJobs.length,
        waitingJobs: jobCounts.waiting || 0,
        failedJobs: failedJobs.length,
        completedJobs: completed,
        failureRate,
        timeSinceLastActivity,
        lastActivity: this.lastActivityTimestamp,
        workerStartTime: this.workerStartTime,
      });
    } catch (error) {
      // If queue is unreachable, treat as unhealthy
      console.error('[WorkerHealthService] Error fetching health:', error);
      return this.buildHealthResult({
        status: 'unhealthy',
        isWorkerOnline: false,
        reason: 'Queue unreachable',
      });
    }
  }

  /**
   * Get detailed metrics for monitoring and observability
   *
   * @returns Comprehensive metrics for Prometheus, Datadog, etc.
   */
  async getMetrics(): Promise<WorkerMetrics> {
    const health = await this.getHealth();
    const jobCounts = await this.queue.getJobCounts();

    // Calculate average processing time
    const avgProcessingTimeMs =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
        : 0;

    return {
      queue: {
        name: this.queueName,
        waiting: jobCounts.waiting || 0,
        active: jobCounts.active || 0,
        completed: jobCounts.completed || 0,
        failed: jobCounts.failed || 0,
        delayed: jobCounts.delayed || 0,
        paused: jobCounts.paused || 0,
      },
      worker: {
        startTime: this.workerStartTime,
        uptime: this.workerStartTime ? Date.now() - this.workerStartTime : 0,
        isOnline: health.isWorkerOnline,
      },
      performance: {
        failureRate: health.failureRate,
        avgProcessingTimeMs,
        totalJobsProcessed: this.totalJobsProcessed,
      },
      timeSinceLastActivity: health.timeSinceLastActivity,
      timestamp: Date.now(),
    };
  }

  /**
   * Quick health check - true if healthy, false otherwise
   *
   * @returns boolean indicating if worker is healthy
   */
  async isHealthy(): Promise<boolean> {
    const health = await this.getHealth();
    return health.status === 'healthy';
  }

  // ==========================================================================
  // Public API - Event Tracking
  // ==========================================================================

  /**
   * Track when the worker starts processing
   * Call this when worker initializes
   */
  async trackWorkerStart(): Promise<void> {
    this.workerStartTime = Date.now();
    this.workerRegistered = true;
    this.lastActivityTimestamp = Date.now(); // Initialize last activity
  }

  /**
   * Track when a job completes processing
   * Call this after successful job completion
   */
  async trackJobProcessed(event: JobProcessedEvent): Promise<void> {
    this.lastActivityTimestamp = Date.now();
    this.totalJobsProcessed++;

    if (event.success) {
      this.processingTimes.push(event.processingTimeMs);

      // Keep only last 100 processing times to avoid memory issues
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }
    }
  }

  /**
   * Track when a job fails
   * Call this when a job fails permanently
   */
  async trackJobFailed(_event: JobProcessedEvent): Promise<void> {
    this.lastActivityTimestamp = Date.now();
    // Don't track processing time for failed jobs
  }

  // ==========================================================================
  // Lifecycle Management
  // ==========================================================================

  /**
   * Shutdown the health service
   * Clears state and stops monitoring
   */
  async shutdown(): Promise<void> {
    this.isShutDown = true;
    this.processingTimes = [];
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Determine health status based on metrics
   */
  private determineHealthStatus(params: {
    activeJobs: number;
    waitingJobs: number;
    failedJobs: number;
    failureRate: number;
    timeSinceLastActivity: number;
    isWorkerOnline: boolean;
  }): WorkerHealthStatus {
    const { waitingJobs, failureRate, timeSinceLastActivity, isWorkerOnline } = params;

    // Unhealthy conditions (priority 1)
    // An idle worker (no waiting jobs) is healthy, so inactivity is only a problem if jobs are piling up.
    if (
      !isWorkerOnline ||
      failureRate > HEALTH_CONFIG.CRITICAL_FAILURE_RATE ||
      waitingJobs > HEALTH_CONFIG.CRITICAL_QUEUE_BACKLOG ||
      (waitingJobs > 0 && timeSinceLastActivity > HEALTH_CONFIG.MAX_INACTIVITY_MS)
    ) {
      return 'unhealthy';
    }

    // Degraded conditions (priority 2)
    if (
      failureRate > HEALTH_CONFIG.DEGRADED_FAILURE_RATE ||
      waitingJobs > HEALTH_CONFIG.DEGRADED_QUEUE_BACKLOG ||
      (waitingJobs > 0 && timeSinceLastActivity > HEALTH_CONFIG.MAX_DEGRADED_INACTIVITY_MS)
    ) {
      return 'degraded';
    }

    // All checks passed - healthy
    return 'healthy';
  }

  /**
   * Build health result object
   */
  private buildHealthResult(params: {
    status: WorkerHealthStatus;
    isWorkerOnline: boolean;
    reason?: string;
    activeJobs?: number;
    waitingJobs?: number;
    failedJobs?: number;
    completedJobs?: number;
    failureRate?: number;
    timeSinceLastActivity?: number;
    lastActivity?: number;
    workerStartTime?: number;
  }): WorkerHealthResult {
    return {
      status: params.status,
      workerQueueName: this.queueName,
      isWorkerOnline: params.isWorkerOnline,
      activeJobs: params.activeJobs ?? 0,
      waitingJobs: params.waitingJobs ?? 0,
      failedJobs: params.failedJobs ?? 0,
      completedJobs: params.completedJobs ?? 0,
      totalJobsProcessed: this.totalJobsProcessed,
      failureRate: params.failureRate ?? 0,
      lastActivity: params.lastActivity,
      timeSinceLastActivity: params.timeSinceLastActivity ?? 0,
      workerStartTime: params.workerStartTime,
      uptime: params.workerStartTime ? Date.now() - params.workerStartTime : 0,
    };
  }
}
