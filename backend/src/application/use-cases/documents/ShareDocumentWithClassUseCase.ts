import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { DocumentStatus } from '@domain/entities/Document.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ShareDocumentWithClassInput {
  documentId: string;
  classId: string;
  userId: string;
  isVisible?: boolean;
}

export interface ShareDocumentWithClassOutput {
  id: string;
  classId: string;
  documentId: string;
  isVisible: boolean;
  publishedAt: Date | null;
}

/**
 * ShareDocumentWithClassUseCase
 *
 * Allows a teacher to share a document with a class.
 * The document must be owned by the teacher and completed processing.
 * The class must be owned by the teacher.
 */
export class ShareDocumentWithClassUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: ShareDocumentWithClassInput): Promise<ShareDocumentWithClassOutput> {
    const documentId = DocumentId.create(input.documentId);
    const classId = ClassId.create(input.classId);
    const userId = UserId.create(input.userId);

    // 1. Find the document
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // 2. Validate document ownership
    if (!document.userId.equals(userId)) {
      throw new Error('You do not have permission to share this document');
    }

    // 3. Validate document is completed
    if (document.status !== DocumentStatus.COMPLETED) {
      throw new Error('Document must be processed before sharing');
    }

    // 4. Find the class
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    // 5. Validate class ownership
    if (!classEntity.teacherId.equals(userId)) {
      throw new Error('You do not have permission to share to this class');
    }

    // 6. Check if already shared
    const alreadyShared = await this.classDocumentRepository.isSharedWithClass(classId, documentId);
    if (alreadyShared) {
      throw new Error('Document is already shared with this class');
    }

    // 7. Create ClassDocument relationship
    const isVisible = input.isVisible ?? false;
    const classDocument = ClassDocument.create({
      id: new ClassDocumentId(),
      classId,
      documentId,
      isVisible,
      publishedAt: isVisible ? new Date() : null,
    });

    // 8. Save
    await this.classDocumentRepository.save(classDocument);

    // 9. Return output
    return {
      id: classDocument.id.value,
      classId: classDocument.classId.value,
      documentId: classDocument.documentId.value,
      isVisible: classDocument.isVisible,
      publishedAt: classDocument.publishedAt,
    };
  }
}
