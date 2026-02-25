import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * ListDocumentsUseCase
 * Application use case for listing user documents
 *
 * Responsibilities:
 * - Find all documents for a user
 * - Return document list
 */

export interface ListDocumentsInput {
  userId: string;
}

export interface ListDocumentsOutput {
  documents: Array<{
    id: string;
    title: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    status: string;
    pageCount: number | null;
    wordCount: number | null;
    uploadedAt: Date;
    processedAt: Date | null;
  }>;
}

export class ListDocumentsUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  /**
   * Execute list documents
   * @param input - List documents input
   * @returns List of documents
   */
  async execute(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
    // 1. Create UserId value object
    const userId = UserId.create(input.userId);

    // 2. Find all documents for user
    const documents = await this.documentRepository.findByUserId(userId);

    // 3. Return DTO
    return {
      documents: documents.map((doc) => ({
        id: doc.id.value,
        title: doc.title,
        filename: doc.filename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        pageCount: doc.pageCount,
        wordCount: doc.wordCount,
        uploadedAt: doc.uploadedAt,
        processedAt: doc.processedAt,
      })),
    };
  }
}
