import type { DocumentUploadedEvent } from '../../../domain/events/DocumentEvents.js';
import { container } from '../../../config/container.js';

/**
 * DocumentUploadedEventHandler
 *
 * Handles the 'document.uploaded' event by queueing
 * background processing job via BullMQ.
 *
 * Flow:
 * 1. Receives DocumentUploadedEvent
 * 2. Adds job to BullMQ queue for worker processing
 * 3. Worker processes document asynchronously (RAG pipeline)
 *
 * This ensures reliable, scalable background processing
 * with automatic retries and failure handling.
 */
export class DocumentUploadedEventHandler {
  async handle(event: DocumentUploadedEvent): Promise<void> {
    console.log(`🔄 Processing document: ${event.payload.documentId}`);

    try {
      // Queue document for background processing via BullMQ
      const messageBroker = container.messageBroker;
      await messageBroker.publish('document.uploaded', event);

      console.log(
        `📋 Document queued for processing: ${event.payload.documentId} (Job: doc-${event.payload.documentId})`
      );
    } catch (error) {
      console.error(`❌ Failed to queue document for processing:`, {
        documentId: event.payload.documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * Factory function to create and register the handler
 * This will be called during application bootstrap
 */
export function createDocumentUploadedEventHandler(): DocumentUploadedEventHandler {
  return new DocumentUploadedEventHandler();
}
