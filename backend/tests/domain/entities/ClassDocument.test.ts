import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

describe('ClassDocument Entity', () => {
  // Generate valid v4 UUIDs for testing
  const classDocumentId = new ClassDocumentId(uuidv4());
  const classId = new ClassId(uuidv4());
  const documentId = DocumentId.create(uuidv4());

  describe('create', () => {
    it('should create a ClassDocument with required fields', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
      });

      expect(classDocument.id.equals(classDocumentId)).toBe(true);
      expect(classDocument.classId.equals(classId)).toBe(true);
      expect(classDocument.documentId.equals(documentId)).toBe(true);
      expect(classDocument.isVisible).toBe(false); // Default is false (draft)
      expect(classDocument.publishedAt).toBeNull();
      expect(classDocument.orderIndex).toBe(0); // Default order
    });

    it('should create a ClassDocument with visibility set to true', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: true,
      });

      expect(classDocument.isVisible).toBe(true);
      expect(classDocument.publishedAt).toBeInstanceOf(Date);
    });

    it('should create a ClassDocument with custom order index', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        orderIndex: 5,
      });

      expect(classDocument.orderIndex).toBe(5);
    });

    it('should throw error if classId is missing', () => {
      expect(() =>
        ClassDocument.create({
          id: classDocumentId,
          classId: undefined as unknown as ClassId,
          documentId,
        })
      ).toThrow('ClassId is required');
    });

    it('should throw error if documentId is missing', () => {
      expect(() =>
        ClassDocument.create({
          id: classDocumentId,
          classId,
          documentId: undefined as unknown as DocumentId,
        })
      ).toThrow('DocumentId is required');
    });
  });

  describe('publish', () => {
    it('should set isVisible to true and set publishedAt', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: false,
      });

      expect(classDocument.isVisible).toBe(false);
      expect(classDocument.publishedAt).toBeNull();

      classDocument.publish();

      expect(classDocument.isVisible).toBe(true);
      expect(classDocument.publishedAt).toBeInstanceOf(Date);
    });

    it('should not change publishedAt if already set', () => {
      const originalDate = new Date('2025-01-01');
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: true,
        publishedAt: originalDate,
      });

      classDocument.publish();

      expect(classDocument.publishedAt).toEqual(originalDate);
    });
  });

  describe('unpublish', () => {
    it('should set isVisible to false', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: true,
      });

      classDocument.unpublish();

      expect(classDocument.isVisible).toBe(false);
    });

    it('should keep publishedAt unchanged', () => {
      const originalDate = new Date('2025-01-01');
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: true,
        publishedAt: originalDate,
      });

      classDocument.unpublish();

      expect(classDocument.publishedAt).toEqual(originalDate);
    });
  });

  describe('updateOrder', () => {
    it('should update order index', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        orderIndex: 0,
      });

      classDocument.updateOrder(10);

      expect(classDocument.orderIndex).toBe(10);
    });

    it('should throw error for negative order index', () => {
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
      });

      expect(() => classDocument.updateOrder(-1)).toThrow('Order index cannot be negative');
    });
  });

  describe('toObject', () => {
    it('should return plain object representation', () => {
      const publishedAt = new Date();
      const classDocument = ClassDocument.create({
        id: classDocumentId,
        classId,
        documentId,
        isVisible: true,
        publishedAt,
        orderIndex: 5,
      });

      const obj = classDocument.toObject();

      expect(obj).toEqual({
        id: classDocumentId.value,
        classId: classId.value,
        documentId: documentId.value,
        isVisible: true,
        publishedAt: publishedAt.toISOString(),
        orderIndex: 5,
      });
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const cd1 = ClassDocument.create({ id: classDocumentId, classId, documentId });
      const cd2 = ClassDocument.create({ id: classDocumentId, classId, documentId });

      expect(cd1.equals(cd2)).toBe(true);
    });

    it('should return false for different id', () => {
      const cd1 = ClassDocument.create({ id: classDocumentId, classId, documentId });
      const cd2 = ClassDocument.create({
        id: new ClassDocumentId(),
        classId,
        documentId,
      });

      expect(cd1.equals(cd2)).toBe(false);
    });
  });
});
