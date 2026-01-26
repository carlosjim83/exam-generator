/**
 * FileValidationResult
 * Result of file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * FileMetadata
 * Metadata for an uploaded file
 */
export interface FileMetadata {
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * IStorageService Interface (Port)
 * Defines cloud storage operations (Azure Blob Storage)
 * Implementation is in infrastructure layer
 */
export interface IStorageService {
  /**
   * Validate uploaded file (type, size, content)
   * @param file - File metadata
   * @returns Validation result
   */
  validateFile(file: FileMetadata): FileValidationResult;

  /**
   * Upload file to cloud storage
   * @param filename - File name
   * @param buffer - File buffer
   * @returns Storage URL
   */
  upload(filename: string, buffer: Buffer): Promise<string>;

  /**
   * Download file from cloud storage
   * @param url - Storage URL
   * @returns File buffer
   */
  download(url: string): Promise<Buffer>;

  /**
   * Delete file from cloud storage
   * @param url - Storage URL
   */
  delete(url: string): Promise<void>;

  /**
   * Check if storage is configured
   */
  isConfigured(): boolean;
}
