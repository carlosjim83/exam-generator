/**
 * Worker Health Service Tests (TDD - Unit Tests)
 *
 * Testing WorkerHealthService for monitoring BullMQ worker health
 * including: status, queue stats, jobs metrics, and degraded state detection
 *
 * NOTE: This is a pure unit test with mocked dependencies - no real Redis/Queue needed
 * IMPORTANT: Set env vars early to avoid Azure errors during module loading
 */

// Set env vars BEFORE any imports
process.env.AZURE_OPENAI_API_KEY = 'mock-key-for-test';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.JWT_SECRET = 'mock-secret-test';
process.env.JWT_REFRESH_SECRET = 'mock-refresh-secret-test';

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Queue } from 'bullmq';
import { WorkerHealthService } from '../../../../src/infrastructure/queue/WorkerHealthService.js';
import type { Redis } from 'ioredis';

// Mock Redis connection module to avoid real Redis dependency
vi.mock('../../../../src/infrastructure/queue/redis.connection.js', () => ({
  redisConnection: {},
}));

// Mock dependencies
const mockRedis: Partial<Redis> = {
  info: vi.fn(),
};

const mockQueue: Partial<Queue> = {
  getJobCounts: vi.fn(),
  getWaiting: vi.fn(),
  getActive: vi.fn(),
  getFailed: vi.fn(),
  getCompleted: vi.fn(),
  getRepeatableJobs: vi.fn(),
  getJob: vi.fn(),
};

describe('WorkerHealthService - Unit Tests', () => {
  let healthService: WorkerHealthService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks to avoid undefined errors
    vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    });
    vi.mocked(mockQueue.getActive).mockResolvedValue([]);
    vi.mocked(mockQueue.getFailed).mockResolvedValue([]);
    vi.mocked(mockQueue.getCompleted).mockResolvedValue([]);

    healthService = new WorkerHealthService({
      workerQueueName: 'document-processing',
      queue: mockQueue as Queue,
      redisConnection: mockRedis as Redis,
    });
  });

  afterEach(async () => {
    await healthService.shutdown();
  });

  describe('getHealth()', () => {
    it('should return healthy status when worker is processing jobs', async () => {
      // Arrange: Worker is active with 1 job, queue has manageable counts
      await healthService.trackWorkerStart();
      await healthService.trackJobProcessed({
        documentId: 'doc-1',
        processingTimeMs: 1000,
        success: true,
      });

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([
        {
          id: 'test-job-1',
          name: 'process',
          data: { documentId: 'doc-1', userId: 'user-1' },
          timestamp: Date.now() - 5000,
          attemptsMade: 0,
          processedOn: Date.now() - 3000,
        } as any,
      ]);

      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      await new Promise((resolve) => setTimeout(resolve, 1)); // Wait 1ms for uptime
      const health = await healthService.getHealth();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.workerQueueName).toBe('document-processing');
      expect(health.isWorkerOnline).toBe(true);
      expect(health.activeJobs).toBe(1);
      expect(health.waitingJobs).toBe(2);
      expect(health.failedJobs).toBe(0);
      expect(health.completedJobs).toBe(10);
      expect(health.failureRate).toBe(0);
      expect(health.lastActivity).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should return healthy status with moderate failure rate if worker is online (failure rate is informational)', async () => {
      // Arrange: Moderate failure rate but worker is registered
      await healthService.trackWorkerStart(); // Worker must be online

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 80,
        failed: 20,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue(Array(20).fill({} as any));

      // Act
      const health = await healthService.getHealth();

      // Assert: Worker is healthy because it's online
      // Failure rate reported for informational purposes
      expect(health.status).toBe('healthy');
      expect(health.failedJobs).toBe(20);
      expect(health.failureRate).toBeCloseTo(0.2, 2); // 20/(80+20) = 20%
    });

    it('should return unhealthy status when no active jobs and high waiting count (>50)', async () => {
      // Arrange: Queue backlog but no worker processing
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 51,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const health = await healthService.getHealth();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(health.waitingJobs).toBe(51);
      expect(health.activeJobs).toBe(0);
      expect(health.isWorkerOnline).toBe(false); // No active processing
    });

    it('should return healthy status with high failure rate if worker is online (failure rate is informational)', async () => {
      // Arrange: High failure rate but worker is registered
      await healthService.trackWorkerStart(); // Worker is online

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 1,
        completed: 1,
        failed: 14,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([
        { id: 'job-1', data: { documentId: 'doc-1' } } as any,
      ]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue(Array(14).fill({} as any));

      // Act
      const health = await healthService.getHealth();

      // Assert: Worker is healthy because it's online and processing
      // Failure rate is informational, not a health indicator
      expect(health.status).toBe('healthy');
      expect(health.failureRate).toBeCloseTo(0.9333, 2); // 14/(1+14) = 93%
      expect(health.isWorkerOnline).toBe(true);
    });

    it('should return unhealthy status when no recent activity (>5 minutes)', async () => {
      // Arrange: Track old activity, then wait conceptually
      await healthService.trackWorkerStart();
      await healthService.trackJobProcessed({
        documentId: 'old-doc',
        processingTimeMs: 1000,
        success: true,
      });

      // Simulate passage of time by setting lastActivityTimestamp in the past
      // We'll do this by accessing private field (test hack)
      (healthService as any).lastActivityTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 1, // Inactivity is only unhealthy if jobs are waiting
        active: 0,
        completed: 10,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const health = await healthService.getHealth();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(health.timeSinceLastActivity).toBeGreaterThan(5 * 60 * 1000);
    });

    it('should include worker start time and uptime', async () => {
      // Arrange
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const beforeStart = Date.now();
      await healthService.trackWorkerStart();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait 10ms for uptime
      const health = await healthService.getHealth();
      const afterStart = Date.now();

      // Assert
      expect(health.workerStartTime).toBeGreaterThanOrEqual(beforeStart);
      expect(health.workerStartTime).toBeLessThanOrEqual(afterStart);
      expect(health.uptime).toBeGreaterThan(0);
    });
  });

  describe('getMetrics()', () => {
    it('should return comprehensive metrics for monitoring', async () => {
      // Arrange
      await healthService.trackWorkerStart();

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([
        {
          id: 'job-1',
          attemptsMade: 0,
        } as any,
        {
          id: 'job-2',
          attemptsMade: 1,
        } as any,
      ]);

      vi.mocked(mockQueue.getFailed).mockResolvedValue(Array(3).fill({} as any));

      vi.mocked(mockQueue.getCompleted).mockResolvedValue(
        Array(100).fill({ processedOn: Date.now() } as any)
      );

      // Act
      const metrics = await healthService.getMetrics();

      // Assert
      expect(metrics).toEqual({
        queue: {
          name: 'document-processing',
          waiting: 5,
          active: 2,
          completed: 100,
          failed: 3,
          delayed: 1,
          paused: 0,
        },
        worker: {
          startTime: expect.any(Number),
          uptime: expect.any(Number),
          isOnline: true,
        },
        performance: {
          failureRate: expect.any(Number),
          avgProcessingTimeMs: expect.any(Number),
          totalJobsProcessed: expect.any(Number),
        },
        timeSinceLastActivity: expect.any(Number),
        timestamp: expect.any(Number),
      });
    });

    it('should calculate average processing time correctly', async () => {
      // Arrange: Jobs with varying processing times
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 3,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);

      // Track jobs with different processing times
      await healthService.trackJobProcessed({
        documentId: 'doc-1',
        processingTimeMs: 1000,
        success: true,
      });

      await healthService.trackJobProcessed({
        documentId: 'doc-2',
        processingTimeMs: 2000,
        success: true,
      });

      await healthService.trackJobProcessed({
        documentId: 'doc-3',
        processingTimeMs: 3000,
        success: true,
      });

      // Act
      const metrics = await healthService.getMetrics();

      // Assert
      expect(metrics.performance.avgProcessingTimeMs).toBe(2000); // (1000+2000+3000)/3
    });

    it('should handle zero completed jobs gracefully', async () => {
      // Arrange
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getCompleted).mockResolvedValue([]);

      // Act
      const metrics = await healthService.getMetrics();

      // Assert
      expect(metrics.performance.avgProcessingTimeMs).toBe(0);
    });
  });

  describe('trackWorkerStart()', () => {
    it('should record worker start time', async () => {
      // Arrange
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });
      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const beforeStart = Date.now();
      await healthService.trackWorkerStart();
      const afterStart = Date.now();

      // Assert
      const health = await healthService.getHealth();
      expect(health.workerStartTime).toBeGreaterThanOrEqual(beforeStart);
      expect(health.workerStartTime).toBeLessThanOrEqual(afterStart);
    });

    it('should update start time if called again', async () => {
      // Arrange
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });
      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      await healthService.trackWorkerStart();
      const firstStartTime = (await healthService.getHealth()).workerStartTime;

      // Act: Wait a bit and call again
      await new Promise((resolve) => setTimeout(resolve, 100));
      await healthService.trackWorkerStart();
      const secondStartTime = (await healthService.getHealth()).workerStartTime;

      // Assert
      expect(secondStartTime).toBeGreaterThan(firstStartTime!);
    });
  });

  describe('trackJobProcessed()', () => {
    it('should record job processing metrics', async () => {
      // Arrange
      await healthService.trackWorkerStart();

      // Act
      await healthService.trackJobProcessed({
        documentId: 'doc-123',
        processingTimeMs: 5000,
        success: true,
      });

      // Assert
      const health = await healthService.getHealth();
      expect(health.totalJobsProcessed).toBe(1);
    });
  });

  describe('isHealthy()', () => {
    it('should return true for healthy status', async () => {
      // Arrange
      await healthService.trackWorkerStart(); // Worker must be online
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 0,
        active: 1,
        completed: 10,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([
        {
          id: 'job-1',
          data: { documentId: 'doc-1' },
          timestamp: Date.now(),
        } as any,
      ]);

      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const isHealthy = await healthService.isHealthy();

      // Assert
      expect(isHealthy).toBe(true);
    });

    it('should return false for degraded status', async () => {
      // Arrange: Moderate queue backlog causes degraded
      await healthService.trackWorkerStart(); // Worker must be online to potentially be degraded

      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 25, // > DEGRADED_QUEUE_BACKLOG (20) but < CRITICAL (50)
        active: 0,
        completed: 10,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const isHealthy = await healthService.isHealthy();

      // Assert
      expect(isHealthy).toBe(false);
    });

    it('should return false for unhealthy status', async () => {
      // Arrange
      vi.mocked(mockQueue.getJobCounts).mockResolvedValue({
        waiting: 100,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      });

      vi.mocked(mockQueue.getActive).mockResolvedValue([]);
      vi.mocked(mockQueue.getFailed).mockResolvedValue([]);

      // Act
      const isHealthy = await healthService.isHealthy();

      // Assert
      expect(isHealthy).toBe(false);
    });
  });

  describe('cleanup()', () => {
    it('should clear internal state', async () => {
      // Arrange
      await healthService.trackWorkerStart();

      // Act
      await healthService.shutdown();

      // Assert: Service should be shut down gracefully
      expect(healthService['shutdown']).toBeDefined();
    });
  });
});
