import type { DocumentUploadedEvent } from '../../../domain/events/DocumentEvents.js';
import type { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';
import type { IStorageService } from '../../../domain/services/IStorageService.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
import { eventBus } from '../../../infrastructure/events/EventBus.js';

/**
 * UploadDocumentUseCase
 * Application use case for document upload
 *
 * Responsibilities:
 * - Validate file (type, size)
 * - Upload to cloud storage
 * - Create document record
 * - Emit DocumentUploadedEvent for background processing
 * - Return document metadata
 *
 * Note: Processing (text extraction, embeddings) happens asynchronously
 * via event handler, not in this use case.
 */

export interface UploadDocumentInput {
  userId: string;
  title?: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

export interface UploadDocumentOutput {
  document: {
    id: string;
    title: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    status: string;
    uploadedAt: Date;
  };
  message: string;
}

export class UploadDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService
  ) {}

  /**
   * Execute document upload
   * @param input - Upload input data
   * @returns Document metadata
   * @throws Error if validation fails or upload fails
   */
  async execute(input: UploadDocumentInput): Promise<UploadDocumentOutput> {
    // 1. Validate file
    const validation = this.storageService.validateFile({
      filename: input.filename,
      mimetype: input.mimetype,
      size: input.buffer.length,
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    // 2. Upload to cloud storage
    const blobUrl = await this.storageService.upload(input.filename, input.buffer);

    // 3. Create UserId value object
    const userId = UserId.create(input.userId);

    // 4. Generate title from filename if not provided
    const title = input.title || input.filename.replace(/\.[^/.]+$/, '');

    // 5. Create document record
    const document = await this.documentRepository.create({
      userId,
      title,
      filename: input.filename,
      fileSize: input.buffer.length,
      mimeType: input.mimetype,
      blobUrl,
    });

    // 6. Emit event for background processing
    const event: DocumentUploadedEvent = {
      eventName: 'document.uploaded',
      occurredAt: new Date(),
      aggregateId: document.id.value,
      payload: {
        documentId: document.id.value,
        userId: userId.value,
        filename: input.filename,
        mimeType: input.mimetype,
        blobUrl,
      },
    };
    eventBus.publish(event);

    // 7. Return DTO
    return {
      document: {
        id: document.id.value,
        title: document.title,
        filename: document.filename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
      message: 'Document uploaded successfully. Processing will start shortly.',
    };
  }
}
