import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';
import { IStorageService } from '../../../domain/services/IStorageService.js';
import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { UserId } from '../../../domain/value-objects/UserId.js';

interface DownloadDocumentInput {
  documentId: string;
  userId: string;
}

interface DownloadDocumentOutput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export class DownloadDocumentUseCase {
  constructor(
    private documentRepository: IDocumentRepository,
    private storageService: IStorageService
  ) {}

  async execute(input: DownloadDocumentInput): Promise<DownloadDocumentOutput> {
    // Validate UUIDs
    const documentId = DocumentId.create(input.documentId);
    const userId = UserId.create(input.userId);

    // Get document to check ownership and get blob URL
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Check ownership
    if (document.userId.value !== userId.value) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Download file from storage
    const buffer = await this.storageService.download(document.blobUrl);

    return {
      buffer,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }
}
