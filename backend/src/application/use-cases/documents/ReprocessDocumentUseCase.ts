import type { IMessageBroker } from '@application/ports/IMessageBroker.js';
import { DocumentStatus } from '@domain/entities/Document.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

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

    // Allow reprocessing for documents that are:
    // - FAILED: errored during processing
    // - COMPLETED: want to re-index
    // - PENDING: stuck in queue without processing
    // - PROCESSING: got stuck during processing (e.g., worker crash, quota error)
    if (document.status === DocumentStatus.PROCESSING) {
      // Check if the document has been processing for too long (stuck)
      // A document stuck in PROCESSING for more than 10 minutes is considered stalled
      // (normal processing takes seconds to a few minutes)
      const processingTimeoutMs = 10 * 60 * 1000; // 10 minutes
      const timeSinceUpdate = Date.now() - new Date(document.updatedAt).getTime();
      const isStuck = timeSinceUpdate > processingTimeoutMs;

      if (!isStuck) {
        const minutesLeft = Math.ceil((processingTimeoutMs - timeSinceUpdate) / 60000);
        throw new Error(
          `Document is currently being processed. Please wait ~${minutesLeft} minute(s) or try again later.`
        );
      }
      // If stuck, allow reprocessing (fall through to reprocess logic)
      console.log(`Document ${documentId.value} is stuck in PROCESSING state, allowing reprocess`);
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
