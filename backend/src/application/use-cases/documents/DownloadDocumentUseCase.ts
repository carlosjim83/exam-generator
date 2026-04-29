import { NotFoundError, ForbiddenError } from '@domain/errors/DomainError.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

interface DownloadDocumentInput {
  documentId: string;
  userId: string;
}

interface DownloadDocumentOutput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * DownloadDocumentUseCase
 *
 * Downloads a document file from storage.
 *
 * Access rules:
 * 1. Document owner (teacher) can always download their documents
 * 2. Students can download documents shared with their classes (if isVisible = true)
 */
export class DownloadDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly studentEnrollmentRepository: IStudentEnrollmentRepository,
    private readonly storageService: IStorageService
  ) {}

  async execute(input: DownloadDocumentInput): Promise<DownloadDocumentOutput> {
    // Validate UUIDs
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // Get document
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Check access: owner or student with visible share
    const isOwner = document.userId.value === userId.value;
    let hasAccess = isOwner;

    if (!isOwner) {
      // Check if user is a student with access through a class
      hasAccess = await this.checkStudentAccess(documentId, userId);
    }

    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized: You do not have access to this document');
    }

    // Download file from storage
    const buffer = await this.storageService.download(document.blobUrl);

    return {
      buffer,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  /**
   * Check if a student has access to a document through their enrolled classes
   */
  private async checkStudentAccess(documentId: DocumentId, studentId: UserId): Promise<boolean> {
    // Get all classes this document is shared with (with isVisible = true)
    const classDocuments = await this.classDocumentRepository.findByDocumentId(documentId);

    // Filter to only visible shares
    const visibleShares = classDocuments.filter((cd) => cd.isVisible);

    // Check if student is enrolled in any of these classes
    for (const share of visibleShares) {
      const isEnrolled = await this.studentEnrollmentRepository.isStudentEnrolled(
        share.classId,
        studentId
      );
      if (isEnrolled) {
        return true;
      }
    }

    return false;
  }
}
