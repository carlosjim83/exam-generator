/**
 * Domain Events
 *
 * Events represent things that have happened in the domain.
 * They are immutable facts about state changes.
 */

export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  aggregateId: string;
}

/**
 * DocumentUploadedEvent
 *
 * Emitted when a document has been successfully uploaded to storage
 * and a database record has been created.
 *
 * This triggers background processing (text extraction, chunking, embeddings).
 */
export interface DocumentUploadedEvent extends DomainEvent {
  eventName: 'document.uploaded';
  aggregateId: string; // documentId
  payload: {
    documentId: string;
    userId: string;
    filename: string;
    mimeType: string;
    blobUrl: string;
  };
}

/**
 * DocumentProcessedEvent
 *
 * Emitted when document processing is completed successfully
 * (text extracted, chunks created, embeddings stored).
 */
export interface DocumentProcessedEvent extends DomainEvent {
  eventName: 'document.processed';
  aggregateId: string; // documentId
  payload: {
    documentId: string;
    chunksCreated: number;
    wordCount: number;
    pageCount: number;
  };
}

/**
 * DocumentProcessingFailedEvent
 *
 * Emitted when document processing fails.
 */
export interface DocumentProcessingFailedEvent extends DomainEvent {
  eventName: 'document.processing.failed';
  aggregateId: string; // documentId
  payload: {
    documentId: string;
    error: string;
  };
}

/**
 * DocumentDeletedEvent
 *
 * Emitted when a document is deleted.
 * Triggers cleanup of related entities (chunks, class documents, blob storage).
 */
export interface DocumentDeletedEvent extends DomainEvent {
  eventName: 'document.deleted';
  aggregateId: string; // documentId
  payload: {
    documentId: string;
    userId: string;
    filename: string;
    blobUrl: string;
  };
}

/**
 * ClassDeletedEvent
 *
 * Emitted when a class is deleted.
 * Triggers cleanup of related entities (enrollments, invitations, class documents).
 */
export interface ClassDeletedEvent extends DomainEvent {
  eventName: 'class.deleted';
  aggregateId: string; // classId
  payload: {
    classId: string;
    teacherId: string;
    className: string;
  };
}
