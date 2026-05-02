import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { UploadDocumentUseCase } from '@application/use-cases/documents/UploadDocumentUseCase.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import { DocumentStatus } from '@domain/entities/Document.js';
import { DocumentMother } from '../../../../helpers/factories/DocumentMother.js';

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
      countByUserId: vi.fn(),
      findMostRecentByUserId: vi.fn(),
      searchSimilarChunks: vi.fn(() => Promise.resolve([])),
      deleteChunksByDocumentId: vi.fn(),
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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);
      const filename = 'test-document.pdf';
      const blobUrl = 'file://uploads/test-document-12345.pdf';

      const mockDocument = DocumentMother.pending({
        userId,
        title: 'Test Document',
        filename,
        fileSize: fileBuffer.length,
        blobUrl,
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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP/DOCX magic number
        Buffer.from(' DOCX content'),
      ]);
      const filename = 'presentation.docx';
      const blobUrl = 'file://uploads/presentation-67890.docx';

      const mockDocument = DocumentMother.pending({
        userId,
        title: 'Presentation',
        filename,
        fileSize: fileBuffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        blobUrl,
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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);
      const filename = 'my-awesome-document.pdf';
      const blobUrl = 'file://uploads/my-awesome-document-12345.pdf';

      const mockDocument = DocumentMother.pending({
        userId,
        title: 'my-awesome-document',
        filename,
        fileSize: fileBuffer.length,
        blobUrl,
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
      ).rejects.toThrow('Invalid file: file is too small');
    });

    it('should reject file larger than 10MB', async () => {
      // Arrange
      const userId = randomUUID();
      const largeBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.alloc(11 * 1024 * 1024 - 4), // Fill rest to reach 11MB
      ]);

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

    it('should reject PDF with invalid magic number (mimetype spoofing)', async () => {
      // Arrange
      const userId = randomUUID();
      const fakePdfBuffer = Buffer.from('This is not a real PDF');

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Fake PDF',
          filename: 'fake.pdf',
          mimetype: 'application/pdf',
          buffer: fakePdfBuffer,
        })
      ).rejects.toThrow('Invalid PDF file: file header does not match PDF format');
    });

    it('should reject DOCX with invalid magic number (mimetype spoofing)', async () => {
      // Arrange
      const userId = randomUUID();
      const fakeDocxBuffer = Buffer.from('This is not a real DOCX');

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          title: 'Fake DOCX',
          filename: 'fake.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: fakeDocxBuffer,
        })
      ).rejects.toThrow('Invalid DOCX file: file header does not match ZIP/DOCX format');
    });

    it('should reject invalid user ID', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);

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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);

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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);
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
      const maxBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.alloc(10 * 1024 * 1024 - 4), // Fill rest to reach exactly 10MB
      ]);
      const blobUrl = 'file://uploads/large.pdf';

      const mockDocument = DocumentMother.pending({
        userId,
        title: 'Large File',
        filename: 'large.pdf',
        fileSize: maxBuffer.length,
        blobUrl,
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
      const fileBuffer = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF magic number
        Buffer.from(' PDF content'),
      ]);
      const filename = 'test file (with special chars).pdf';
      const blobUrl = 'file://uploads/test-file-12345.pdf';

      const mockDocument = DocumentMother.pending({
        userId,
        title: 'Special Chars',
        filename,
        fileSize: fileBuffer.length,
        blobUrl,
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
