import { BlobServiceClient } from '@azure/storage-blob';
import { 
  IStorageService, 
  FileValidationResult, 
  FileMetadata 
} from '../../domain/services/IStorageService.js';
import { env } from '../../config/env.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/**
 * AzureBlobStorageService
 * Infrastructure implementation of IStorageService using Azure Blob Storage
 */
export class AzureBlobStorageService implements IStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;

  constructor() {
    this.containerName = env.AZURE_STORAGE_CONTAINER_NAME;

    // Only initialize Azure client if connection string is configured
    if (this.isConfigured()) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        env.AZURE_STORAGE_CONNECTION_STRING
      );
    }
  }

  /**
   * Check if Azure Blob Storage is configured
   */
  isConfigured(): boolean {
    return (
      !!env.AZURE_STORAGE_CONNECTION_STRING &&
      env.AZURE_STORAGE_CONNECTION_STRING !== 'placeholder'
    );
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
   * Upload file to Azure Blob Storage
   */
  async upload(filename: string, buffer: Buffer): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );

    // Ensure container exists
    await containerClient.createIfNotExists();

    // Generate unique blob name (timestamp + original filename)
    const timestamp = Date.now();
    const blobName = `${timestamp}-${filename}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer to blob
    await blockBlobClient.upload(buffer, buffer.length);

    // Return blob URL
    return blockBlobClient.url;
  }

  /**
   * Download file from Azure Blob Storage
   */
  async download(url: string): Promise<Buffer> {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    // Extract blob name from URL
    const blobName = this.extractBlobNameFromUrl(url);

    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Download blob to buffer
    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download file: no stream body');
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * Delete file from Azure Blob Storage
   */
  async delete(url: string): Promise<void> {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    // Extract blob name from URL
    const blobName = this.extractBlobNameFromUrl(url);

    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete blob
    await blockBlobClient.deleteIfExists();
  }

  /**
   * Extract blob name from full URL
   * Example: https://account.blob.core.windows.net/container/blobname
   * Returns: blobname
   */
  private extractBlobNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }
}
