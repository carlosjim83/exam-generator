/**
 * Document Processing Worker
 *
 * Background worker that processes documents from the queue.
 * Runs independently from the API server.
 *
 * Features:
 * - Processes ONE document at a time (concurrency: 1)
 * - Rate limiting: Max 1 document per 60 seconds (respects external AI service rate limits)
 * - Automatic retry on failure (3 attempts with exponential backoff)
 * - Graceful shutdown on SIGTERM/SIGINT
 */

import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

import { ProcessDocumentUseCase } from '@application/use-cases/documents/ProcessDocumentUseCase.js';
import { prisma } from '@config/prisma.js';
import { GenkitDocumentProcessor } from '@infrastructure/ai/GenkitDocumentProcessor.js';
import { PrismaDocumentRepository } from '@infrastructure/repositories/PrismaDocumentRepository.js';
import { AzureBlobStorageService } from '@infrastructure/storage/AzureBlobStorageService.js';
import { LocalFileStorageService } from '@infrastructure/storage/LocalFileStorageService.js';

import type { DocumentJobData } from './DocumentQueue.js';
import { documentQueue } from './DocumentQueue.js';
import { redisQueue, redisWorker } from './redis.connection.js';
import { WorkerHealthService } from './WorkerHealthService.js';
import { workerLogger } from './WorkerLogger.js';

// Initialize dependencies
const documentRepository = PrismaDocumentRepository.create(prisma);

// Storage Service - Auto-select based on configuration
// Use Azure if configured, otherwise fallback to local filesystem
const azureStorageService = new AzureBlobStorageService();
const storageService = azureStorageService.isConfigured()
  ? azureStorageService
  : new LocalFileStorageService('./uploads');

if (azureStorageService.isConfigured()) {
  console.log('📦 [Worker] Using Azure Blob Storage for file storage');
} else {
  console.log('📁 [Worker] Using Local File Storage for file storage (./uploads)');
}

const documentProcessor = new GenkitDocumentProcessor();
const processDocumentUseCase = new ProcessDocumentUseCase(
  documentRepository,
  storageService,
  documentProcessor
);

// Initialize Worker Health Service for monitoring
export const workerHealthService = new WorkerHealthService({
  workerQueueName: 'document-processing',
  queue: documentQueue,
  redisConnection: redisQueue,
});

/**
 * Timeout wrapper for processing with automatic abort
 * Maximum 10 minutes per document to prevent stuck jobs
 */
async function processWithTimeout(
  documentId: string,
  userId: string,
  timeoutMs: number = 10 * 60 * 1000 // 10 minutes default
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(`Processing timeout: Document ${documentId} exceeded ${timeoutMs / 1000}s limit`)
      );
    }, timeoutMs);

    processDocumentUseCase
      .execute({
        documentId,
        userId,
      })
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Worker instance
 *
 * Concurrency: 1 - Process one document at a time
 * Rate Limiter: 1 job per 60 seconds - Respects external AI service rate limits
 * Timeout: 10 minutes per document - Prevents stuck jobs
 *
 * With this config, even a 100-chunk document should process without hitting rate limits
 * because we're spacing out document processing, not individual chunk processing.
 */
export const documentWorker = new Worker<DocumentJobData>(
  'document-processing',
  async (job: Job<DocumentJobData>) => {
    const { documentId, userId } = job.data;

    workerLogger.jobStarted(job.id!, documentId, job.attemptsMade + 1, job.opts.attempts || 3);

    try {
      const startTime = Date.now();

      // Execute the use case with timeout protection
      const result = await processWithTimeout(documentId, userId);

      const processingTime = Date.now() - startTime;

      // Type assertion for result
      const processedResult = result as {
        document: { chunksCreated: number; wordCount: number; pageCount: number };
      };

      workerLogger.jobCompleted(
        job.id!,
        documentId,
        processingTime,
        processedResult.document.chunksCreated,
        processedResult.document.wordCount,
        processedResult.document.pageCount
      );

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage = err.message;

      // Check if it's a timeout error
      if (errorMessage.includes('Processing timeout')) {
        workerLogger.jobTimeout(job.id!, documentId, 10 * 60 * 1000);
      }
      // Check if it's a rate limit error
      else if (
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('Quota exceeded')
      ) {
        workerLogger.jobRateLimited(job.id!, documentId);
      } else {
        workerLogger.jobFailed(
          job.id!,
          documentId,
          job.attemptsMade + 1,
          job.opts.attempts || 3,
          err
        );
      }

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: redisWorker as any,
    concurrency: 1, // Process ONE document at a time

    // Rate limiter: Maximum 1 job per 60 seconds
    // This ensures we don't hit external AI service rate limits
    limiter: {
      max: 1, // Max 1 job...
      duration: 60 * 1000, // ...per 60 seconds
    },

    // Retry settings (already configured in Queue, but we can override here)
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        // Exponential backoff: 2s, 4s, 8s
        return Math.min(Math.pow(2, attemptsMade) * 1000, 10000);
      },
    },
  }
);

// Event handlers for monitoring
documentWorker.on('completed', (job: Job<DocumentJobData, unknown, string>) => {
  const result = job.returnvalue as
    | { processingTimeMs?: number; document?: { chunksCreated?: number } }
    | undefined;
  const processingTime = result?.processingTimeMs || 0;

  // Track job completion in health service
  workerHealthService.trackJobProcessed({
    documentId: job.data.documentId,
    processingTimeMs: processingTime,
    success: true,
  });

  workerLogger.debug('Job event: completed', {
    event: 'job.event.completed',
    jobId: job.id,
    documentId: job.data.documentId,
    chunks: result?.document?.chunksCreated,
    duration: processingTime,
  });
});

documentWorker.on(
  'failed',
  (job: Job<DocumentJobData, unknown, string> | undefined, error: Error) => {
    if (!job) {
      workerLogger.error('Job failed with no job data', {
        event: 'job.event.failed_no_data',
        errorMessage: error.message,
        errorStack: error.stack,
      });
      return;
    }

    workerLogger.error('Job failed permanently', {
      event: 'job.event.failed_permanent',
      jobId: job.id,
      documentId: job.data.documentId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      errorMessage: error.message,
    });
  }
);

documentWorker.on('active', (job: Job<DocumentJobData>) => {
  const waitTime = Date.now() - job.timestamp;
  workerLogger.debug('Job event: active', {
    event: 'job.event.active',
    jobId: job.id,
    documentId: job.data.documentId,
    waitTimeMs: waitTime,
  });
});

documentWorker.on('error', (error: Error) => {
  workerLogger.workerError(error);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  workerLogger.workerShutdown(signal);

  try {
    await documentWorker.close();
    workerLogger.info('Worker closed successfully', { event: 'worker.closed' });
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    workerLogger.error('Error during shutdown', {
      event: 'worker.shutdown_error',
      errorMessage: err.message,
      errorStack: err.stack,
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Track worker start time for health monitoring
workerHealthService.trackWorkerStart();

workerLogger.workerStarted({
  concurrency: 1,
  rateLimitPerMinute: 1,
  timeoutMs: 10 * 60 * 1000,
});

workerLogger.info('Worker configuration', {
  queue: 'document-processing',
  concurrency: 1,
  rateLimit: '1 document per 60 seconds',
  timeout: '10 minutes per document',
  retryPolicy: '3 attempts with exponential backoff',
});
