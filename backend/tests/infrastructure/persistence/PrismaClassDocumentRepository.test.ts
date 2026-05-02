import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { PrismaClassDocumentRepository } from '@infrastructure/persistence/PrismaClassDocumentRepository.js';
import { ClassDocumentMother } from '@tests/helpers/factories/ClassDocumentMother.js';
import { prisma } from '@config/prisma.js';

describe('PrismaClassDocumentRepository Integration Tests', () => {
  let repository: PrismaClassDocumentRepository;
  let testTeacherId: string;
  let testClassId: string;
  let testDocumentId: string;

  beforeEach(async () => {
    repository = PrismaClassDocumentRepository.create(prisma);

    // Create test teacher
    const teacher = await prisma.user.create({
      data: {
        email: `test-teacher-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Teacher',
        password: 'hashed-password',
        role: 'TEACHER',
        provider: 'LOCAL',
      },
    });
    testTeacherId = teacher.id;

    // Create test class
    const classRecord = await prisma.class.create({
      data: {
        teacherId: testTeacherId,
        name: 'Test Class',
        code: `CLASS-${Date.now()}`,
        description: 'Test description',
      },
    });
    testClassId = classRecord.id;

    // Create test document
    const document = await prisma.document.create({
      data: {
        userId: testTeacherId,
        title: 'Test Document',
        filename: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'https://example.com/test.pdf',
        status: 'COMPLETED',
      },
    });
    testDocumentId = document.id;

    // Clean up ClassDocuments before each test
    await prisma.classDocument.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.classDocument.deleteMany({});
  });

  describe('findById', () => {
    it('should find a ClassDocument by id', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });

      await repository.save(classDocument);

      const found = await repository.findById(classDocument.id);

      expect(found).not.toBeNull();
      expect(found?.id.equals(classDocument.id)).toBe(true);
      expect(found?.classId.equals(classDocument.classId)).toBe(true);
      expect(found?.documentId.equals(classDocument.documentId)).toBe(true);
    });

    it('should return null when ClassDocument not found', async () => {
      const found = await repository.findById(new ClassDocumentId(uuidv4()));

      expect(found).toBeNull();
    });
  });

  describe('findByClassAndDocument', () => {
    it('should find by class and document', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });

      await repository.save(classDocument);

      const found = await repository.findByClassAndDocument(
        ClassId.create(testClassId),
        DocumentId.create(testDocumentId)
      );

      expect(found).not.toBeNull();
      expect(found?.id.equals(classDocument.id)).toBe(true);
    });

    it('should return null when relationship does not exist', async () => {
      const found = await repository.findByClassAndDocument(
        ClassId.create(testClassId),
        DocumentId.create(uuidv4())
      );

      expect(found).toBeNull();
    });
  });

  describe('findByClassId', () => {
    it('should find all documents for a class', async () => {
      // Create another document
      const document2 = await prisma.document.create({
        data: {
          userId: testTeacherId,
          title: 'Test Document 2',
          filename: 'test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          blobUrl: 'https://example.com/test2.pdf',
          status: 'COMPLETED',
        },
      });

      const cd1 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
        isVisible: true,
      });
      const cd2 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: document2.id,
        isVisible: false,
      });

      await repository.save(cd1);
      await repository.save(cd2);

      const found = await repository.findByClassId(ClassId.create(testClassId));

      expect(found).toHaveLength(2);
    });

    it('should filter by visible only', async () => {
      // Create another document
      const document2 = await prisma.document.create({
        data: {
          userId: testTeacherId,
          title: 'Test Document 2',
          filename: 'test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          blobUrl: 'https://example.com/test2.pdf',
          status: 'COMPLETED',
        },
      });

      const cd1 = ClassDocumentMother.visible({
        classId: testClassId,
        documentId: testDocumentId,
      });
      const cd2 = ClassDocumentMother.hidden({
        classId: testClassId,
        documentId: document2.id,
      });

      await repository.save(cd1);
      await repository.save(cd2);

      const found = await repository.findByClassId(ClassId.create(testClassId), {
        visibleOnly: true,
      });

      expect(found).toHaveLength(1);
      expect(found[0].isVisible).toBe(true);
    });

    it('should return empty array when class has no documents', async () => {
      const found = await repository.findByClassId(ClassId.create(testClassId));

      expect(found).toHaveLength(0);
    });
  });

  describe('findByDocumentId', () => {
    it('should find all classes for a document', async () => {
      // Create another class
      const class2 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Test Class 2',
          code: `CLASS2-${Date.now()}`,
        },
      });

      const cd1 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });
      const cd2 = ClassDocumentMother.create({
        classId: class2.id,
        documentId: testDocumentId,
      });

      await repository.save(cd1);
      await repository.save(cd2);

      const found = await repository.findByDocumentId(DocumentId.create(testDocumentId));

      expect(found).toHaveLength(2);
    });

    it('should return empty array when document is not shared', async () => {
      const found = await repository.findByDocumentId(DocumentId.create(testDocumentId));

      expect(found).toHaveLength(0);
    });
  });

  describe('isSharedWithClass', () => {
    it('should return true when document is shared with class', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });

      await repository.save(classDocument);

      const isShared = await repository.isSharedWithClass(
        ClassId.create(testClassId),
        DocumentId.create(testDocumentId)
      );

      expect(isShared).toBe(true);
    });

    it('should return false when document is not shared with class', async () => {
      const isShared = await repository.isSharedWithClass(
        ClassId.create(testClassId),
        DocumentId.create(testDocumentId)
      );

      expect(isShared).toBe(false);
    });
  });

  describe('save', () => {
    it('should save a new ClassDocument', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
        isVisible: true,
      });

      await repository.save(classDocument);

      const saved = await prisma.classDocument.findUnique({
        where: { id: classDocument.id.value },
      });

      expect(saved).not.toBeNull();
      expect(saved?.classId).toBe(testClassId);
      expect(saved?.documentId).toBe(testDocumentId);
      expect(saved?.isVisible).toBe(true);
    });

    it('should update an existing ClassDocument', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
        isVisible: false,
      });

      await repository.save(classDocument);

      // Publish the document
      classDocument.publish();
      await repository.save(classDocument);

      const updated = await prisma.classDocument.findUnique({
        where: { id: classDocument.id.value },
      });

      expect(updated?.isVisible).toBe(true);
      expect(updated?.publishedAt).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a ClassDocument', async () => {
      const classDocument = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });

      await repository.save(classDocument);
      await repository.delete(classDocument.id);

      const found = await prisma.classDocument.findUnique({
        where: { id: classDocument.id.value },
      });

      expect(found).toBeNull();
    });
  });

  describe('deleteByClassId', () => {
    it('should delete all ClassDocuments for a class', async () => {
      // Create another document
      const document2 = await prisma.document.create({
        data: {
          userId: testTeacherId,
          title: 'Test Document 2',
          filename: 'test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          blobUrl: 'https://example.com/test2.pdf',
          status: 'COMPLETED',
        },
      });

      const cd1 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });
      const cd2 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: document2.id,
      });

      await repository.save(cd1);
      await repository.save(cd2);

      await repository.deleteByClassId(ClassId.create(testClassId));

      const found = await repository.findByClassId(ClassId.create(testClassId));
      expect(found).toHaveLength(0);
    });
  });

  describe('deleteByDocumentId', () => {
    it('should delete all ClassDocuments for a document', async () => {
      // Create another class
      const class2 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Test Class 2',
          code: `CLASS2-${Date.now()}`,
        },
      });

      const cd1 = ClassDocumentMother.create({
        classId: testClassId,
        documentId: testDocumentId,
      });
      const cd2 = ClassDocumentMother.create({
        classId: class2.id,
        documentId: testDocumentId,
      });

      await repository.save(cd1);
      await repository.save(cd2);

      await repository.deleteByDocumentId(DocumentId.create(testDocumentId));

      const found = await repository.findByDocumentId(DocumentId.create(testDocumentId));
      expect(found).toHaveLength(0);
    });
  });
});
