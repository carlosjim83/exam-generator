process.env.AZURE_OPENAI_API_KEY = 'mock-key-for-test';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.JWT_SECRET = 'mock-secret-test';
process.env.JWT_REFRESH_SECRET = 'mock-refresh-secret-test';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { UnshareDocumentUseCase } from '@application/use-cases/documents/UnshareDocumentUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { Class } from '@domain/entities/Class.js';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
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

describe('UnshareDocumentUseCase', () => {
  let useCase: UnshareDocumentUseCase;
  let teacherId: string;
  let classId: string;
  let documentId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UnshareDocumentUseCase(
      mockClassDocumentRepository,
      mockDocumentRepository,
      mockClassRepository
    );
    teacherId = uuidv4();
    classId = uuidv4();
    documentId = uuidv4();
  });

  it('should unshare a document from a class', async () => {
    // Arrange
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, teacherId);
    const classDocument = createMockClassDocument(classId, documentId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockClassDocumentRepository.findByClassAndDocument).mockResolvedValue(classDocument);
    vi.mocked(mockClassDocumentRepository.delete).mockResolvedValue();

    // Act
    await useCase.execute({ documentId, classId, userId: teacherId });

    // Assert
    expect(mockClassDocumentRepository.delete).toHaveBeenCalledWith(classDocument.id);
  });

  it('should throw error if document not found', async () => {
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'Document not found'
    );
  });

  it('should throw error if document does not belong to user', async () => {
    const otherUserId = uuidv4();
    const document = createMockDocument(documentId, otherUserId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'You do not have permission'
    );
  });

  it('should throw error if class not found', async () => {
    const document = createMockDocument(documentId, teacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'Class not found'
    );
  });

  it('should throw error if class does not belong to user', async () => {
    const otherTeacherId = uuidv4();
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, otherTeacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'You do not have permission'
    );
  });

  it('should throw error if document is not shared with class', async () => {
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, teacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockClassDocumentRepository.findByClassAndDocument).mockResolvedValue(null);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'Document is not shared with this class'
    );
  });
});

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

function createMockClassDocument(classId: string, documentId: string): ClassDocument {
  return ClassDocument.create({
    id: new ClassDocumentId(),
    classId: ClassId.create(classId),
    documentId: DocumentId.create(documentId),
    isVisible: true,
  });
}
