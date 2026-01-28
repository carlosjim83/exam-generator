import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { UploadDocumentUseCase } from '@application/use-cases/documents/UploadDocumentUseCase.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * UploadDocumentUseCase Unit Tests
 *
 * Tests upload orchestration with mocked dependencies.
 * Integration tests are in: tests/integration/application/use-cases/documents/UploadDocumentUseCase.integration.test.ts
 */

describe('UploadDocumentUseCase', () => {
  let useCase: UploadDocumentUseCase;
  let mockDocumentRepository: IDocumentRepository;
  let mockStorageService: IStorageService;

  beforeEach(() => {
    // Mock repository
    mockDocumentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateMetadata: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    // Mock storage service
    mockStorageService = {
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      isConfigured: vi.fn().mockReturnValue(true),
      validateFile: vi.fn().mockReturnValue({ valid: true }),
    };

    // Create use case instance
    useCase = new UploadDocumentUseCase(mockDocumentRepository, mockStorageService);
  });

  describe('Successful upload', () => {
    it('should upload PDF document successfully', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('PDF content');
      const filename = 'test-document.pdf';
      const blobUrl = 'file://uploads/test-document-12345.pdf';

      const mockDocument = Document.create({
        id: DocumentId.create(randomUUID()),
        userId: UserId.create(userId),
        title: 'Test Document',
        filename,
        fileSize: fileBuffer.length,
        mimeType: 'application/pdf',
        blobUrl,
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute({
        userId,
        title: 'Test Document',
        filename,
        mimetype: 'application/pdf',
        buffer: fileBuffer,
      });

      // Assert
      expect(result.document.title).toBe('Test Document');
      expect(result.document.filename).toBe(filename);
      expect(result.document.fileSize).toBe(fileBuffer.length);
      expect(result.document.status).toBe(DocumentStatus.PENDING);

      // Verify storage upload called
      expect(mockStorageService.upload).toHaveBeenCalledWith(filename, fileBuffer);

      // Verify document created in repository
      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          filename,
          fileSize: fileBuffer.length,
          mimeType: 'application/pdf',
          blobUrl,
        })
      );
    });

    it('should upload DOCX document successfully', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('DOCX content');
      const filename = 'presentation.docx';
      const blobUrl = 'file://uploads/presentation-67890.docx';

      const mockDocument = Document.create({
        id: DocumentId.create(randomUUID()),
        userId: UserId.create(userId),
        title: 'Presentation',
        filename,
        fileSize: fileBuffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        blobUrl,
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute({
        userId,
        title: 'Presentation',
        filename,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: fileBuffer,
      });

      // Assert
      expect(result.document.filename).toBe(filename);
      expect(mockStorageService.upload).toHaveBeenCalled();
      expect(mockDocumentRepository.create).toHaveBeenCalled();
    });

    it('should auto-generate title from filename if not provided', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('PDF content');
      const filename = 'my-awesome-document.pdf';
      const blobUrl = 'file://uploads/my-awesome-document-12345.pdf';

      const mockDocument = Document.create({
        id: DocumentId.create(randomUUID()),
        userId: UserId.create(userId),
        title: 'my-awesome-document', // Auto-generated from filename
        filename,
        fileSize: fileBuffer.length,
        mimeType: 'application/pdf',
        blobUrl,
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute({
        userId,
        title: undefined, // No title provided
        filename,
        mimetype: 'application/pdf',
        buffer: fileBuffer,
      });

      // Assert
      expect(result.document.title).toBe('my-awesome-document');
      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'my-awesome-document',
        })
      );
    });
  });

  describe('Validation failures', () => {
    it('should reject empty file', async () => {
      // Arrange
      const userId = randomUUID();
      const emptyBuffer = Buffer.from('');

      // Mock validation failure
      vi.mocked(mockStorageService.validateFile).mockReturnValue({
        valid: false,
        error: 'File size must be greater than zero',
      });

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Empty File',
          filename: 'empty.pdf',
          mimetype: 'application/pdf',
          buffer: emptyBuffer,
        })
      ).rejects.toThrow('File size must be greater than zero');
    });

    it('should reject file larger than 10MB', async () => {
      // Arrange
      const userId = randomUUID();
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB

      // Mock validation failure
      vi.mocked(mockStorageService.validateFile).mockReturnValue({
        valid: false,
        error: 'File size exceeds maximum allowed size (10MB)',
      });

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Too Large',
          filename: 'large.pdf',
          mimetype: 'application/pdf',
          buffer: largeBuffer,
        })
      ).rejects.toThrow('File size exceeds maximum allowed size (10MB)');
    });

    it('should reject unsupported file type', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('Text content');

      // Mock validation failure
      vi.mocked(mockStorageService.validateFile).mockReturnValue({
        valid: false,
        error: 'Invalid file type. Only PDF and DOCX are allowed',
      });

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Text File',
          filename: 'document.txt',
          mimetype: 'text/plain',
          buffer: fileBuffer,
        })
      ).rejects.toThrow('Invalid file type. Only PDF and DOCX are allowed');
    });

    it('should reject invalid user ID', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';
      const fileBuffer = Buffer.from('PDF content');

      // Act & Assert
      await expect(
        useCase.execute({
          userId: invalidUserId,
          title: 'Test',
          filename: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: fileBuffer,
        })
      ).rejects.toThrow('UserId must be a valid UUID');
    });
  });

  describe('Error handling', () => {
    it('should throw error if storage upload fails', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('PDF content');

      vi.mocked(mockStorageService.upload).mockRejectedValue(
        new Error('Storage service unavailable')
      );

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Test',
          filename: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: fileBuffer,
        })
      ).rejects.toThrow('Storage service unavailable');

      // Should not create document in database if storage fails
      expect(mockDocumentRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if database save fails', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('PDF content');
      const blobUrl = 'file://uploads/test.pdf';

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Test',
          filename: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: fileBuffer,
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle maximum file size (10MB)', async () => {
      // Arrange
      const userId = randomUUID();
      const maxBuffer = Buffer.alloc(10 * 1024 * 1024); // Exactly 10 MB
      const blobUrl = 'file://uploads/large.pdf';

      const mockDocument = Document.create({
        id: DocumentId.create(randomUUID()),
        userId: UserId.create(userId),
        title: 'Large File',
        filename: 'large.pdf',
        fileSize: maxBuffer.length,
        mimeType: 'application/pdf',
        blobUrl,
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute({
        userId,
        title: 'Large File',
        filename: 'large.pdf',
        mimetype: 'application/pdf',
        buffer: maxBuffer,
      });

      // Assert
      expect(result.document.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should handle special characters in filename', async () => {
      // Arrange
      const userId = randomUUID();
      const fileBuffer = Buffer.from('PDF content');
      const filename = 'test file (with special chars).pdf';
      const blobUrl = 'file://uploads/test-file-12345.pdf';

      const mockDocument = Document.create({
        id: DocumentId.create(randomUUID()),
        userId: UserId.create(userId),
        title: 'Special Chars',
        filename,
        fileSize: fileBuffer.length,
        mimeType: 'application/pdf',
        blobUrl,
        status: DocumentStatus.PENDING,
        pageCount: null,
        wordCount: null,
        errorMessage: null,
        uploadedAt: new Date(),
        processedAt: null,
      });

      vi.mocked(mockStorageService.upload).mockResolvedValue(blobUrl);
      vi.mocked(mockDocumentRepository.create).mockResolvedValue(mockDocument);

      // Act
      const result = await useCase.execute({
        userId,
        title: 'Special Chars',
        filename,
        mimetype: 'application/pdf',
        buffer: fileBuffer,
      });

      // Assert
      expect(result.document.filename).toBe(filename);
    });
  });
});
