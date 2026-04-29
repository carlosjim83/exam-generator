import { NotFoundError, ForbiddenError, ConflictError } from '@domain/errors/DomainError.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface UnshareDocumentInput {
  documentId: string;
  classId: string;
  userId: string;
}

/**
 * UnshareDocumentUseCase
 *
 * Allows a teacher to unshare (remove) a document from a class.
 * Both document and class must be owned by the user.
 */
export class UnshareDocumentUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: UnshareDocumentInput): Promise<void> {
    const documentId = DocumentId.create(input.documentId);
    const classId = ClassId.create(input.classId);
    const userId = UserId.create(input.userId);

    // 1. Find the document
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // 2. Validate document ownership
    if (!document.userId.equals(userId)) {
      throw new ForbiddenError('You do not have permission to unshare this document');
    }

    // 3. Find the class
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    // 4. Validate class ownership
    if (!classEntity.teacherId.equals(userId)) {
      throw new ForbiddenError('You do not have permission to modify this class');
    }

    // 5. Find the ClassDocument relationship
    const classDocument = await this.classDocumentRepository.findByClassAndDocument(
      classId,
      documentId
    );
    if (!classDocument) {
      throw new ConflictError('Document is not shared with this class');
    }

    // 6. Delete the relationship
    await this.classDocumentRepository.delete(classDocument.id);
  }
}
