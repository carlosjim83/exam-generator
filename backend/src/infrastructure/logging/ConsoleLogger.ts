import type { ILogger } from '@domain/services/ILogger.js';

/**
 * ConsoleLogger
 * Simple ILogger implementation backed by console.
 * Suitable for development; replace with Pino/Winston in production.
 */
export class ConsoleLogger implements ILogger {
  private readonly prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(this.prefix + message, meta ? JSON.stringify(meta) : '');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.prefix + message, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.prefix + message, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.prefix + message, meta ? JSON.stringify(meta) : '');
  }
}
