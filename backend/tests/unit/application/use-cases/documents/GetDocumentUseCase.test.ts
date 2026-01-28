import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { GetDocumentUseCase } from '@application/use-cases/documents/GetDocumentUseCase.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

describe('GetDocumentUseCase', () => {
  let getDocumentUseCase: GetDocumentUseCase;
  let mockDocumentRepository: IDocumentRepository;

  beforeEach(() => {
    // Create mock for repository
    mockDocumentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateMetadata: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    // Instantiate use case with mock
    getDocumentUseCase = new GetDocumentUseCase(mockDocumentRepository);
  });

  describe('Successful retrieval', () => {
    it('should retrieve document with valid ID and ownership', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Test Document',
        filename: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.example.com/test.pdf',
        status: DocumentStatus.COMPLETED,
        pageCount: 10,
        wordCount: 500,
        errorMessage: null,
        uploadedAt: new Date('2026-01-01'),
        processedAt: new Date('2026-01-02'),
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        document: {
          id: mockDocumentId,
          title: 'Test Document',
          filename: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 10,
          wordCount: 500,
          uploadedAt: new Date('2026-01-01'),
          processedAt: new Date('2026-01-02'),
        },
      });

      // Verify interactions
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockDocumentId })
      );
    });

    it('should retrieve PENDING document', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Pending Doc',
        filename: 'pending.docx',
        fileSize: 2048,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        blobUrl: 'https://storage.example.com/pending.docx',
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result.document.status).toBe(DocumentStatus.PENDING);
      expect(result.document.pageCount).toBeNull();
      expect(result.document.wordCount).toBeNull();
      expect(result.document.processedAt).toBeNull();
    });

    it('should retrieve DOCX document', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Word Document',
        filename: 'document.docx',
        fileSize: 5120,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        blobUrl: 'https://storage.example.com/document.docx',
        status: DocumentStatus.COMPLETED,
        pageCount: 5,
        wordCount: 1200,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: new Date(),
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result.document.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(result.document.filename).toBe('document.docx');
    });
  });

  describe('Access control', () => {
    it('should throw error when document not found', async () => {
      // Arrange
      const input = {
        documentId: randomUUID(),
        userId: randomUUID(),
      };

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(getDocumentUseCase.execute(input)).rejects.toThrow('Document not found');
    });

    it('should throw error when user does not own document', async () => {
      // Arrange
      const ownerUserId = randomUUID();
      const differentUserId = randomUUID();
      const mockDocumentId = randomUUID();

      const input = {
        documentId: mockDocumentId,
        userId: differentUserId, // Different user trying to access
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(ownerUserId), // Owned by different user
        title: 'Private Document',
        filename: 'private.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.example.com/private.pdf',
        status: DocumentStatus.COMPLETED,
        pageCount: 10,
        wordCount: 500,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: new Date(),
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(getDocumentUseCase.execute(input)).rejects.toThrow('Access denied');
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid document ID format', async () => {
      // Arrange
      const input = {
        documentId: 'not-a-valid-uuid',
        userId: randomUUID(),
      };

      // Act & Assert
      // DocumentId.create() will throw during validation
      await expect(getDocumentUseCase.execute(input)).rejects.toThrow();

      // Verify repository was never called
      expect(mockDocumentRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error for invalid user ID format', async () => {
      // Arrange
      const input = {
        documentId: randomUUID(),
        userId: 'invalid-uuid',
      };

      // Act & Assert
      // UserId.create() will throw during validation
      await expect(getDocumentUseCase.execute(input)).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle document with FAILED status', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Failed Document',
        filename: 'failed.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.example.com/failed.pdf',
        status: DocumentStatus.FAILED,
        pageCount: null,
        wordCount: null,
        errorMessage: 'Processing error',
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result.document.status).toBe(DocumentStatus.FAILED);
    });

    it('should handle document with PROCESSING status', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Processing Document',
        filename: 'processing.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.example.com/processing.pdf',
        status: DocumentStatus.PROCESSING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result.document.status).toBe(DocumentStatus.PROCESSING);
    });

    it('should handle large documents', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const mockDocumentId = randomUUID();
      const input = {
        documentId: mockDocumentId,
        userId: mockUserId,
      };

      const mockDocument = Document.create({
        id: DocumentId.create(mockDocumentId),
        userId: UserId.create(mockUserId),
        title: 'Large Document',
        filename: 'large.pdf',
        fileSize: 10485760, // 10MB
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.example.com/large.pdf',
        status: DocumentStatus.COMPLETED,
        pageCount: 500,
        wordCount: 50000,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: new Date(),
      });

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument);

      // Act
      const result = await getDocumentUseCase.execute(input);

      // Assert
      expect(result.document.fileSize).toBe(10485760);
      expect(result.document.pageCount).toBe(500);
      expect(result.document.wordCount).toBe(50000);
    });
  });
});
