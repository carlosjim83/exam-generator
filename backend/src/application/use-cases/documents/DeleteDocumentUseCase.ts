import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

interface DeleteDocumentInput {
  documentId: string;
  userId: string;
}

export class DeleteDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(input: DeleteDocumentInput): Promise<{ message: string }> {
    // Validate UUIDs
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // Get document to check ownership
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Check ownership
    if (document.userId.value !== userId.value) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Delete document (will cascade delete chunks due to Prisma schema)
    await this.documentRepository.delete(documentId);

    return {
      message: 'Document deleted successfully',
    };
  }
}
