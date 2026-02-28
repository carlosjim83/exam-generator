process.env.AZURE_OPENAI_API_KEY = 'mock-key-for-test';
process.env.AZURE_OPENAI_ENDPOINT = 'https://mock.openai.azure.com';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.JWT_SECRET = 'mock-secret-test';
process.env.JWT_REFRESH_SECRET = 'mock-refresh-secret-test';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareDocumentWithClassUseCase } from '@application/use-cases/documents/ShareDocumentWithClassUseCase.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { Class } from '@domain/entities/Class.js';
import { ClassDocument } from '@domain/entities/ClassDocument.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { v4 as uuidv4 } from 'uuid';

// Mock repositories
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

describe('ShareDocumentWithClassUseCase', () => {
  let useCase: ShareDocumentWithClassUseCase;
  let teacherId: string;
  let classId: string;
  let documentId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ShareDocumentWithClassUseCase(
      mockClassDocumentRepository,
      mockDocumentRepository,
      mockClassRepository
    );
    teacherId = uuidv4();
    classId = uuidv4();
    documentId = uuidv4();
  });

  it('should share a document with a class', async () => {
    // Arrange
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, teacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockClassDocumentRepository.isSharedWithClass).mockResolvedValue(false);
    vi.mocked(mockClassDocumentRepository.save).mockResolvedValue();

    // Act
    const result = await useCase.execute({
      documentId,
      classId,
      userId: teacherId,
      isVisible: true,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.classId).toBe(classId);
    expect(result.documentId).toBe(documentId);
    expect(result.isVisible).toBe(true);
    expect(mockClassDocumentRepository.save).toHaveBeenCalled();
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
      'You do not have permission to share this document'
    );
  });

  it('should throw error if document is not completed', async () => {
    const document = createMockDocument(documentId, teacherId, DocumentStatus.PENDING);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'Document must be processed before sharing'
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
      'You do not have permission to share to this class'
    );
  });

  it('should throw error if document already shared with class', async () => {
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, teacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockClassDocumentRepository.isSharedWithClass).mockResolvedValue(true);

    await expect(useCase.execute({ documentId, classId, userId: teacherId })).rejects.toThrow(
      'Document is already shared with this class'
    );
  });

  it('should share as hidden (draft) by default', async () => {
    const document = createMockDocument(documentId, teacherId);
    const classEntity = createMockClass(classId, teacherId);

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(document);
    vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
    vi.mocked(mockClassDocumentRepository.isSharedWithClass).mockResolvedValue(false);
    vi.mocked(mockClassDocumentRepository.save).mockResolvedValue();

    const result = await useCase.execute({
      documentId,
      classId,
      userId: teacherId,
    });

    expect(result.isVisible).toBe(false);
  });
});

// Helper functions
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
