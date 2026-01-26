import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';
import { IDocumentProcessor } from '../../../domain/services/IDocumentProcessor.js';
import { IStorageService } from '../../../domain/services/IStorageService.js';
import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { DocumentStatus } from '../../../domain/entities/Document.js';
import { UserId } from '../../../domain/value-objects/UserId.js';

/**
 * ProcessDocumentUseCase Input
 */
export interface ProcessDocumentInput {
  documentId: string;
  userId: string; // For authorization check
}

/**
 * ProcessDocumentUseCase Output
 */
export interface ProcessDocumentOutput {
  document: {
    id: string;
    title: string;
    status: DocumentStatus;
    pageCount: number | null;
    wordCount: number | null;
    processedAt: Date | null;
  };
  processingTimeMs: number;
}

/**
 * ProcessDocumentUseCase
 * 
 * Orchestrates document processing:
 * 1. Validates document exists and user owns it
 * 2. Updates status to PROCESSING
 * 3. Downloads file from storage
 * 4. Extracts text and calculates metadata
 * 5. Updates document with metadata and COMPLETED status
 * 6. Handles errors and sets FAILED status
 * 
 * @example
 * ```typescript
 * const result = await useCase.execute({
 *   documentId: 'uuid',
 *   userId: 'uuid'
 * });
 * ```
 */
export class ProcessDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly documentProcessor: IDocumentProcessor,
    private readonly storageService: IStorageService
  ) {}

  async execute(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
    const startTime = Date.now();

    try {
      // 1. Validate input
      const documentId = DocumentId.create(input.documentId);
      const userId = UserId.create(input.userId);

      // 2. Find document and verify ownership
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.userId.value !== userId.value) {
        throw new Error('Unauthorized: Document does not belong to user');
      }

      // 3. Check if already processed
      if (document.isCompleted()) {
        return {
          document: {
            id: document.id.value,
            title: document.title,
            status: document.status,
            pageCount: document.pageCount,
            wordCount: document.wordCount,
            processedAt: document.processedAt,
          },
          processingTimeMs: Date.now() - startTime,
        };
      }

      // 4. Update status to PROCESSING
      await this.documentRepository.updateStatus(documentId, {
        status: DocumentStatus.PROCESSING,
      });

      // 5. Download file from storage
      const fileBuffer = await this.storageService.download(document.blobUrl);

      // 6. Process document (extract text + metadata)
      const result = await this.documentProcessor.process(document, fileBuffer);

      // 7. Update document with metadata and COMPLETED status
      const updatedDocument = await this.documentRepository.updateStatus(documentId, {
        status: DocumentStatus.COMPLETED,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
      });

      // 8. Return result
      return {
        document: {
          id: updatedDocument.id.value,
          title: updatedDocument.title,
          status: updatedDocument.status,
          pageCount: updatedDocument.pageCount,
          wordCount: updatedDocument.wordCount,
          processedAt: updatedDocument.processedAt,
        },
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Handle processing errors
      const documentId = DocumentId.create(input.documentId);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

      // Update status to FAILED with error message
      await this.documentRepository.updateStatus(documentId, {
        status: DocumentStatus.FAILED,
        errorMessage,
      });

      throw new Error(`Document processing failed: ${errorMessage}`);
    }
  }
}
