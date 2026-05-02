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
import { Class } from '@domain/entities/Class.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { DocumentMother } from '@tests/helpers/factories/DocumentMother.js';
import { ClassDocumentMother } from '@tests/helpers/factories/ClassDocumentMother.js';
import { ClassMother } from '@tests/helpers/factories/ClassMother.js';
import { StudentEnrollmentMother } from '@tests/helpers/factories/StudentEnrollmentMother.js';

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
    const classEntity = ClassMother.withTeacher(teacherId, { id: classId });
    const enrollment = StudentEnrollmentMother.active({ classId, studentId });
    const cd1 = ClassDocumentMother.visible({ classId, documentId: documentId1, orderIndex: 0 });
    const cd2 = ClassDocumentMother.visible({ classId, documentId: documentId2, orderIndex: 1 });
    const doc1 = DocumentMother.completed({ id: documentId1, userId: teacherId });
    const doc2 = DocumentMother.completed({ id: documentId2, userId: teacherId });

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);
    vi.mocked(mockClassDocumentRepository.findByClassId).mockResolvedValue([cd1, cd2]);
    vi.mocked(mockDocumentRepository.findById)
      .mockResolvedValueOnce(doc1)
      .mockResolvedValueOnce(doc2);

    // Act
    const result = await useCase.execute({ classId, studentId });

    // Assert
    expect(result.class.name).toBe('Math 101');
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].title).toBe('Test Document');
    expect(result.documents[1].title).toBe('Test Document');
  });

  it('should only return visible documents', async () => {
    // Arrange
    const classEntity = ClassMother.withTeacher(teacherId, { id: classId });
    const enrollment = StudentEnrollmentMother.active({ classId, studentId });
    // findByClassId with visibleOnly:true should only return visible docs
    const cd1 = ClassDocumentMother.visible({ classId, documentId: documentId1, orderIndex: 0 });

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);
    vi.mocked(mockClassDocumentRepository.findByClassId).mockResolvedValue([cd1]);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(
      DocumentMother.completed({ id: documentId1, userId: teacherId })
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
    const classEntity = ClassMother.withTeacher(teacherId, { id: classId });

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

    await expect(useCase.execute({ classId, studentId })).rejects.toThrow(
      'You are not enrolled in this class'
    );
  });

  it('should throw error if enrollment is inactive', async () => {
    const classEntity = ClassMother.withTeacher(teacherId, { id: classId });
    const enrollment = StudentEnrollmentMother.inactive({ classId, studentId });

    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);

    await expect(useCase.execute({ classId, studentId })).rejects.toThrow(
      'You are not enrolled in this class'
    );
  });

  it('should sort documents by orderIndex', async () => {
    // Arrange
    const classEntity = ClassMother.withTeacher(teacherId, { id: classId });
    const enrollment = StudentEnrollmentMother.active({ classId, studentId });
    const cd1 = ClassDocumentMother.visible({ classId, documentId: documentId1, orderIndex: 5 }); // Higher order
    const cd2 = ClassDocumentMother.visible({ classId, documentId: documentId2, orderIndex: 2 }); // Lower order
    const doc1 = DocumentMother.completed({ id: documentId1, userId: teacherId });
    const doc2 = DocumentMother.completed({ id: documentId2, userId: teacherId });

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
