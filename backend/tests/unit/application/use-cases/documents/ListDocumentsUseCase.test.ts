import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { ListDocumentsUseCase } from '@application/use-cases/documents/ListDocumentsUseCase.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

describe('ListDocumentsUseCase', () => {
  let listDocumentsUseCase: ListDocumentsUseCase;
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
    listDocumentsUseCase = new ListDocumentsUseCase(mockDocumentRepository);
  });

  describe('Successful listing', () => {
    it('should list all documents for a user', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      const mockDocuments = [
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Document 1',
          filename: 'doc1.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/doc1.pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 5,
          wordCount: 250,
          errorMessage: null,
          uploadedAt: new Date('2026-01-01'),
          processedAt: new Date('2026-01-02'),
        }),
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Document 2',
          filename: 'doc2.docx',
          fileSize: 2048,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          blobUrl: 'https://storage.example.com/doc2.docx',
          status: DocumentStatus.PENDING,
          pageCount: null,
          wordCount: null,
          errorMessage: null,
          uploadedAt: new Date('2026-01-03'),
          processedAt: null,
        }),
      ];

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0]).toEqual({
        id: expect.any(String),
        title: 'Document 1',
        filename: 'doc1.pdf',
        fileSize: 1024,
        status: DocumentStatus.COMPLETED,
        uploadedAt: new Date('2026-01-01'),
      });
      expect(result.documents[1]).toEqual({
        id: expect.any(String),
        title: 'Document 2',
        filename: 'doc2.docx',
        fileSize: 2048,
        status: DocumentStatus.PENDING,
        uploadedAt: new Date('2026-01-03'),
      });

      // Verify interactions
      expect(mockDocumentRepository.findByUserId).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId })
      );
    });

    it('should return empty array when user has no documents', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue([]);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toEqual([]);
      expect(result.documents).toHaveLength(0);
    });

    it('should list documents with different statuses', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      const mockDocuments = [
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Pending Doc',
          filename: 'pending.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/pending.pdf',
          status: DocumentStatus.PENDING,
          pageCount: null,
          wordCount: null,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: null,
        }),
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Processing Doc',
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
        }),
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Completed Doc',
          filename: 'completed.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/completed.pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 10,
          wordCount: 500,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        }),
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Failed Doc',
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
        }),
      ];

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toHaveLength(4);
      expect(result.documents[0].status).toBe(DocumentStatus.PENDING);
      expect(result.documents[1].status).toBe(DocumentStatus.PROCESSING);
      expect(result.documents[2].status).toBe(DocumentStatus.COMPLETED);
      expect(result.documents[3].status).toBe(DocumentStatus.FAILED);
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid user ID format', async () => {
      // Arrange
      const input = {
        userId: 'invalid-uuid',
      };

      // Act & Assert
      // UserId.create() will throw during validation
      await expect(listDocumentsUseCase.execute(input)).rejects.toThrow();

      // Verify repository was never called
      expect(mockDocumentRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle user with single document', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      const mockDocuments = [
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Only Document',
          filename: 'only.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/only.pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 1,
          wordCount: 50,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        }),
      ];

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toBe('Only Document');
    });

    it('should handle user with many documents', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      // Create 50 mock documents
      const mockDocuments = Array.from({ length: 50 }, (_, i) =>
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: `Document ${i + 1}`,
          filename: `doc${i + 1}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: `https://storage.example.com/doc${i + 1}.pdf`,
          status: DocumentStatus.COMPLETED,
          pageCount: 10,
          wordCount: 500,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        })
      );

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toHaveLength(50);
      expect(result.documents[0].title).toBe('Document 1');
      expect(result.documents[49].title).toBe('Document 50');
    });

    it('should handle documents with large file sizes', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      const mockDocuments = [
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Huge Document',
          filename: 'huge.pdf',
          fileSize: 52428800, // 50MB
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/huge.pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 1000,
          wordCount: 100000,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        }),
      ];

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents[0].fileSize).toBe(52428800);
    });

    it('should list both PDF and DOCX documents', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        userId: mockUserId,
      };

      const mockDocuments = [
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'PDF Document',
          filename: 'document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.example.com/document.pdf',
          status: DocumentStatus.COMPLETED,
          pageCount: 5,
          wordCount: 250,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        }),
        Document.create({
          id: DocumentId.create(randomUUID()),
          userId: UserId.create(mockUserId),
          title: 'Word Document',
          filename: 'document.docx',
          fileSize: 2048,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          blobUrl: 'https://storage.example.com/document.docx',
          status: DocumentStatus.COMPLETED,
          pageCount: 3,
          wordCount: 150,
          errorMessage: null,
          uploadedAt: new Date(),
          processedAt: new Date(),
        }),
      ];

      vi.mocked(mockDocumentRepository.findByUserId).mockResolvedValue(mockDocuments);

      // Act
      const result = await listDocumentsUseCase.execute(input);

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].filename).toBe('document.pdf');
      expect(result.documents[1].filename).toBe('document.docx');
    });
  });
});
