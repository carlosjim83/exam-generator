import { Queue } from 'bullmq';

import type { IMessageBroker } from '@application/ports/IMessageBroker.js';
import { env } from '@config/env.js';
import type { DomainEvent } from '@domain/events/DomainEvent.js';

/**
 * BullMQMessageBroker
 * Implements IMessageBroker using BullMQ for Redis-backed message queuing.
 */
export class BullMQMessageBroker implements IMessageBroker {
  private readonly documentQueue: Queue;

  constructor() {
    this.documentQueue = new Queue('document-processing', {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
    });
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    // BullMQ uses queues, so we'll map topics to queue names.
    // For now, we only have 'document-processing' queue.
    // We could make this more dynamic if needed.
    switch (topic) {
      case 'document.uploaded':
        await this.documentQueue.add('process-document', event);
        break;
      default:
        console.warn(`Attempted to publish to unknown topic: ${topic}. Event:`, event);
        break;
    }
  }
}
