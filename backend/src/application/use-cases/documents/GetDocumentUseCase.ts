import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';

/**
 * GetDocumentUseCase
 * Application use case for retrieving a single document
 * 
 * Responsibilities:
 * - Find document by ID
 * - Verify ownership
 * - Return document details
 */

export interface GetDocumentInput {
  documentId: string;
  userId: string;
}

export interface GetDocumentOutput {
  document: {
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
  };
}

export class GetDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  /**
   * Execute get document
   * @param input - Get document input
   * @returns Document details
   * @throws Error if document not found or access denied
   */
  async execute(input: GetDocumentInput): Promise<GetDocumentOutput> {
    // 1. Create value objects
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // 2. Find document
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // 3. Verify ownership
    if (!document.belongsToUser(userId)) {
      throw new Error('Access denied');
    }

    // 4. Return DTO
    return {
      document: {
        id: document.id.value,
        title: document.title,
        filename: document.filename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        status: document.status,
        pageCount: document.pageCount,
        wordCount: document.wordCount,
        uploadedAt: document.uploadedAt,
        processedAt: document.processedAt,
      },
    };
  }
}
