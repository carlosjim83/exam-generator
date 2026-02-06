import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentStatus } from '@domain/entities/Document.js';
import { IMessageBroker } from '@application/ports/IMessageBroker.js';

export interface ReprocessDocumentInput {
  documentId: string;
  userId: string;
}

export interface ReprocessDocumentOutput {
  id: string;
  status: DocumentStatus;
  message: string;
}

export class ReprocessDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(input: ReprocessDocumentInput): Promise<ReprocessDocumentOutput> {
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.isOwnedBy(userId)) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Only allow reprocessing for documents that are FAILED or COMPLETED (if re-indexing is needed)
    if (document.status !== DocumentStatus.FAILED && document.status !== DocumentStatus.COMPLETED) {
      throw new Error(
        `Document cannot be reprocessed. Current status: ${document.status}. Must be FAILED or COMPLETED.`
      );
    }

    // Update document status to PENDING
    document.updateStatus(DocumentStatus.PENDING);
    document.clearErrorMessage(); // Clear any previous error message
    document.clearProcessingMetadata(); // Clear pageCount, wordCount, processedAt for a fresh start

    await this.documentRepository.updateStatus(documentId, {
      status: document.status,
      errorMessage: document.errorMessage,
      pageCount: document.pageCount,
      wordCount: document.wordCount,
      processedAt: document.processedAt,
    });

    // Remove existing chunks to ensure a clean re-embedding
    await this.documentRepository.deleteChunksByDocumentId(documentId);

    // Re-publish the event for the worker to pick up and re-process
    // We use 'document.uploaded' event as it triggers the processing flow
    await this.messageBroker.publish('document.uploaded', {
      aggregateId: documentId.value,
      occurredAt: new Date(),
    });

    return {
      id: document.id.value,
      status: document.status,
      message: 'Document re-processing initiated successfully.',
    };
  }
}
