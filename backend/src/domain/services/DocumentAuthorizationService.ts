import { NotFoundError, ValidationError } from '@domain/errors/DomainError.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { DocumentId } from '@domain/value-objects/DocumentId.js';
import type { UserId } from '@domain/value-objects/UserId.js';
import type { Document } from '@domain/entities/Document.js';

export interface IDocumentAuthorizationService {
  verifyDocuments(
    userId: UserId,
    documentIds: DocumentId[],
    options?: { requiredStatus?: string }
  ): Promise<Document[]>;
}

/**
 * DocumentAuthorizationService
 * Centralizes document verification: existence, ownership, and optional status check.
 */
export class DocumentAuthorizationService implements IDocumentAuthorizationService {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async verifyDocuments(
    userId: UserId,
    documentIds: DocumentId[],
    options: { requiredStatus?: string } = {}
  ): Promise<Document[]> {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        const document = await this.documentRepository.findById(docId);

        if (!document) {
          throw new NotFoundError(`Document not found: ${docId.value}`);
        }

        assertOwnership(
          document.userId,
          userId,
          `Unauthorized: Document ${docId.value} does not belong to user`
        );

        if (options.requiredStatus && document.status !== options.requiredStatus) {
          throw new ValidationError(
            `Document ${docId.value} not ready. Status: ${document.status}, required: ${options.requiredStatus}`
          );
        }

        return document;
      })
    );

    return documents;
  }
}
