import type { DocumentId } from '@domain/value-objects/DocumentId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

/**
 * DocumentStatus Enum
 * Represents the processing status of a document
 */
export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * DocumentProps
 * Properties for Document entity
 */
export interface DocumentProps {
  id: DocumentId;
  userId: UserId;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  status: DocumentStatus;
  pageCount: number | null;
  wordCount: number | null;
  errorMessage: string | null;
  uploadedAt: Date;
  processedAt: Date | null;
  updatedAt?: Date; // Optional, defaults to uploadedAt if not provided
}

/**
 * Document Entity
 * Represents an uploaded document in the system
 */
export class Document {
  private constructor(private props: DocumentProps) {
    // Default updatedAt to uploadedAt if not provided
    if (!this.props.updatedAt) {
      this.props.updatedAt = this.props.uploadedAt;
    }
  }

  static create(props: DocumentProps): Document {
    // Validation rules
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Document title is required');
    }

    if (!props.filename || props.filename.trim().length === 0) {
      throw new Error('Document filename is required');
    }

    if (props.fileSize <= 0) {
      throw new Error('Document file size must be greater than zero');
    }

    if (!props.blobUrl || props.blobUrl.trim().length === 0) {
      throw new Error('Document blob URL is required');
    }

    // Validate mime type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(props.mimeType)) {
      throw new Error('Invalid document mime type. Only PDF and DOCX are allowed');
    }

    return new Document(props);
  }

  // Getters
  get id(): DocumentId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get filename(): string {
    return this.props.filename;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get blobUrl(): string {
    return this.props.blobUrl;
  }

  get status(): DocumentStatus {
    return this.props.status;
  }

  get pageCount(): number | null {
    return this.props.pageCount;
  }

  get wordCount(): number | null {
    return this.props.wordCount;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get processedAt(): Date | null {
    return this.props.processedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt || this.props.uploadedAt;
  }

  // Business logic methods
  isPending(): boolean {
    return this.props.status === DocumentStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.props.status === DocumentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.props.status === DocumentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.props.status === DocumentStatus.FAILED;
  }

  isPDF(): boolean {
    return this.props.mimeType === 'application/pdf';
  }

  isDOCX(): boolean {
    return (
      this.props.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  }

  isOwnedBy(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  updateStatus(newStatus: DocumentStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    if (newStatus === DocumentStatus.COMPLETED || newStatus === DocumentStatus.FAILED) {
      this.props.processedAt = new Date(); // Update processedAt if relevant status
    } else if (newStatus === DocumentStatus.PENDING) {
      this.props.processedAt = null; // Clear processedAt if reprocessing
    }
  }

  clearErrorMessage(): void {
    this.props.errorMessage = null;
    this.props.updatedAt = new Date();
  }

  clearProcessingMetadata(): void {
    this.props.pageCount = null;
    this.props.wordCount = null;
    this.props.processedAt = null;
    this.props.updatedAt = new Date();
  }

  // Convert to plain object (for serialization)
  toObject() {
    return {
      id: this.props.id.value,
      userId: this.props.userId.value,
      title: this.props.title,
      filename: this.props.filename,
      fileSize: this.props.fileSize,
      mimeType: this.props.mimeType,
      blobUrl: this.props.blobUrl,
      status: this.props.status,
      pageCount: this.props.pageCount,
      wordCount: this.props.wordCount,
      errorMessage: this.props.errorMessage,
      uploadedAt: this.props.uploadedAt,
      processedAt: this.props.processedAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
