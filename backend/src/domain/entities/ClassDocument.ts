import type { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * ClassDocument Entity
 *
 * Represents a many-to-many relationship between Class and Document.
 * Teachers can share documents with their classes for students to access.
 *
 * Business rules:
 * - Documents start as invisible (draft) by default
 * - isVisible = true means students can see and download the document
 * - publishedAt is set when document is first published
 * - orderIndex determines display order in the class resources list
 */
export class ClassDocument {
  readonly id: ClassDocumentId;
  readonly classId: ClassId;
  readonly documentId: DocumentId;
  private _isVisible: boolean;
  private _publishedAt: Date | null;
  private _orderIndex: number;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id: ClassDocumentId;
    classId: ClassId;
    documentId: DocumentId;
    isVisible: boolean;
    publishedAt: Date | null;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.classId = props.classId;
    this.documentId = props.documentId;
    this._isVisible = props.isVisible;
    this._publishedAt = props.publishedAt;
    this._orderIndex = props.orderIndex;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: {
    id: ClassDocumentId;
    classId: ClassId;
    documentId: DocumentId;
    isVisible?: boolean;
    publishedAt?: Date | null;
    orderIndex?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): ClassDocument {
    // Validation
    if (!props.classId) {
      throw new Error('ClassId is required');
    }
    if (!props.documentId) {
      throw new Error('DocumentId is required');
    }

    // If isVisible is true and no publishedAt, set it to now
    const isVisible = props.isVisible ?? false;
    const publishedAt = isVisible ? (props.publishedAt ?? new Date()) : (props.publishedAt ?? null);

    return new ClassDocument({
      id: props.id,
      classId: props.classId,
      documentId: props.documentId,
      isVisible,
      publishedAt,
      orderIndex: props.orderIndex ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  // Getters
  get isVisible(): boolean {
    return this._isVisible;
  }

  get publishedAt(): Date | null {
    return this._publishedAt;
  }

  get orderIndex(): number {
    return this._orderIndex;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  publish(): void {
    if (!this._isVisible) {
      this._isVisible = true;
      if (!this._publishedAt) {
        this._publishedAt = new Date();
      }
      this._updatedAt = new Date();
    }
  }

  unpublish(): void {
    this._isVisible = false;
    this._updatedAt = new Date();
  }

  updateOrder(newOrderIndex: number): void {
    if (newOrderIndex < 0) {
      throw new Error('Order index cannot be negative');
    }
    this._orderIndex = newOrderIndex;
    this._updatedAt = new Date();
  }

  // Serialization
  toObject(): {
    id: string;
    classId: string;
    documentId: string;
    isVisible: boolean;
    publishedAt: string | null;
    orderIndex: number;
  } {
    return {
      id: this.id.value,
      classId: this.classId.value,
      documentId: this.documentId.value,
      isVisible: this._isVisible,
      publishedAt: this._publishedAt ? this._publishedAt.toISOString() : null,
      orderIndex: this._orderIndex,
    };
  }

  equals(other: ClassDocument): boolean {
    return this.id.equals(other.id);
  }
}
