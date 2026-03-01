import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DownloadDocumentUseCase } from '@application/use-cases/documents/DownloadDocumentUseCase.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import { Document } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

describe('DownloadDocumentUseCase', () => {
  let useCase: DownloadDocumentUseCase;
  let mockDocumentRepository: IDocumentRepository;
  let mockClassDocumentRepository: IClassDocumentRepository;
  let mockStudentEnrollmentRepository: IStudentEnrollmentRepository;
  let mockStorageService: IStorageService;

  const teacherId = '00000000-0000-4000-a000-000000000001';
  const studentId = '00000000-0000-4000-a000-000000000002';
  const classId = '00000000-0000-4000-a000-000000000003';
  const documentId = '00000000-0000-4000-a000-000000000004';

  const mockDocument = {
    id: DocumentId.create(documentId),
    userId: UserId.create(teacherId),
    title: 'Test Document',
    filename: 'test.pdf',
    blobUrl: 'https://storage.blob/test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    status: 'COMPLETED' as const,
    pageCount: 5,
    wordCount: 1000,
    uploadedAt: new Date(),
    processedAt: new Date(),
    isOwnedBy: (userId: UserId) => userId.value === teacherId,
  };

  const mockBuffer = Buffer.from('test file content');

  beforeEach(() => {
    // Create mocks
    mockDocumentRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByUserId: vi.fn(),
      findByStatus: vi.fn(),
      updateStatus: vi.fn(),
      countByUserId: vi.fn(),
    };

    mockClassDocumentRepository = {
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

    mockStudentEnrollmentRepository = {
      findById: vi.fn(),
      findByClassId: vi.fn(),
      findByStudentId: vi.fn(),
      findByClassAndStudent: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByClassId: vi.fn(),
      isStudentEnrolled: vi.fn(),
    };

    mockStorageService = {
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      getDownloadUrl: vi.fn(),
    };

    useCase = new DownloadDocumentUseCase(
      mockDocumentRepository,
      mockClassDocumentRepository,
      mockStudentEnrollmentRepository,
      mockStorageService
    );
  });

  describe('when user is document owner', () => {
    it('should allow download for document owner', async () => {
      // Arrange
      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument as Document);
      vi.mocked(mockStorageService.download).mockResolvedValue(mockBuffer);

      // Act
      const result = await useCase.execute({
        documentId,
        userId: teacherId,
      });

      // Assert
      expect(result).toEqual({
        buffer: mockBuffer,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
      });
      expect(mockStorageService.download).toHaveBeenCalledWith('https://storage.blob/test.pdf');
    });
  });

  describe('when user is student with access through class', () => {
    it('should allow download when document is shared with student class and isVisible=true', async () => {
      // Arrange
      const mockClassDocument = {
        id: ClassDocumentId.create('00000000-0000-4000-a000-000000000010'),
        classId: ClassId.create(classId),
        documentId: DocumentId.create(documentId),
        isVisible: true,
        publishedAt: new Date(),
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClassDocument;

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument as Document);
      vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([
        mockClassDocument,
      ]);
      vi.mocked(mockStudentEnrollmentRepository.isStudentEnrolled).mockResolvedValue(true);
      vi.mocked(mockStorageService.download).mockResolvedValue(mockBuffer);

      // Act
      const result = await useCase.execute({
        documentId,
        userId: studentId,
      });

      // Assert
      expect(result).toEqual({
        buffer: mockBuffer,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
      });
      expect(mockClassDocumentRepository.findByDocumentId).toHaveBeenCalledWith(
        expect.objectContaining({ value: documentId })
      );
      expect(mockStudentEnrollmentRepository.isStudentEnrolled).toHaveBeenCalled();
    });

    it('should deny download when document is shared but isVisible=false', async () => {
      // Arrange
      const mockClassDocument = {
        id: ClassDocumentId.create('00000000-0000-4000-a000-000000000011'),
        classId: ClassId.create(classId),
        documentId: DocumentId.create(documentId),
        isVisible: false, // Document is draft - NOT visible to students
        publishedAt: null,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClassDocument;

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument as Document);
      vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([
        mockClassDocument,
      ]);
      vi.mocked(mockStudentEnrollmentRepository.isStudentEnrolled).mockResolvedValue(true);

      // Act & Assert
      await expect(
        useCase.execute({
          documentId,
          userId: studentId,
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should deny download when student is not enrolled in any class with document', async () => {
      // Arrange
      const mockClassDocument = {
        id: ClassDocumentId.create('00000000-0000-4000-a000-000000000012'),
        classId: ClassId.create(classId),
        documentId: DocumentId.create(documentId),
        isVisible: true,
        publishedAt: new Date(),
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClassDocument;

      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument as Document);
      vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([
        mockClassDocument,
      ]);
      vi.mocked(mockStudentEnrollmentRepository.isStudentEnrolled).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({
          documentId,
          userId: studentId,
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('error cases', () => {
    it('should throw error when document not found', async () => {
      // Arrange
      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          documentId,
          userId: teacherId,
        })
      ).rejects.toThrow('Document not found');
    });

    it('should deny download when user has no access', async () => {
      // Arrange
      vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockDocument as Document);
      vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([]);

      // Act & Assert
      await expect(
        useCase.execute({
          documentId,
          userId: studentId,
        })
      ).rejects.toThrow('Unauthorized');
    });
  });
});
