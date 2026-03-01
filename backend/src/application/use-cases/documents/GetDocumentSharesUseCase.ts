import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetDocumentSharesInput {
  documentId: string;
  userId: string;
}

export interface DocumentShareOutput {
  classId: string;
  className: string;
  isVisible: boolean;
  publishedAt: Date | null;
}

export interface GetDocumentSharesOutput {
  documentId: string;
  sharedWith: DocumentShareOutput[];
}

/**
 * GetDocumentSharesUseCase
 *
 * Gets all classes a document is shared with.
 * Only the document owner (teacher) can see this.
 */
export class GetDocumentSharesUseCase {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: GetDocumentSharesInput): Promise<GetDocumentSharesOutput> {
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // 1. Verify document exists and belongs to user
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.isOwnedBy(userId)) {
      throw new Error("You do not have permission to view this document's shares");
    }

    // 2. Get all class-document relationships for this document
    const classDocuments = await this.classDocumentRepository.findByDocumentId(documentId);

    // 3. Get class details for each
    const sharedWith: DocumentShareOutput[] = [];

    for (const cd of classDocuments) {
      const classEntity = await this.classRepository.findById(cd.classId);
      if (classEntity) {
        sharedWith.push({
          classId: cd.classId.value,
          className: classEntity.name,
          isVisible: cd.isVisible,
          publishedAt: cd.publishedAt,
        });
      }
    }

    return {
      documentId: documentId.value,
      sharedWith,
    };
  }
}
