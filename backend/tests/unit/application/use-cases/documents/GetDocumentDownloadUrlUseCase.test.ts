process.env.AZURE_OPENAI_API_KEY = 'mock-key-for-test';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.JWT_SECRET = 'mock-secret-test';
process.env.JWT_REFRESH_SECRET = 'mock-refresh-secret-test';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { GetDocumentDownloadUrlUseCase } from '@application/use-cases/documents/GetDocumentDownloadUrlUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { DocumentMother } from '@tests/helpers/factories/DocumentMother.js';
import { ClassDocumentMother } from '@tests/helpers/factories/ClassDocumentMother.js';
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

const mockEnrollmentRepository: IStudentEnrollmentRepository = {
  findById: vi.fn(),
  findByClassId: vi.fn(),
  findByStudentId: vi.fn(),
  findByClassAndStudent: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  isStudentEnrolled: vi.fn(),
};

describe('GetDocumentDownloadUrlUseCase', () => {
  let useCase: GetDocumentDownloadUrlUseCase;
  let studentId: string;
  let teacherId: string;
  let classId: string;
  let documentId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetDocumentDownloadUrlUseCase(
      mockDocumentRepository,
      mockClassDocumentRepository,
      mockEnrollmentRepository
    );
    studentId = uuidv4();
    teacherId = uuidv4();
    classId = uuidv4();
    documentId = uuidv4();
  });

  it('should return download URL for enrolled student', async () => {
    const document = DocumentMother.completed({ id: documentId, userId: teacherId });
    const classDocument = ClassDocumentMother.visible({ classId, documentId });
    const enrollment = StudentEnrollmentMother.active({ classId, studentId });

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);

    const result = await useCase.execute({ documentId, studentId });

    expect(result.downloadUrl).toBe(document.blobUrl);
    expect(result.filename).toBe(document.filename);
    expect(result.expiresIn).toBe(3600);
  });

  it('should throw error if document not found', async () => {
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow('Document not found');
  });

  it('should throw error if document is not completed', async () => {
    const document = DocumentMother.pending({ id: documentId, userId: teacherId });

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'Document is not ready for download'
    );
  });

  it('should throw error if document not publicly available', async () => {
    const document = DocumentMother.completed({ id: documentId, userId: teacherId });
    const classDocument = ClassDocumentMother.hidden({ classId, documentId }); // Not visible

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'This document is not publicly available'
    );
  });

  it('should throw error if student not enrolled', async () => {
    const document = DocumentMother.completed({ id: documentId, userId: teacherId });
    const classDocument = ClassDocumentMother.visible({ classId, documentId });

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'You do not have access to this document'
    );
  });
});
