import { Document, DocumentStatus } from '../entities/Document.js';
import { DocumentId } from '../value-objects/DocumentId.js';
import { UserId } from '../value-objects/UserId.js';

/**
 * CreateDocumentDTO
 * Data Transfer Object for creating a document
 */
export interface CreateDocumentDTO {
  userId: UserId;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
}

/**
 * UpdateDocumentStatusDTO
 * Data Transfer Object for updating document status
 */
export interface UpdateDocumentStatusDTO {
  status: DocumentStatus;
  pageCount?: number | null;
  wordCount?: number | null;
  errorMessage?: string | null;
}

/**
 * UpdateDocumentMetadataDTO
 * Data Transfer Object for updating document metadata after processing
 */
export interface UpdateDocumentMetadataDTO {
  pageCount: number;
  wordCount: number;
  processedAt?: Date;
}

export interface QueryDocumentResult {
  chunkIndex: number;
  content: string;
  similarity: number; // Cosine similarity score (0-1)
  wordCount: number;
  pageNumber?: number | null;
}

/**
 * IDocumentRepository Interface (Port)
 * Defines operations for Document persistence
 * Implementation is in infrastructure layer
 */
export interface IDocumentRepository {
  /**
   * Find a document by ID
   */
  findById(id: DocumentId): Promise<Document | null>;

  /**
   * Find all documents for a specific user
   */
  findByUserId(userId: UserId): Promise<Document[]>;

  /**
   * Create a new document
   */
  create(data: CreateDocumentDTO): Promise<Document>;

  /**
   * Update document status and metadata
   */
  updateStatus(id: DocumentId, data: UpdateDocumentStatusDTO): Promise<Document>;

  /**
   * Update document metadata after processing
   * Sets pageCount, wordCount, and processedAt timestamp
   */
  updateMetadata(id: DocumentId, data: UpdateDocumentMetadataDTO): Promise<Document>;

  /**
   * Delete a document
   */
  delete(id: DocumentId): Promise<void>;

  /**
   * Delete all chunks associated with a document
   */
  deleteChunksByDocumentId(documentId: DocumentId): Promise<void>;

  /**
   * Check if a document exists
   */
  exists(id: DocumentId): Promise<boolean>;

  /**
   * Count total documents for a user
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * Find the most recently updated document for a user
   */
  findMostRecentByUserId(userId: UserId): Promise<Document | null>;

  /**
   * Search for similar chunks within a document using a query embedding.
   */
  searchSimilarChunks(
    documentId: DocumentId,
    queryEmbedding: number[],
    topK: number
  ): Promise<QueryDocumentResult[]>;
}
