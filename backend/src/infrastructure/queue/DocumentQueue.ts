/**
 * Document Processing Queue
 *
 * Manages the queue for document processing jobs.
 * Documents are added to this queue after upload and processed by DocumentWorker.
 */

import { Queue } from 'bullmq';

import { redisQueue } from './redis.connection.js';

export interface DocumentJobData {
  documentId: string;
  userId: string;
}

/**
 * Queue for document processing jobs
 *
 * Configuration:
 * - Retry failed jobs up to 3 times with exponential backoff
 * - Keep last 100 completed jobs for inspection
 * - Keep last 500 failed jobs for debugging
 */
export const documentQueue = new Queue<DocumentJobData>('document-processing', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: redisQueue as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
});

/**
 * Add a document to the processing queue
 *
 * @param data - Document job data
 * @returns Job ID
 */
export async function queueDocumentProcessing(data: DocumentJobData): Promise<string> {
  const job = await documentQueue.add('process-document' as any, data, {
    jobId: `doc-${data.documentId}`, // Unique job ID prevents duplicates
  });

  console.log(`📋 Document queued for processing: ${data.documentId} (Job: ${job.id})`);

  return job.id!;
}

/**
 * Get queue metrics for monitoring
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    documentQueue.getWaitingCount(),
    documentQueue.getActiveCount(),
    documentQueue.getCompletedCount(),
    documentQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

/**
 * Retry a failed job by document ID
 *
 * @param documentId - Document UUID
 * @returns Job ID if found and retried, null if not found
 */
export async function retryFailedJob(documentId: string): Promise<string | null> {
  const jobId = `doc-${documentId}`;

  // Try to get the job
  const job = await documentQueue.getJob(jobId);

  if (!job) {
    console.log(`📋 No job found for document: ${documentId}`);
    return null;
  }

  // Check if job is in a failed state
  const state = await job.getState();

  if (state === 'failed') {
    // Retry the job
    await job.retry();
    console.log(`🔄 Retrying failed job for document: ${documentId} (Job: ${jobId})`);
    return jobId;
  }

  console.log(`📋 Job ${jobId} is in state: ${state}, cannot retry`);
  return null;
}

/**
 * Get job status for a document
 *
 * @param documentId - Document UUID
 * @returns Job state and details if found
 */
export async function getJobStatus(documentId: string) {
  const jobId = `doc-${documentId}`;
  const job = await documentQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    jobId: job.id,
    state,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
}

/**
 * Clean old completed and failed jobs
 */
export async function cleanQueue() {
  await documentQueue.clean(24 * 3600 * 1000, 100, 'completed');
  await documentQueue.clean(7 * 24 * 3600 * 1000, 500, 'failed');
  console.log('🧹 Queue cleaned');
}
