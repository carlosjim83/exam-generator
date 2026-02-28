process.env.AZURE_OPENAI_API_KEY = 'mock-key-for-test';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.JWT_SECRET = 'mock-secret-test';
process.env.JWT_REFRESH_SECRET = 'mock-refresh-secret-test';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { GetClassDocumentsForStudentUseCase } from '@application/use-cases/documents/GetClassDocumentsForStudentUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { Class } from '@domain/entities/Class.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';

const mockClassDocumentRepository: IClassDocumentRepository = {
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

const mockDocumentRepository: IDocumentRepository = {
  findById: vi.fn(),
  findByUserId: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  updateMetadata: vi.fn(),
  delete: vi.fn(),
  deleteChunksByDocumentId: vi.fn(),
  exists: vi.fn(),
  countByUserId: vi.fn(),
  findMostRecentByUserId: vi.fn(),
  searchSimilarChunks: vi.fn(),
};

const mockClassRepository: IClassRepository = {
  findById: vi.fn(),
  findByCode: vi.fn(),
  findByTeacherId: vi.fn(),
  findByStudentId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
};

const mockEnrollmentRepository: IStudentEnrollmentRepository = {
  findById: vi.fn(),
  findByClassId: vi.fn(),
  findByStudentId: vi.fn(),
  findByClassAndStudent: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  isStudentEnrolled: vi.fn(),
};

describe('GetClassDocumentsForStudentUseCase', () => {
  let useCase: GetClassDocumentsForStudentUseCase;
  let studentId: string;
  let teacherId: string;
  let classId: string;
  let documentId1: string;
  let documentId2: string;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetClassDocumentsForStudentUseCase(
      mockClassDocumentRepository,
      mockClassRepository,
      mockEnrollmentRepository,
      mockDocumentRepository
    );
    studentId = uuidv4();
    teacherId = uuidv4();
    classId = uuidv4();
    documentId1 = uuidv4();
    documentId2 = uuidv4();
  });

  it('should return class documents for enrolled student', async () => {
    // Arrange
    const classEntity = createMockClass(classId, teacherId);
    const enrollment = createMockEnrollment(classId, studentId);
    const cd1 = createMockClassDocument(classId, documentId1, true, 0);
    const cd2 = createMockClassDocument(classId, documentId2, true, 1);
    const doc1 = createMockDocument(documentId1, teacherId);
    const doc2 = createMockDocument(documentId2, teacherId);

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);
    vi.mocked(mockClassDocumentRepository.findByClassId).mockResolvedValue([cd1, cd2]);
    vi.mocked(mockDocumentRepository.findById)
      .mockResolvedValueOnce(doc1)
      .mockResolvedValueOnce(doc2);

    // Act
    const result = await useCase.execute({ classId, studentId });

    // Assert
    expect(result.class.name).toBe('Test Class');
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].title).toBe('Test Document');
    expect(result.documents[1].title).toBe('Test Document');
  });

  it('should only return visible documents', async () => {
    // Arrange
    const classEntity = createMockClass(classId, teacherId);
    const enrollment = createMockEnrollment(classId, studentId);
    // findByClassId with visibleOnly:true should only return visible docs
    const cd1 = createMockClassDocument(classId, documentId1, true, 0);

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);
    vi.mocked(mockClassDocumentRepository.findByClassId).mockResolvedValue([cd1]);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(
      createMockDocument(documentId1, teacherId)
    );

    // Act
    const result = await useCase.execute({ classId, studentId });

    // Assert
    expect(mockClassDocumentRepository.findByClassId).toHaveBeenCalledWith(expect.any(ClassId), {
      visibleOnly: true,
    });
    expect(result.documents).toHaveLength(1);
  });

  it('should throw error if class not found', async () => {
    vi.mocked(mockClassRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ classId, studentId })).rejects.toThrow('Class not found');
  });

  it('should throw error if student not enrolled', async () => {
    const classEntity = createMockClass(classId, teacherId);

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

    await expect(useCase.execute({ classId, studentId })).rejects.toThrow(
      'You are not enrolled in this class'
    );
  });

  it('should throw error if enrollment is inactive', async () => {
    const classEntity = createMockClass(classId, teacherId);
    const enrollment = createMockEnrollment(classId, studentId);
    enrollment.leave(); // Make inactive

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);

    await expect(useCase.execute({ classId, studentId })).rejects.toThrow(
      'You are not enrolled in this class'
    );
  });

  it('should sort documents by orderIndex', async () => {
    // Arrange
    const classEntity = createMockClass(classId, teacherId);
    const enrollment = createMockEnrollment(classId, studentId);
    const cd1 = createMockClassDocument(classId, documentId1, true, 5); // Higher order
    const cd2 = createMockClassDocument(classId, documentId2, true, 2); // Lower order
    const doc1 = createMockDocument(documentId1, teacherId);
    const doc2 = createMockDocument(documentId2, teacherId);

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);
    vi.mocked(mockClassDocumentRepository.findByClassId).mockResolvedValue([cd1, cd2]);
    vi.mocked(mockDocumentRepository.findById)
      .mockResolvedValueOnce(doc1)
      .mockResolvedValueOnce(doc2);

    // Act
    const result = await useCase.execute({ classId, studentId });

    // Assert - should be sorted by orderIndex (2 first, then 5)
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].orderIndex).toBe(2);
    expect(result.documents[1].orderIndex).toBe(5);
  });
});

// Helper functions
function createMockClass(id: string, teacherId: string): Class {
  return new Class(
    ClassId.create(id),
    UserId.create(teacherId),
    'Test Class',
    'TEST123',
    'Test description',
    '#FF0000'
  );
}

function createMockDocument(id: string, userId: string): Document {
  return Document.create({
    id: DocumentId.create(id),
    userId: UserId.create(userId),
    title: 'Test Document',
    filename: 'test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    blobUrl: 'https://example.com/test.pdf',
    status: DocumentStatus.COMPLETED,
  });
}

function createMockEnrollment(classId: string, studentId: string): StudentEnrollment {
  return new StudentEnrollment(
    new EnrollmentId(),
    ClassId.create(classId),
    UserId.create(studentId),
    new Date(),
    null,
    true
  );
}

function createMockClassDocument(
  classId: string,
  documentId: string,
  isVisible: boolean,
  orderIndex: number
): ClassDocument {
  return ClassDocument.create({
    id: new ClassDocumentId(),
    classId: ClassId.create(classId),
    documentId: DocumentId.create(documentId),
    isVisible,
    publishedAt: isVisible ? new Date() : null,
    orderIndex,
  });
}
