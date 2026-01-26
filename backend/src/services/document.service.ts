import { prisma } from '../config/prisma.js';
import { BlobServiceClient } from '@azure/storage-blob';
import { env } from '../config/env.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface CreateDocumentInput {
  userId: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
}

export class DocumentService {
  private blobServiceClient: BlobServiceClient | null = null;

  constructor() {
    // Only initialize Azure client if connection string is not a placeholder
    if (env.AZURE_STORAGE_CONNECTION_STRING && env.AZURE_STORAGE_CONNECTION_STRING !== 'placeholder') {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        env.AZURE_STORAGE_CONNECTION_STRING
      );
    }
  }

  /**
   * Validate uploaded file (type, size, content)
   * @param file - File metadata
   * @returns Validation result
   */
  validateFile(file: { filename: string; mimetype: string; size: number }): FileValidationResult {
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
   * Extract text from PDF buffer
   * @param buffer - PDF file buffer
   * @returns Extracted text
   */
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  /**
   * Extract text from DOCX buffer
   * @param buffer - DOCX file buffer
   * @returns Extracted text
   */
  async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Create document record in database
   * @param input - Document metadata
   * @returns Created document
   */
  async createDocument(input: CreateDocumentInput) {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Document title is required');
    }

    return prisma.document.create({
      data: {
        title: input.title,
        filename: input.filename,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        blobUrl: input.blobUrl,
        status: 'PENDING',
        userId: input.userId,
      },
    });
  }

  /**
   * Upload file to Azure Blob Storage
   * @param filename - File name
   * @param buffer - File buffer
   * @returns Blob URL
   */
  async uploadToBlob(filename: string, buffer: Buffer): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    const containerClient = this.blobServiceClient.getContainerClient(
      env.AZURE_STORAGE_CONTAINER_NAME
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
   * Get document by ID
   * @param documentId - Document UUID
   * @returns Document or null
   */
  async getDocumentById(documentId: string) {
    return prisma.document.findUnique({
      where: { id: documentId },
    });
  }

  /**
   * Get documents by user ID
   * @param userId - User UUID
   * @returns List of documents
   */
  async getDocumentsByUserId(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Update document status
   * @param documentId - Document UUID
   * @param status - New status
   * @param metadata - Optional metadata (pageCount, wordCount, errorMessage)
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    metadata?: {
      pageCount?: number;
      wordCount?: number;
      errorMessage?: string;
    }
  ) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        processedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
        ...metadata,
      },
    });
  }
}
