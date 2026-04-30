/**
 * Document Mother
 * Provides pre-configured Document domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize Document entity creation for unit tests (no DB calls)
 */

import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface DocumentMotherOptions {
  id?: string;
  userId?: string;
  title?: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  blobUrl?: string;
  status?: DocumentStatus;
  pageCount?: number | null;
  wordCount?: number | null;
  errorMessage?: string | null;
  uploadedAt?: Date;
  processedAt?: Date | null;
}

export class DocumentMother {
  /**
   * Creates a completed PDF document (most common case)
   */
  static completed(overrides: DocumentMotherOptions = {}): Document {
    return this.create({
      status: DocumentStatus.COMPLETED,
      mimeType: 'application/pdf',
      filename: 'test-document.pdf',
      title: 'Test Document',
      pageCount: 10,
      wordCount: 1500,
      processedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Creates a pending document (just uploaded, not processed)
   */
  static pending(overrides: DocumentMotherOptions = {}): Document {
    return this.create({
      status: DocumentStatus.PENDING,
      mimeType: 'application/pdf',
      filename: 'pending-document.pdf',
      title: 'Pending Document',
      pageCount: null,
      wordCount: null,
      processedAt: null,
      ...overrides,
    });
  }

  /**
   * Creates a failed document (processing error)
   */
  static failed(overrides: DocumentMotherOptions = {}): Document {
    return this.create({
      status: DocumentStatus.FAILED,
      mimeType: 'application/pdf',
      filename: 'failed-document.pdf',
      title: 'Failed Document',
      errorMessage: 'Processing failed: Invalid format',
      pageCount: null,
      wordCount: null,
      processedAt: null,
      ...overrides,
    });
  }

  /**
   * Creates a DOCX document
   */
  static docx(overrides: DocumentMotherOptions = {}): Document {
    return this.create({
      status: DocumentStatus.COMPLETED,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename: 'test-document.docx',
      title: 'Test DOCX Document',
      pageCount: 5,
      wordCount: 800,
      processedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Base factory method - creates Document domain entity
   */
  static create(overrides: DocumentMotherOptions = {}): Document {
    const now = new Date();
    const id = overrides.id ?? '00000000-0000-4000-a000-000000000001';
    const userId = overrides.userId ?? '00000000-0000-4000-a000-000000000002';

    return Document.create({
      id: DocumentId.create(id),
      userId: UserId.create(userId),
      title: overrides.title ?? 'Test Document',
      filename: overrides.filename ?? 'test.pdf',
      fileSize: overrides.fileSize ?? 102400,
      mimeType: overrides.mimeType ?? 'application/pdf',
      blobUrl: overrides.blobUrl ?? `https://storage.example.com/${id}.pdf`,
      status: overrides.status ?? DocumentStatus.COMPLETED,
      pageCount: overrides.pageCount !== undefined ? overrides.pageCount : 10,
      wordCount: overrides.wordCount !== undefined ? overrides.wordCount : 1500,
      errorMessage: overrides.errorMessage ?? null,
      uploadedAt: overrides.uploadedAt ?? now,
      processedAt: overrides.processedAt ?? null,
    });
  }
}
