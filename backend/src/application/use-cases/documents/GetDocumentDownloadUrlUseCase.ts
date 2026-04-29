import { DocumentStatus } from '@domain/entities/Document.js';
import { NotFoundError, ConflictError, ForbiddenError } from '@domain/errors/DomainError.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetDocumentDownloadUrlInput {
  documentId: string;
  studentId: string;
}

export interface GetDocumentDownloadUrlOutput {
  downloadUrl: string;
  expiresIn: number; // seconds
  filename: string;
  mimeType: string;
}

/**
 * GetDocumentDownloadUrlUseCase
 *
 * Generates a temporary download URL for a document.
 * Verifies that:
 * 1. Document exists and is completed
 * 2. Student is enrolled in a class that has this document shared
 * 3. Document is visible (isVisible = true)
 *
 * Note: The download URL is returned as-is from blob storage.
 * For Azure, a SAS token should be generated at the storage service level.
 */
export class GetDocumentDownloadUrlUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository
  ) {}

  async execute(input: GetDocumentDownloadUrlInput): Promise<GetDocumentDownloadUrlOutput> {
    const documentId = DocumentId.create(input.documentId);
    const studentId = UserId.create(input.studentId);

    // 1. Find document
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // 2. Validate document is completed
    if (document.status !== DocumentStatus.COMPLETED) {
      throw new ConflictError('Document is not ready for download');
    }

    // 3. Find all classes where this document is shared (visible)
    const classDocuments = await this.classDocumentRepository.findByDocumentId(documentId);
    const visibleClassDocuments = classDocuments.filter((cd) => cd.isVisible);

    if (visibleClassDocuments.length === 0) {
      throw new ForbiddenError('This document is not publicly available');
    }

    // 4. Check if student is enrolled in any of these classes
    let isAuthorized = false;
    for (const cd of visibleClassDocuments) {
      const enrollment = await this.enrollmentRepository.findByClassAndStudent(
        cd.classId,
        studentId
      );
      if (enrollment && enrollment.isActive) {
        isAuthorized = true;
        break;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenError('You do not have access to this document');
    }

    // 5. Return document blob URL (in production, this would be a SAS URL)
    // For Azure, the storage service generates SAS tokens
    // For Local storage, this is a file:// URL

    return {
      downloadUrl: document.blobUrl,
      expiresIn: 3600, // 1 hour - for SAS URLs this is the actual expiry
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }
}
