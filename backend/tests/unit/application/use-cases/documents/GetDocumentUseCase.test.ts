import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { GetDocumentUseCase } from '@application/use-cases/documents/GetDocumentUseCase.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { DocumentStatus } from '@domain/entities/Document.js';
import { DocumentMother } from '../../../../helpers/factories/DocumentMother.js';

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
      countByUserId: vi.fn(),
      findMostRecentByUserId: vi.fn(),
    } as any;

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

      const mockDocument = DocumentMother.completed({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Test Document',
        filename: 'test.pdf',
        fileSize: 1024,
        blobUrl: 'https://storage.example.com/test.pdf',
        pageCount: 10,
        wordCount: 500,
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

      const mockDocument = DocumentMother.pending({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Pending Doc',
        filename: 'pending.docx',
        fileSize: 2048,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        blobUrl: 'https://storage.example.com/pending.docx',
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

      const mockDocument = DocumentMother.docx({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Word Document',
        filename: 'document.docx',
        fileSize: 5120,
        blobUrl: 'https://storage.example.com/document.docx',
        pageCount: 5,
        wordCount: 1200,
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

      const mockDocument = DocumentMother.completed({
        id: mockDocumentId,
        userId: ownerUserId,
        title: 'Private Document',
        filename: 'private.pdf',
        fileSize: 1024,
        blobUrl: 'https://storage.example.com/private.pdf',
        pageCount: 10,
        wordCount: 500,
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

      const mockDocument = DocumentMother.failed({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Failed Document',
        filename: 'failed.pdf',
        fileSize: 1024,
        blobUrl: 'https://storage.example.com/failed.pdf',
        errorMessage: 'Processing error',
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

      const mockDocument = DocumentMother.create({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Processing Document',
        filename: 'processing.pdf',
        fileSize: 1024,
        blobUrl: 'https://storage.example.com/processing.pdf',
        status: DocumentStatus.PROCESSING,
        pageCount: null,
        wordCount: null,
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

      const mockDocument = DocumentMother.completed({
        id: mockDocumentId,
        userId: mockUserId,
        title: 'Large Document',
        filename: 'large.pdf',
        fileSize: 10485760,
        blobUrl: 'https://storage.example.com/large.pdf',
        pageCount: 500,
        wordCount: 50000,
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
