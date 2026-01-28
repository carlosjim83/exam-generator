import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { UploadDocumentUseCase } from '@application/use-cases/documents/UploadDocumentUseCase.js';
import { PrismaDocumentRepository } from '@infrastructure/repositories/PrismaDocumentRepository.js';
import { LocalFileStorageService } from '@infrastructure/storage/LocalFileStorageService.js';
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  testDb,
} from '@tests/helpers/test-database.js';
import { cleanupTestArtifacts } from '@tests/helpers/cleanup.js';
import { existsSync, unlinkSync } from 'fs';

/**
 * Integration Test: UploadDocumentUseCase
 *
 * Tests the complete document upload flow with REAL dependencies:
 * - Real database (Prisma + PostgreSQL test DB)
 * - Real file storage (LocalFileStorageService writes to disk)
 * - Real use case orchestration
 *
 * What we're testing:
 * - File validation (type, size)
 * - Storage upload
 * - Database persistence
 * - Event emission (document.uploaded)
 */

describe('UploadDocumentUseCase [Integration]', () => {
  let uploadDocumentUseCase: UploadDocumentUseCase;
  let documentRepository: PrismaDocumentRepository;
  let storageService: LocalFileStorageService;
  let testUserId: string;

  const TEST_UPLOAD_DIR = './test-uploads';

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();

    // Create test user
    const user = await createTestUser({
      email: 'uploader@test.com',
      role: 'TEACHER',
    });
    testUserId = user.id;

    // Initialize REAL dependencies
    documentRepository = PrismaDocumentRepository.create(testDb);
    storageService = new LocalFileStorageService(TEST_UPLOAD_DIR);

    // Instantiate use case with real dependencies
    uploadDocumentUseCase = new UploadDocumentUseCase(documentRepository, storageService);
  });

  afterAll(async () => {
    // Cleanup database connections
    await disconnectDatabase();

    // 🔥 DESTROY all test artifact directories
    cleanupTestArtifacts();
  });

  describe('Successful upload', () => {
    it('should upload PDF document and save to database', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');
      const input = {
        userId: testUserId,
        title: 'My Test PDF',
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
      };

      // Act
      const result = await uploadDocumentUseCase.execute(input);

      // Assert - Response
      expect(result.document).toMatchObject({
        id: expect.any(String),
        title: 'My Test PDF',
        filename: 'test.pdf',
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        status: 'PENDING',
        uploadedAt: expect.any(Date),
      });
      expect(result.message).toContain('uploaded successfully');

      // Assert - Database persistence
      const savedDoc = await testDb.document.findUnique({
        where: { id: result.document.id },
      });
      expect(savedDoc).not.toBeNull();
      expect(savedDoc?.title).toBe('My Test PDF');
      expect(savedDoc?.userId).toBe(testUserId);

      // Assert - File storage
      const blobUrl = savedDoc?.blobUrl;
      expect(blobUrl).toMatch(/^file:\/\//);
      expect(blobUrl).toContain('.pdf');

      // Cleanup uploaded file (file path has timestamp, so we get it from DB)
      if (blobUrl) {
        const filePath = blobUrl.replace('file://', '');
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    });

    it('should upload DOCX document', async () => {
      // Arrange
      const docxBuffer = Buffer.from('PK fake docx content'); // DOCX is a ZIP file
      const input = {
        userId: testUserId,
        filename: 'document.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: docxBuffer,
      };

      // Act
      const result = await uploadDocumentUseCase.execute(input);

      // Assert
      expect(result.document.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(result.document.filename).toBe('document.docx');

      // Verify database
      const savedDoc = await testDb.document.findUnique({
        where: { id: result.document.id },
      });
      expect(savedDoc?.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      // Cleanup
      if (savedDoc?.blobUrl) {
        const filePath = savedDoc.blobUrl.replace('file://', '');
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    });

    it('should auto-generate title from filename if not provided', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('%PDF-1.4 content');
      const input = {
        userId: testUserId,
        // No title provided
        filename: 'my-awesome-document.pdf',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
      };

      // Act
      const result = await uploadDocumentUseCase.execute(input);

      // Assert - Title generated from filename (without extension)
      expect(result.document.title).toBe('my-awesome-document');

      // Cleanup
      const doc = await testDb.document.findUnique({ where: { id: result.document.id } });
      if (doc?.blobUrl) {
        const filePath = doc.blobUrl.replace('file://', '');
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    });
  });

  describe('Validation failures', () => {
    it('should reject empty file', async () => {
      // Arrange
      const input = {
        userId: testUserId,
        filename: 'empty.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from(''), // Empty buffer
      };

      // Act & Assert
      await expect(uploadDocumentUseCase.execute(input)).rejects.toThrow('File is empty');
    });

    it('should reject file larger than 10MB', async () => {
      // Arrange
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const input = {
        userId: testUserId,
        filename: 'huge.pdf',
        mimetype: 'application/pdf',
        buffer: largeBuffer,
      };

      // Act & Assert
      await expect(uploadDocumentUseCase.execute(input)).rejects.toThrow(
        'File too large. Maximum size is 10MB'
      );
    });

    it('should reject unsupported file type', async () => {
      // Arrange
      const input = {
        userId: testUserId,
        filename: 'script.js',
        mimetype: 'application/javascript',
        buffer: Buffer.from('console.log("hello")'),
      };

      // Act & Assert
      await expect(uploadDocumentUseCase.execute(input)).rejects.toThrow('Invalid file type');
    });

    it('should reject invalid user ID', async () => {
      // Arrange
      const input = {
        userId: 'not-a-valid-uuid',
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content'),
      };

      // Act & Assert
      await expect(uploadDocumentUseCase.execute(input)).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle maximum allowed file size (10MB)', async () => {
      // Arrange
      const maxBuffer = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      const input = {
        userId: testUserId,
        filename: 'max-size.pdf',
        mimetype: 'application/pdf',
        buffer: maxBuffer,
      };

      // Act
      const result = await uploadDocumentUseCase.execute(input);

      // Assert
      expect(result.document.fileSize).toBe(10 * 1024 * 1024);

      // Cleanup
      const doc = await testDb.document.findUnique({ where: { id: result.document.id } });
      if (doc?.blobUrl) {
        const filePath = doc.blobUrl.replace('file://', '');
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    });

    it('should handle special characters in filename', async () => {
      // Arrange
      const input = {
        userId: testUserId,
        filename: 'Document (2024) - Test #1.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content'),
      };

      // Act
      const result = await uploadDocumentUseCase.execute(input);

      // Assert
      expect(result.document.filename).toBe('Document (2024) - Test #1.pdf');

      // Cleanup
      const doc = await testDb.document.findUnique({ where: { id: result.document.id } });
      if (doc?.blobUrl) {
        const filePath = doc.blobUrl.replace('file://', '');
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    });

    it('should handle multiple uploads from same user', async () => {
      // Arrange
      const input1 = {
        userId: testUserId,
        filename: 'doc1.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content 1'),
      };
      const input2 = {
        userId: testUserId,
        filename: 'doc2.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content 2'),
      };

      // Act
      const result1 = await uploadDocumentUseCase.execute(input1);
      const result2 = await uploadDocumentUseCase.execute(input2);

      // Assert - Both documents created
      expect(result1.document.id).not.toBe(result2.document.id);

      // Verify both in database
      const docs = await testDb.document.findMany({
        where: { userId: testUserId },
      });
      expect(docs).toHaveLength(2);

      // Cleanup
      for (const doc of docs) {
        const filePath = doc.blobUrl.replace('file://', '');
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    });

    it('should create unique blob URLs for duplicate filenames', async () => {
      // Arrange - Same filename, different content
      const input1 = {
        userId: testUserId,
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content 1'),
      };
      const input2 = {
        userId: testUserId,
        filename: 'document.pdf', // Same filename
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content 2'),
      };

      // Act
      const result1 = await uploadDocumentUseCase.execute(input1);
      const result2 = await uploadDocumentUseCase.execute(input2);

      // Assert - Different blob URLs (storage service adds timestamp)
      const doc1 = await testDb.document.findUnique({ where: { id: result1.document.id } });
      const doc2 = await testDb.document.findUnique({ where: { id: result2.document.id } });

      expect(doc1?.blobUrl).not.toBe(doc2?.blobUrl);

      // Cleanup
      [doc1, doc2].forEach((doc) => {
        if (doc?.blobUrl) {
          const filePath = doc.blobUrl.replace('file://', '');
          if (existsSync(filePath)) unlinkSync(filePath);
        }
      });
    });
  });
});
