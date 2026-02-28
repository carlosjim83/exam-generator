import type { DocumentDeletedEvent } from '@domain/events/DocumentEvents.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * DocumentDeletedEventHandler
 *
 * Handles the 'document.deleted' event by cleaning up all related data:
 * - Deletes document chunks from database
 * - Deletes class-document relationships
 * - Deletes the blob from storage
 *
 * This replaces database-level cascade deletes with explicit domain-controlled cleanup,
 * providing better control, auditability, and extensibility.
 */
export class DocumentDeletedEventHandler {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly storageService: IStorageService
  ) {}

  async handle(event: DocumentDeletedEvent): Promise<void> {
    const { documentId, filename, blobUrl } = event.payload;

    console.log(`🗑️ Handling document.deleted event for document: ${documentId}`);

    try {
      const docId = DocumentId.create(documentId);

      // 1. Delete document chunks (embeddings, text content)
      console.log(`  📄 Deleting chunks for document: ${documentId}`);
      await this.documentRepository.deleteChunksByDocumentId(docId);

      // 2. Delete all class-document relationships (unshare from all classes)
      console.log(`  📚 Deleting class-document relationships for document: ${documentId}`);
      await this.classDocumentRepository.deleteByDocumentId(docId);

      // 3. Delete the blob from storage
      console.log(`  📦 Deleting blob for document: ${documentId} (${filename})`);
      await this.storageService.delete(blobUrl);

      console.log(`✅ Document cleanup completed: ${documentId}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup document ${documentId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename,
      });
      // In production, you'd want to:
      // - Log to monitoring service (Sentry, etc.)
      // - Retry the event
      // - Send to dead letter queue
      throw error;
    }
  }
}

/**
 * Factory function to create the handler with dependencies
 */
export function createDocumentDeletedEventHandler(
  documentRepository: IDocumentRepository,
  classDocumentRepository: IClassDocumentRepository,
  storageService: IStorageService
): DocumentDeletedEventHandler {
  return new DocumentDeletedEventHandler(
    documentRepository,
    classDocumentRepository,
    storageService
  );
}
