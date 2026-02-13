/**
 * Document Object Mother
 * Provides pre-configured document objects for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize test data creation with sensible defaults
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface DocumentMotherOptions {
  id?: string;
  userId?: string;
  title?: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  blobUrl?: string;
  pageCount?: number;
  wordCount?: number;
  errorMessage?: string;
  uploadedAt?: Date;
  processedAt?: Date;
}

/**
 * Document Mother - Creates test documents with sensible defaults
 */
export class DocumentMother {
  /**
   * Creates a completed PDF document (most common case)
   */
  static completed(overrides: Partial<DocumentMotherOptions> = {}) {
    return this.create({
      status: 'COMPLETED',
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
  static pending(overrides: Partial<DocumentMotherOptions> = {}) {
    return this.create({
      status: 'PENDING',
      mimeType: 'application/pdf',
      filename: 'pending-document.pdf',
      title: 'Pending Document',
      ...overrides,
    });
  }

  /**
   * Creates a failed document (processing error)
   */
  static failed(overrides: Partial<DocumentMotherOptions> = {}) {
    return this.create({
      status: 'FAILED',
      mimeType: 'application/pdf',
      filename: 'failed-document.pdf',
      title: 'Failed Document',
      errorMessage: 'Processing failed: Invalid format',
      ...overrides,
    });
  }

  /**
   * Creates a DOCX document
   */
  static docx(overrides: Partial<DocumentMotherOptions> = {}) {
    return this.create({
      status: 'COMPLETED',
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
   * Base factory method - creates document in database
   */
  static async create(options: DocumentMotherOptions) {
    const defaults = {
      id: randomUUID(),
      title: 'Test Document',
      filename: 'test.pdf',
      fileSize: 1024 * 100, // 100KB
      mimeType: 'application/pdf',
      status: 'COMPLETED' as const,
      blobUrl: `https://storage.example.com/${randomUUID()}.pdf`,
      uploadedAt: new Date(),
    };

    const data = { ...defaults, ...options };

    return prisma.document.create({
      data: {
        id: data.id,
        userId: data.userId!,
        title: data.title,
        filename: data.filename,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: data.status,
        blobUrl: data.blobUrl,
        pageCount: data.pageCount,
        wordCount: data.wordCount,
        errorMessage: data.errorMessage,
        uploadedAt: data.uploadedAt,
        processedAt: data.processedAt,
      },
    });
  }

  /**
   * Creates multiple documents at once
   */
  static async createMany(count: number, options: DocumentMotherOptions = {}) {
    const promises = Array.from({ length: count }, (_, i) =>
      this.create({
        ...options,
        title: `${options.title || 'Test Document'} ${i + 1}`,
        filename: `document-${i + 1}.pdf`,
      })
    );
    return Promise.all(promises);
  }
}
