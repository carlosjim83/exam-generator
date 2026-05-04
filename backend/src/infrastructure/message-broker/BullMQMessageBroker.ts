import type { IMessageBroker } from '@application/ports/IMessageBroker.js';
import type { DomainEvent } from '@domain/events/DomainEvent.js';
import type { DocumentUploadedEvent } from '@domain/events/DocumentEvents.js';
import { documentQueue } from '@infrastructure/queue/DocumentQueue.js';

/**
 * BullMQMessageBroker
 * Implements IMessageBroker using BullMQ for Redis-backed message queuing.
 * Reuses the centralized documentQueue to avoid duplicate Redis connections.
 */
export class BullMQMessageBroker implements IMessageBroker {
  constructor() {
    // Log errors from the shared queue so they don't become uncaught exceptions
    documentQueue.on('error', (err: Error) => {
      console.error('[BullMQMessageBroker] Queue error:', err.message);
    });
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    // BullMQ uses queues, so we'll map topics to queue names.
    // For now, we only have 'document-processing' queue.
    // We could make this more dynamic if needed.
    switch (topic) {
      case 'document.uploaded':
        await documentQueue.add(
          'process-document' as any,
          (event as DocumentUploadedEvent).payload,
          {
            jobId: `doc-${(event as DocumentUploadedEvent).payload.documentId}`,
          }
        );
        break;
      default:
        console.warn(`Attempted to publish to unknown topic: ${topic}. Event:`, event);
        break;
    }
  }
}
