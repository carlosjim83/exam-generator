import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';
import { IStorageService } from '../../../domain/services/IStorageService.js';
import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { DocumentStatus } from '../../../domain/entities/Document.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
import { processDocumentFlow } from '../../../infrastructure/ai/flows/processDocument.flow.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * ProcessDocumentUseCase
 *
 * Orchestrates document processing with RAG pipeline:
 * 1. Validates document exists and user owns it
 * 2. Updates status to PROCESSING
 * 3. Downloads file from storage
 * 4. Saves to temporary location
 * 5. Calls Genkit flow to:
 *    - Extract text from PDF
 *    - Chunk text intelligently
 *    - Generate embeddings with Azure OpenAI
 *    - Store chunks + embeddings in pgvector
 * 6. Updates document with metadata and COMPLETED status
 * 7. Cleans up temporary file
 * 8. Handles errors and sets FAILED status
 */

export interface ProcessDocumentInput {
  documentId: string;
  userId: string; // For authorization check
}

export interface ProcessDocumentOutput {
  document: {
    id: string;
    title: string;
    status: DocumentStatus;
    pageCount: number | null;
    wordCount: number | null;
    processedAt: Date | null;
    chunksCreated: number;
  };
  processingTimeMs: number;
}

export class ProcessDocumentUseCase {
  private readonly tempDir = path.join(process.cwd(), 'temp');

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;

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

      // 3. Check if already processed (idempotent)
      if (document.isCompleted()) {
        // Count existing chunks
        const { getChunkCount } =
          await import('../../../infrastructure/ai/indexers/pgvector.indexer.js');
        const chunksCreated = await getChunkCount(documentId.value);

        return {
          document: {
            id: document.id.value,
            title: document.title,
            status: document.status,
            pageCount: document.pageCount,
            wordCount: document.wordCount,
            processedAt: document.processedAt,
            chunksCreated,
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

      // 6. Save to temporary file (Genkit flow needs file path)
      await mkdir(this.tempDir, { recursive: true });
      const tempFileName = `${randomUUID()}-${document.filename}`;
      tempFilePath = path.join(this.tempDir, tempFileName);
      await writeFile(tempFilePath, fileBuffer);

      // 7. Call Genkit flow for processing
      const result = await processDocumentFlow({
        documentId: documentId.value,
        filePath: tempFilePath,
      });

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // 8. Update document with metadata and COMPLETED status
      const updatedDocument = await this.documentRepository.updateStatus(documentId, {
        status: DocumentStatus.COMPLETED,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
      });

      // 9. Clean up temporary file
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {
          // Ignore cleanup errors
        });
      }

      // 10. Return result
      return {
        document: {
          id: updatedDocument.id.value,
          title: updatedDocument.title,
          status: updatedDocument.status,
          pageCount: updatedDocument.pageCount,
          wordCount: updatedDocument.wordCount,
          processedAt: updatedDocument.processedAt,
          chunksCreated: result.chunksCreated,
        },
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Handle processing errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

      // If document not found or unauthorized, just rethrow (don't try to update status)
      if (errorMessage === 'Document not found' || errorMessage.includes('Unauthorized')) {
        throw error;
      }

      // For other errors, update status to FAILED
      try {
        const documentId = DocumentId.create(input.documentId);
        await this.documentRepository.updateStatus(documentId, {
          status: DocumentStatus.FAILED,
          errorMessage,
        });
      } catch (updateError) {
        // If update fails, ignore (document might have been deleted)
        console.error('Failed to update document status:', updateError);
      }

      // Clean up temporary file on error
      if (tempFilePath) {
        await unlink(tempFilePath).catch(() => {
          // Ignore cleanup errors
        });
      }

      throw new Error(`Document processing failed: ${errorMessage}`);
    }
  }
}
