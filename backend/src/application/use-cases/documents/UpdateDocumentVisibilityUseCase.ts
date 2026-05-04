import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface UpdateDocumentVisibilityInput {
  documentId: string;
  classId: string;
  userId: string;
  isVisible: boolean;
}

export interface UpdateDocumentVisibilityOutput {
  id: string;
  classId: string;
  documentId: string;
  isVisible: boolean;
  publishedAt: Date | null;
}

/**
 * UpdateDocumentVisibilityUseCase
 *
 * Updates the visibility of a shared document for a class.
 * Only the document owner (teacher) can change visibility.
 * When isVisible is set to true, publishedAt is set to current time.
 * When isVisible is set to false, publishedAt is set to null.
 */
export class UpdateDocumentVisibilityUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: UpdateDocumentVisibilityInput): Promise<UpdateDocumentVisibilityOutput> {
    const documentId = DocumentId.create(input.documentId);
    const classId = ClassId.create(input.classId);
    const userId = UserId.create(input.userId);

    // 1. Verify document exists and belongs to user
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    assertOwnership(document.userId, userId, 'You do not have permission to update this document');

    // 2. Verify class exists and belongs to user
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(
      classEntity.teacherId,
      userId,
      'You do not have permission to update visibility for this class'
    );

    // 3. Find the ClassDocument relationship
    const classDocument = await this.classDocumentRepository.findByClassAndDocument(
      classId,
      documentId
    );
    if (!classDocument) {
      throw new ConflictError('Document is not shared with this class');
    }

    // 4. Update visibility
    if (input.isVisible) {
      classDocument.publish();
    } else {
      classDocument.unpublish();
    }

    // 5. Save changes
    await this.classDocumentRepository.save(classDocument);

    // 6. Return updated data
    return {
      id: classDocument.id.value,
      classId: classDocument.classId.value,
      documentId: classDocument.documentId.value,
      isVisible: classDocument.isVisible,
      publishedAt: classDocument.publishedAt,
    };
  }
}
