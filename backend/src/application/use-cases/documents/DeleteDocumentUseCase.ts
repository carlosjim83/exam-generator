import type { DocumentDeletedEvent } from '@domain/events/DocumentEvents.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { eventBus } from '@infrastructure/events/EventBus.js';

interface DeleteDocumentInput {
  documentId: string;
  userId: string;
}

interface DeleteDocumentOutput {
  message: string;
}

export class DeleteDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(input: DeleteDocumentInput): Promise<DeleteDocumentOutput> {
    // Validate UUIDs
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // Get document to check ownership and get metadata for event
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Check ownership
    if (document.userId.value !== userId.value) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Store metadata before deletion for the event
    const documentMetadata = {
      documentId: document.id.value,
      userId: document.userId.value,
      filename: document.filename,
      blobUrl: document.blobUrl,
    };

    // Delete document (will cascade delete chunks due to Prisma schema)
    await this.documentRepository.delete(documentId);

    // Emit domain event for cleanup of related entities
    const event: DocumentDeletedEvent = {
      eventName: 'document.deleted',
      aggregateId: documentMetadata.documentId,
      occurredAt: new Date(),
      payload: documentMetadata,
    };
    eventBus.publish(event);

    return {
      message: 'Document deleted successfully',
    };
  }
}
