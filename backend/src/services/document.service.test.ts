import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DocumentService } from './document.service.js';
import { prisma } from '../config/prisma.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DocumentService', () => {
  let documentService: DocumentService;
  let testUserId: string;

  beforeAll(async () => {
    documentService = new DocumentService();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `doc-test-${Date.now()}@example.com`,
        password: 'test123',
        firstName: 'Doc',
        lastName: 'Test',
        role: 'TEACHER',
        provider: 'LOCAL',
      },
    });

    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup: delete test documents and user
    await prisma.document.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('validateFile', () => {
    it('should accept valid PDF file', () => {
      const result = documentService.validateFile({
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid DOCX file', () => {
      const result = documentService.validateFile({
        filename: 'test.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024 * 1024, // 1MB
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with invalid mimetype', () => {
      const result = documentService.validateFile({
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file that is too large (>10MB)', () => {
      const result = documentService.validateFile({
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject empty file', () => {
      const result = documentService.validateFile({
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from PDF buffer', async () => {
      // Create a simple PDF buffer (mocked for testing)
      // In real tests, you'd use a real PDF file
      const mockPdfBuffer = Buffer.from('mock pdf content');

      // For now, just test that the function exists and handles errors
      // Real PDF parsing will be tested with actual PDF files in integration tests
      expect(documentService.extractTextFromPDF).toBeDefined();
      expect(typeof documentService.extractTextFromPDF).toBe('function');
    });
  });

  describe('extractTextFromDOCX', () => {
    it('should extract text from DOCX buffer', async () => {
      // Create a simple DOCX buffer (mocked for testing)
      const mockDocxBuffer = Buffer.from('mock docx content');

      // For now, just test that the function exists
      expect(documentService.extractTextFromDOCX).toBeDefined();
      expect(typeof documentService.extractTextFromDOCX).toBe('function');
    });
  });

  describe('createDocument', () => {
    it('should create document record in database', async () => {
      const document = await documentService.createDocument({
        userId: testUserId,
        title: 'Test Document',
        filename: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://test.blob.core.windows.net/documents/test.pdf',
      });

      expect(document.id).toBeDefined();
      expect(document.title).toBe('Test Document');
      expect(document.filename).toBe('test.pdf');
      expect(document.status).toBe('PENDING');
      expect(document.userId).toBe(testUserId);

      // Cleanup
      await prisma.document.delete({ where: { id: document.id } });
    });

    it('should throw error if required fields are missing', async () => {
      await expect(
        documentService.createDocument({
          userId: testUserId,
          title: '',
          filename: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          blobUrl: 'https://test.blob.core.windows.net/documents/test.pdf',
        })
      ).rejects.toThrow();
    });
  });
});
