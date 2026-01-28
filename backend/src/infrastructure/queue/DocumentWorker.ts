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

import { Worker, Job } from 'bullmq';
import { redisConnection } from './redis.connection.js';
import type { DocumentJobData } from './DocumentQueue.js';
import { ProcessDocumentUseCase } from '../../application/use-cases/documents/ProcessDocumentUseCase.js';
import { PrismaDocumentRepository } from '../repositories/PrismaDocumentRepository.js';
import { LocalFileStorageService } from '../storage/LocalFileStorageService.js';
import { prisma } from '../../config/prisma.js';

// Initialize dependencies
const documentRepository = PrismaDocumentRepository.create(prisma);
const storageService = new LocalFileStorageService();
const processDocumentUseCase = new ProcessDocumentUseCase(documentRepository, storageService);

/**
 * Worker instance
 *
 * Concurrency: 1 - Process one document at a time
 * Rate Limiter: 1 job per 60 seconds - Respects external AI service rate limits
 *
 * With this config, even a 100-chunk document should process without hitting rate limits
 * because we're spacing out document processing, not individual chunk processing.
 */
export const documentWorker = new Worker<DocumentJobData>(
  'document-processing',
  async (job: Job<DocumentJobData>) => {
    const { documentId, userId } = job.data;

    console.log(`[Worker] 🚀 Processing document: ${documentId} (Job: ${job.id})`);
    console.log(`[Worker] 📊 Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

    try {
      // Execute the use case
      const result = await processDocumentUseCase.execute({
        documentId,
        userId,
      });

      console.log(
        `[Worker] ✅ Document processed successfully: ${documentId}`,
        `\n  - Chunks created: ${result.document.chunksCreated}`,
        `\n  - Processing time: ${result.processingTimeMs}ms`,
        `\n  - Word count: ${result.document.wordCount}`,
        `\n  - Page count: ${result.document.pageCount}`
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(
        `[Worker] ❌ Document processing failed: ${documentId}`,
        `\n  - Error: ${errorMessage}`,
        `\n  - Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`
      );

      // Check if it's a rate limit error
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('Quota exceeded')) {
        console.warn(
          `[Worker] ⚠️  Rate limit hit for ${documentId}. Job will retry automatically.`
        );
      }

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  },
  {
    connection: redisConnection,
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
documentWorker.on('completed', (job: Job<DocumentJobData, any, string>) => {
  const result = job.returnvalue;
  console.log(
    `[Worker] 🎉 Job completed: ${job.id}`,
    `\n  - Document: ${job.data.documentId}`,
    `\n  - Chunks: ${result?.document?.chunksCreated || 'unknown'}`,
    `\n  - Duration: ${result?.processingTimeMs || 'unknown'}ms`
  );
});

documentWorker.on('failed', (job: Job<DocumentJobData, any, string> | undefined, error: Error) => {
  if (!job) {
    console.error('[Worker] 💥 Job failed with no job data:', error);
    return;
  }

  console.error(
    `[Worker] 💥 Job failed permanently: ${job.id}`,
    `\n  - Document: ${job.data.documentId}`,
    `\n  - Attempts: ${job.attemptsMade}/${job.opts.attempts}`,
    `\n  - Error: ${error.message}`
  );
});

documentWorker.on('active', (job: Job<DocumentJobData>) => {
  console.log(
    `[Worker] ⚡ Job started: ${job.id}`,
    `\n  - Document: ${job.data.documentId}`,
    `\n  - Waiting time: ${Date.now() - job.timestamp}ms`
  );
});

documentWorker.on('error', (error: Error) => {
  console.error('[Worker] 🔥 Worker error:', error);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Worker] 🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    await documentWorker.close();
    console.log('[Worker] ✅ Worker closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[Worker] ❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

console.log('[Worker] 🚀 Document processing worker started');
console.log('[Worker] 📋 Queue: document-processing');
console.log('[Worker] ⚙️  Concurrency: 1 document at a time');
console.log('[Worker] ⏱️  Rate limit: 1 document per 60 seconds');
console.log('[Worker] 🔄 Retry policy: 3 attempts with exponential backoff');
console.log('[Worker] 🎯 Ready to process documents...\n');
