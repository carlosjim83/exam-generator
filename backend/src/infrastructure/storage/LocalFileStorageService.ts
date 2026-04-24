import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  IStorageService,
  FileValidationResult,
  FileMetadata,
} from '@domain/services/IStorageService.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/**
 * LocalFileStorageService
 * Infrastructure implementation of IStorageService using local filesystem
 *
 * Stores files in a local directory (e.g., ./uploads)
 * Useful for development and testing without cloud dependencies
 */
export class LocalFileStorageService implements IStorageService {
  private readonly storageDir: string;

  constructor(storageDir = './uploads') {
    this.storageDir = path.resolve(storageDir);
  }

  /**
   * Initialize storage directory (create if doesn't exist)
   * Called automatically on first upload
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Check if local storage is configured (always true)
   */
  isConfigured(): boolean {
    return true; // Local storage is always available
  }

  /**
   * Validate uploaded file (type, size, content)
   */
  validateFile(file: FileMetadata): FileValidationResult {
    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check mimetype
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: PDF, DOCX`,
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize filename to prevent path traversal
   * Removes path separators and unsafe characters
   */
  private sanitizeFilename(filename: string): string {
    return path.basename(filename).replaceAll(/[\\/:*?"<>|]/g, '_');
  }

  /**
   * Verify that a resolved path stays within the storage directory
   */
  private assertWithinStorage(targetPath: string): void {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedStorage = path.resolve(this.storageDir);

    const isWithin =
      resolvedTarget === resolvedStorage || resolvedTarget.startsWith(resolvedStorage + path.sep);

    if (!isWithin) {
      throw new Error('Access denied: file path is outside storage directory');
    }
  }

  /**
   * Upload file to local storage
   * @param filename - Original filename
   * @param buffer - File buffer
   * @returns Local file URL (file://path/to/file)
   */
  async upload(filename: string, buffer: Buffer): Promise<string> {
    // Ensure storage directory exists
    await this.ensureStorageDir();

    // Generate unique filename (timestamp + sanitized original filename)
    const timestamp = Date.now();
    const safeFilename = this.sanitizeFilename(filename);
    const uniqueFilename = `${timestamp}-${safeFilename}`;
    const filePath = path.join(this.storageDir, uniqueFilename);

    // Validate the resolved path stays within storage
    this.assertWithinStorage(filePath);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Return file:// URL (compatible with Azure's http:// URL format)
    return `file://${filePath}`;
  }

  /**
   * Download file from local storage
   * @param url - File URL (file://path/to/file)
   * @returns File buffer
   */
  async download(url: string): Promise<Buffer> {
    // Extract file path from file:// URL
    const filePath = this.extractFilePathFromUrl(url);

    // Read file from disk
    const buffer = await fs.readFile(filePath);

    return buffer;
  }

  /**
   * Delete file from local storage
   * @param url - File URL (file://path/to/file)
   */
  async delete(url: string): Promise<void> {
    // Extract file path from file:// URL
    const filePath = this.extractFilePathFromUrl(url);

    // Delete file if it exists
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      // Ignore if file doesn't exist (already deleted)
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Extract file path from file:// URL
   * @param url - File URL (file://path/to/file)
   * @returns Absolute file path
   */
  private extractFilePathFromUrl(url: string): string {
    if (!url.startsWith('file://')) {
      throw new Error(`Invalid file URL: ${url}. Expected format: file://path/to/file`);
    }

    // Remove 'file://' prefix
    const filePath = url.slice('file://'.length);
    const resolvedPath = path.resolve(filePath);

    // Validate the resolved path stays within storage
    this.assertWithinStorage(resolvedPath);

    return resolvedPath;
  }
}
