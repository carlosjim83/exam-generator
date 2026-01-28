import type { DocumentUploadedEvent } from '../../../domain/events/DocumentEvents.js';
import { ProcessDocumentUseCase } from '../../../application/use-cases/documents/ProcessDocumentUseCase.js';
import { container } from '../../../config/container.js';

/**
 * DocumentUploadedEventHandler
 *
 * Handles the 'document.uploaded' event by triggering
 * background processing with RAG pipeline.
 *
 * Flow:
 * 1. Receives DocumentUploadedEvent
 * 2. Calls ProcessDocumentUseCase (Genkit + embeddings)
 * 3. Logs success/failure
 *
 * This runs asynchronously in the background, so the upload
 * endpoint can return immediately.
 */
export class DocumentUploadedEventHandler {
  constructor(private readonly processDocumentUseCase: ProcessDocumentUseCase) {}

  async handle(event: DocumentUploadedEvent): Promise<void> {
    console.log(`🔄 Processing document: ${event.payload.documentId}`);

    try {
      const result = await this.processDocumentUseCase.execute({
        documentId: event.payload.documentId,
        userId: event.payload.userId,
      });

      console.log(`✅ Document processed successfully:`, {
        documentId: result.document.id,
        chunksCreated: result.document.chunksCreated,
        wordCount: result.document.wordCount,
        processingTimeMs: result.processingTimeMs,
      });

      // TODO: Optionally emit DocumentProcessedEvent here
    } catch (error) {
      console.error(`❌ Document processing failed:`, {
        documentId: event.payload.documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // TODO: Optionally emit DocumentProcessingFailedEvent here
    }
  }
}

/**
 * Factory function to create and register the handler
 * This will be called during application bootstrap
 */
export function createDocumentUploadedEventHandler(): DocumentUploadedEventHandler {
  // Use the ProcessDocumentUseCase from the container
  const processDocumentUseCase = container.processDocumentUseCase;

  return new DocumentUploadedEventHandler(processDocumentUseCase);
}
