import type { ClassDocument } from '@domain/entities/ClassDocument.js';
import type { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * Repository interface for ClassDocument entity
 *
 * Manages the many-to-many relationship between Classes and Documents.
 * Used for sharing documents with students in a class.
 */
export interface IClassDocumentRepository {
  /**
   * Find a ClassDocument by its ID
   */
  findById(id: ClassDocumentId): Promise<ClassDocument | null>;

  /**
   * Find a specific class-document relationship
   */
  findByClassAndDocument(classId: ClassId, documentId: DocumentId): Promise<ClassDocument | null>;

  /**
   * Find all documents shared with a class (for students/teachers)
   * @param classId - The class ID
   * @param options - Filter options
   */
  findByClassId(classId: ClassId, options?: { visibleOnly?: boolean }): Promise<ClassDocument[]>;

  /**
   * Find all classes a document is shared with (for teachers)
   * @param documentId - The document ID
   */
  findByDocumentId(documentId: DocumentId): Promise<ClassDocument[]>;

  /**
   * Check if a document is shared with a class
   */
  isSharedWithClass(classId: ClassId, documentId: DocumentId): Promise<boolean>;

  /**
   * Save a ClassDocument (create or update)
   */
  save(classDocument: ClassDocument): Promise<void>;

  /**
   * Delete a ClassDocument (unshare document from class)
   */
  delete(id: ClassDocumentId): Promise<void>;

  /**
   * Delete all ClassDocuments for a class (when class is deleted)
   */
  deleteByClassId(classId: ClassId): Promise<void>;

  /**
   * Delete all ClassDocuments for a document (when document is deleted)
   */
  deleteByDocumentId(documentId: DocumentId): Promise<void>;
}
