import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { LocalFileStorageService } from '@infrastructure/storage/LocalFileStorageService.js';

describe('LocalFileStorageService', () => {
  const testStorageDir = './test-uploads';
  let storageService: LocalFileStorageService;

  beforeEach(async () => {
    // Create fresh storage service for each test
    storageService = new LocalFileStorageService(testStorageDir);
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('isConfigured', () => {
    it('should always return true (local storage always available)', () => {
      expect(storageService.isConfigured()).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('should accept valid PDF file', () => {
      const result = storageService.validateFile({
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid DOCX file', () => {
      const result = storageService.validateFile({
        filename: 'test.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2 * 1024 * 1024, // 2MB
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty file', () => {
      const result = storageService.validateFile({
        filename: 'empty.pdf',
        mimetype: 'application/pdf',
        size: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should reject file larger than 10MB', () => {
      const result = storageService.validateFile({
        filename: 'large.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject invalid file type', () => {
      const result = storageService.validateFile({
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('upload', () => {
    it('should upload file and return file:// URL', async () => {
      const buffer = Buffer.from('Test file content');
      const filename = 'test-document.pdf';

      const url = await storageService.upload(filename, buffer);

      // Check URL format
      expect(url).toMatch(/^file:\/\//);
      expect(url).toContain(filename);

      // Verify file exists on disk
      const filePath = url.replace('file://', '');
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const savedContent = await fs.readFile(filePath);
      expect(savedContent.toString()).toBe('Test file content');
    });

    it('should create unique filenames with timestamp', async () => {
      const buffer = Buffer.from('Test content');
      const filename = 'document.pdf';

      const url1 = await storageService.upload(filename, buffer);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const url2 = await storageService.upload(filename, buffer);

      // URLs should be different (different timestamps)
      expect(url1).not.toBe(url2);
    });

    it('should create storage directory if it does not exist', async () => {
      // Ensure directory doesn't exist
      await fs.rm(testStorageDir, { recursive: true, force: true });

      const buffer = Buffer.from('Test content');
      const url = await storageService.upload('test.pdf', buffer);

      // Should succeed and create directory
      expect(url).toMatch(/^file:\/\//);

      // Verify directory was created
      const dirExists = await fs
        .access(testStorageDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });
  });

  describe('download', () => {
    it('should download file by URL', async () => {
      // Upload a file first
      const originalBuffer = Buffer.from('Test file content for download');
      const url = await storageService.upload('test.pdf', originalBuffer);

      // Download the file
      const downloadedBuffer = await storageService.download(url);

      // Verify content matches
      expect(downloadedBuffer.toString()).toBe(originalBuffer.toString());
    });

    it('should throw error for invalid URL format', async () => {
      await expect(storageService.download('http://invalid-url.com/file.pdf')).rejects.toThrow(
        'Invalid file URL'
      );
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentUrl = `file://${path.resolve(testStorageDir, 'non-existent.pdf')}`;

      await expect(storageService.download(nonExistentUrl)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete file by URL', async () => {
      // Upload a file first
      const buffer = Buffer.from('File to delete');
      const url = await storageService.upload('test.pdf', buffer);

      // Verify file exists
      const filePath = url.replace('file://', '');
      let fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Delete the file
      await storageService.delete(url);

      // Verify file is deleted
      fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should not throw error when deleting non-existent file', async () => {
      const nonExistentUrl = `file://${path.resolve(testStorageDir, 'non-existent.pdf')}`;

      // Should not throw (idempotent delete)
      await expect(storageService.delete(nonExistentUrl)).resolves.toBeUndefined();
    });

    it('should throw error for invalid URL format', async () => {
      await expect(storageService.delete('http://invalid-url.com/file.pdf')).rejects.toThrow(
        'Invalid file URL'
      );
    });
  });

  describe('Full workflow', () => {
    it('should support upload → download → delete cycle', async () => {
      const originalContent = 'Full workflow test content';
      const buffer = Buffer.from(originalContent);

      // 1. Upload
      const url = await storageService.upload('workflow-test.pdf', buffer);
      expect(url).toMatch(/^file:\/\//);

      // 2. Download
      const downloadedBuffer = await storageService.download(url);
      expect(downloadedBuffer.toString()).toBe(originalContent);

      // 3. Delete
      await storageService.delete(url);

      // 4. Verify deleted
      await expect(storageService.download(url)).rejects.toThrow();
    });
  });
});
