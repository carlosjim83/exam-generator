import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateDocumentVisibilityUseCase } from '@application/use-cases/documents/UpdateDocumentVisibilityUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { Class } from '@domain/entities/Class.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { DocumentMother } from '@tests/helpers/factories/DocumentMother.js';
import { ClassDocumentMother } from '@tests/helpers/factories/ClassDocumentMother.js';

describe('UpdateDocumentVisibilityUseCase', () => {
  let useCase: UpdateDocumentVisibilityUseCase;
  let mockClassDocumentRepo: IClassDocumentRepository;
  let mockDocumentRepo: IDocumentRepository;
  let mockClassRepo: IClassRepository;

  const teacherId = '123e4567-e89b-42d3-a456-426614174001';
  const otherUserId = '123e4567-e89b-42d3-a456-426614174002';
  const classId = '123e4567-e89b-42d3-a456-426614174003';
  const documentId = '123e4567-e89b-42d3-a456-426614174004';

  // Helper to create class entity
  const createClass = (ownerId: string): Class => {
    return new Class(
      ClassId.create(classId),
      UserId.create(ownerId),
      'Test Class',
      'TEST101',
      'Test class description',
      null,
      new Date()
    );
  };

  beforeEach(() => {
    mockClassDocumentRepo = {
      findById: vi.fn(),
      findByClassAndDocument: vi.fn(),
      findByClassId: vi.fn(),
      findByDocumentId: vi.fn(),
      isSharedWithClass: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByClassId: vi.fn(),
      deleteByDocumentId: vi.fn(),
    };

    mockDocumentRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByIds: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      updateStatus: vi.fn(),
      markAsCompleted: vi.fn(),
      markAsFailed: vi.fn(),
      findByUserIdWithChunks: vi.fn(),
    };

    mockClassRepo = {
      findById: vi.fn(),
      findByCode: vi.fn(),
      findByTeacherId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };

    useCase = new UpdateDocumentVisibilityUseCase(
      mockClassDocumentRepo,
      mockDocumentRepo,
      mockClassRepo
    );
  });

  describe('Publish document (isVisible: true)', () => {
    it('should publish a shared document', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      const classEntity = createClass(teacherId);
      const classDocument = ClassDocumentMother.hidden({ classId, documentId });

      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassDocumentRepo.findByClassAndDocument).mockResolvedValue(classDocument);
      vi.mocked(mockClassDocumentRepo.save).mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        classId,
        userId: teacherId,
        isVisible: true,
      });

      expect(result.isVisible).toBe(true);
      expect(result.publishedAt).not.toBeNull();
      expect(mockClassDocumentRepo.save).toHaveBeenCalled();
    });

    it('should set publishedAt when publishing for the first time', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      const classEntity = createClass(teacherId);
      const unpublishedDoc = ClassDocumentMother.hidden({ classId, documentId });

      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassDocumentRepo.findByClassAndDocument).mockResolvedValue(unpublishedDoc);
      vi.mocked(mockClassDocumentRepo.save).mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        classId,
        userId: teacherId,
        isVisible: true,
      });

      expect(result.isVisible).toBe(true);
      expect(result.publishedAt).not.toBeNull();
    });
  });

  describe('Unpublish document (isVisible: false)', () => {
    it('should unpublish a shared document', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      const classEntity = createClass(teacherId);
      const publishedDoc = ClassDocumentMother.visible({ classId, documentId });

      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassDocumentRepo.findByClassAndDocument).mockResolvedValue(publishedDoc);
      vi.mocked(mockClassDocumentRepo.save).mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        classId,
        userId: teacherId,
        isVisible: false,
      });

      expect(result.isVisible).toBe(false);
      expect(mockClassDocumentRepo.save).toHaveBeenCalled();
    });
  });

  describe('Authorization', () => {
    it('should throw error if document not found', async () => {
      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId,
          classId,
          userId: teacherId,
          isVisible: true,
        })
      ).rejects.toThrow('Document not found');
    });

    it('should throw error if user is not document owner', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);

      await expect(
        useCase.execute({
          documentId,
          classId,
          userId: otherUserId,
          isVisible: true,
        })
      ).rejects.toThrow('You do not have permission to update this document');
    });

    it('should throw error if class not found', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId,
          classId,
          userId: teacherId,
          isVisible: true,
        })
      ).rejects.toThrow('Class not found');
    });

    it('should throw error if user is not class teacher', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      const classWithOtherTeacher = createClass(otherUserId);
      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(classWithOtherTeacher);

      await expect(
        useCase.execute({
          documentId,
          classId,
          userId: teacherId,
          isVisible: true,
        })
      ).rejects.toThrow('You do not have permission to update visibility for this class');
    });
  });

  describe('Validation', () => {
    it('should throw error if document is not shared with class', async () => {
      const document = DocumentMother.completed({ id: documentId, userId: teacherId });
      const classEntity = createClass(teacherId);
      vi.mocked(mockDocumentRepo.findById).mockResolvedValue(document);
      vi.mocked(mockClassRepo.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassDocumentRepo.findByClassAndDocument).mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId,
          classId,
          userId: teacherId,
          isVisible: true,
        })
      ).rejects.toThrow('Document is not shared with this class');
    });
  });
});
