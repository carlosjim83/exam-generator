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
import { Document, DocumentStatus } from '@domain/entities/Document.js';
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
    const document = createMockDocument(documentId, teacherId);
    const classDocument = createMockClassDocument(classId, documentId, true);
    const enrollment = createMockEnrollment(classId, studentId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(enrollment);

    const result = await useCase.execute({ documentId, studentId });

    expect(result.downloadUrl).toBe(document.blobUrl);
    expect(result.filename).toBe('test.pdf');
    expect(result.expiresIn).toBe(3600);
  });

  it('should throw error if document not found', async () => {
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow('Document not found');
  });

  it('should throw error if document is not completed', async () => {
    const document = createMockDocument(documentId, teacherId, DocumentStatus.PENDING);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'Document is not ready for download'
    );
  });

  it('should throw error if document not publicly available', async () => {
    const document = createMockDocument(documentId, teacherId);
    const classDocument = createMockClassDocument(classId, documentId, false); // Not visible

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'This document is not publicly available'
    );
  });

  it('should throw error if student not enrolled', async () => {
    const document = createMockDocument(documentId, teacherId);
    const classDocument = createMockClassDocument(classId, documentId, true);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassDocumentRepository.findByDocumentId).mockResolvedValue([classDocument]);
    vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, studentId })).rejects.toThrow(
      'You do not have access to this document'
    );
  });
});

function createMockDocument(
  id: string,
  userId: string,
  status: DocumentStatus = DocumentStatus.COMPLETED
): Document {
  return Document.create({
    id: DocumentId.create(id),
    userId: UserId.create(userId),
    title: 'Test Document',
    filename: 'test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    blobUrl: 'https://example.com/test.pdf',
    status,
  });
}

function createMockClassDocument(
  classId: string,
  documentId: string,
  isVisible: boolean
): ClassDocument {
  return ClassDocument.create({
    id: new ClassDocumentId(),
    classId: ClassId.create(classId),
    documentId: DocumentId.create(documentId),
    isVisible,
    publishedAt: isVisible ? new Date() : null,
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
