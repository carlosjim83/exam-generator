/**
 * Structured Logger for Worker
 *
 * Provides JSON-formatted logging for better observability and integration
 * with log aggregation tools (e.g., CloudWatch, Datadog, Splunk).
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  documentId?: string;
  userId?: string;
  jobId?: string;
  attemptsMade?: number;
  maxAttempts?: number;
  processingTimeMs?: number;
  chunksCreated?: number;
  wordCount?: number;
  pageCount?: number;
  errorMessage?: string;
  errorStack?: string;
  waitTimeMs?: number;
  [key: string]: any;
}

export class WorkerLogger {
  private serviceName: string;
  private environment: string;

  constructor(
    serviceName = 'document-worker',
    environment = process.env.NODE_ENV || 'development'
  ) {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    };

    // In development, pretty-print. In production, single-line JSON.
    if (this.environment === 'development') {
      const emoji = this.getEmoji(level);
      console.log(`${emoji} ${message}`, context ? JSON.stringify(context, null, 2) : '');
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  // Specialized methods for common worker events
  jobStarted(jobId: string, documentId: string, attemptsMade: number, maxAttempts: number) {
    this.info('Job started', {
      event: 'job.started',
      jobId,
      documentId,
      attemptsMade,
      maxAttempts,
    });
  }

  jobCompleted(
    jobId: string,
    documentId: string,
    processingTimeMs: number,
    chunksCreated?: number,
    wordCount?: number,
    pageCount?: number
  ) {
    this.info('Job completed successfully', {
      event: 'job.completed',
      jobId,
      documentId,
      processingTimeMs,
      chunksCreated,
      wordCount,
      pageCount,
    });
  }

  jobFailed(
    jobId: string,
    documentId: string,
    attemptsMade: number,
    maxAttempts: number,
    error: Error
  ) {
    this.error('Job failed', {
      event: 'job.failed',
      jobId,
      documentId,
      attemptsMade,
      maxAttempts,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }

  jobTimeout(jobId: string, documentId: string, timeoutMs: number) {
    this.error('Job timeout', {
      event: 'job.timeout',
      jobId,
      documentId,
      timeoutMs,
    });
  }

  jobRateLimited(jobId: string, documentId: string) {
    this.warn('Job hit rate limit', {
      event: 'job.rate_limited',
      jobId,
      documentId,
    });
  }

  workerStarted(config: { concurrency: number; rateLimitPerMinute: number; timeoutMs: number }) {
    this.info('Worker started', {
      event: 'worker.started',
      ...config,
    });
  }

  workerShutdown(signal: string) {
    this.info('Worker shutting down', {
      event: 'worker.shutdown',
      signal,
    });
  }

  workerError(error: Error) {
    this.error('Worker error', {
      event: 'worker.error',
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }
}

// Export singleton instance
export const workerLogger = new WorkerLogger();
