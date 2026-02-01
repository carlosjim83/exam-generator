/**
 * ApiMonitoringService
 *
 * Handles all monitoring and worker health-related API operations.
 */

'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface WorkerMetrics {
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    failureRate: number;
    isProcessing: boolean;
    hasFailures: boolean;
  };
  performance: {
    avgProcessingTime: number;
    avgWaitTime: number;
    throughput: {
      last1Hour: number;
      last24Hours: number;
    };
  };
  recentJobs: {
    completed: Array<{
      jobId: string;
      documentId: string;
      completedAt: string;
      processingTime: number;
      attemptsMade: number;
    }>;
    failed: Array<{
      jobId: string;
      documentId: string;
      failedAt: string;
      reason: string;
      attemptsMade: number;
    }>;
  };
  timestamp: string;
}

export interface JobMetrics {
  jobId: string;
  documentId: string;
  state: string;
  progress: number;
  attemptsMade: number;
  maxAttempts: number;
  createdAt: string;
  processedAt: string | null;
  finishedAt: string | null;
  waitTime: number | null;
  processingTime: number | null;
  failedReason: string | null;
}

/**
 * Get comprehensive worker metrics
 */
export async function getWorkerMetrics(): Promise<WorkerMetrics> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/health/worker`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch worker metrics');
  }

  return response.json();
}

/**
 * Get detailed job metrics for a specific document
 */
export async function getJobMetrics(
  documentId: string
): Promise<{ found: boolean; job: JobMetrics | null }> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/health/worker/job/${documentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch job metrics');
  }

  return response.json();
}

/**
 * Get basic health check
 */
export async function getHealthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch health check');
  }

  return response.json();
}
