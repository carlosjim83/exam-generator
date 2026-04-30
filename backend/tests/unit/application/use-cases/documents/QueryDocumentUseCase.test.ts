import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { QueryDocumentUseCase } from '@application/use-cases/documents/QueryDocumentUseCase.js';
import type {
  IDocumentRepository,
  QueryDocumentResult,
} from '@domain/repositories/IDocumentRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import type { IEmbeddingService } from '@domain/services/IEmbeddingService.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { AzureOpenAIEmbeddingService } from '@infrastructure/ai/AzureOpenAIEmbeddingService.js';

// Mock the AzureOpenAIEmbeddingService
vi.mock('@infrastructure/ai/AzureOpenAIEmbeddingService.js', () => {
  return {
    AzureOpenAIEmbeddingService: vi.fn(() => ({
      generateEmbeddings: vi.fn(async (texts: string[]) => {
        // Return a dummy embedding for any text
        return texts.map(() => Array.from({ length: 1536 }, () => Math.random()));
      }),
    })),
  };
});

describe('QueryDocumentUseCase', () => {
  let queryDocumentUseCase: QueryDocumentUseCase;
  let mockDocumentRepository: IDocumentRepository;
  let mockEmbeddingService: IEmbeddingService;

  const mockUserId = UserId.create(randomUUID());
  const mockDocumentId = DocumentId.create(randomUUID());

  const mockCompletedDocument = Document.create({
    id: mockDocumentId,
    userId: mockUserId,
    title: 'Test Document for Query',
    filename: 'query-doc.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    blobUrl: 'https://storage.example.com/query-doc.pdf',
    status: DocumentStatus.COMPLETED,
    pageCount: 1,
    wordCount: 100,
    errorMessage: null,
    uploadedAt: new Date(),
    processedAt: new Date(),
  });

  const mockPendingDocument = Document.create({
    id: mockDocumentId,
    userId: mockUserId,
    title: 'Test Document for Query',
    filename: 'query-doc.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    blobUrl: 'https://storage.example.com/query-doc.pdf',
    status: DocumentStatus.PENDING,
    pageCount: null,
    wordCount: null,
    errorMessage: null,
    uploadedAt: new Date(),
    processedAt: null,
  });

  beforeEach(() => {
    mockDocumentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      updateMetadata: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      countByUserId: vi.fn(),
      findMostRecentByUserId: vi.fn(),
      searchSimilarChunks: vi.fn(),
      deleteChunksByDocumentId: vi.fn(),
    };
    // Mock the constructor to return the mocked instance
    mockEmbeddingService = new AzureOpenAIEmbeddingService();

    // Ensure the embedding service mock returns valid data by default
    vi.mocked(mockEmbeddingService.generateEmbeddings).mockResolvedValue([
      Array.from({ length: 1536 }, () => Math.random()),
    ]);

    queryDocumentUseCase = new QueryDocumentUseCase(mockDocumentRepository, mockEmbeddingService);
  });

  it('should return relevant chunks for a given query', async () => {
    // Arrange
    const query = 'What is the main topic?';
    const topK = 2;

    const mockSearchResults: QueryDocumentResult[] = [
      {
        chunkIndex: 0,
        content: 'This document is about TypeScript fundamentals.',
        similarity: 0.95,
        wordCount: 6,
        pageNumber: 1,
      },
      {
        chunkIndex: 1,
        content: 'TypeScript adds static typing to JavaScript.',
        similarity: 0.9,
        wordCount: 6,
        pageNumber: 1,
      },
    ];

    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);
    vi.mocked(mockDocumentRepository.searchSimilarChunks).mockResolvedValue(mockSearchResults);

    // Act
    const result = await queryDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
      query,
      topK,
    });

    // Assert
    expect(mockDocumentRepository.findById).toHaveBeenCalledWith(mockDocumentId);
    // Note: We can't easily assert on the embedding service mock since it's created internally
    // The module mock ensures it returns valid data, so we verify the repository call instead
    expect(mockDocumentRepository.searchSimilarChunks).toHaveBeenCalledWith(
      mockDocumentId,
      expect.any(Array), // Expecting an array (embedding)
      topK
    );

    expect(result.documentId).toBe(mockDocumentId.value);
    expect(result.documentTitle).toBe(mockCompletedDocument.title);
    expect(result.query).toBe(query);
    expect(result.results).toEqual(mockSearchResults);
    expect(result.totalResults).toBe(mockSearchResults.length);
  });

  it('should throw an error if document is not found', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
        query: 'test query',
      })
    ).rejects.toThrow('Document not found');
  });

  it('should throw an error if user does not own the document', async () => {
    // Arrange
    const anotherUserId = UserId.create(randomUUID());
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: anotherUserId.value,
        query: 'test query',
      })
    ).rejects.toThrow('Unauthorized: Document does not belong to user');
  });

  it('should throw an error if document status is not COMPLETED', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockPendingDocument);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
        query: 'test query',
      })
    ).rejects.toThrow(
      `Document is not ready for querying. Current status: ${DocumentStatus.PENDING}`
    );
  });

  it('should throw an error for empty query', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
        query: '   ', // Empty query
      })
    ).rejects.toThrow('Query cannot be empty');
  });

  it('should throw an error for invalid topK value (too low)', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);
    vi.mocked(mockDocumentRepository.searchSimilarChunks).mockResolvedValue([]);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
        query: 'test query',
        topK: 0,
      })
    ).rejects.toThrow('topK must be between 1 and 50');
  });

  it('should throw an error for invalid topK value (too high)', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);

    // Act & Assert
    await expect(
      queryDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
        query: 'test query',
        topK: 51,
      })
    ).rejects.toThrow('topK must be between 1 and 50');
  });

  it('should use default topK if not provided', async () => {
    // Arrange
    const query = 'default topK test';
    const mockSearchResults: QueryDocumentResult[] = [
      {
        chunkIndex: 0,
        content: 'Chunk 1',
        similarity: 0.8,
        wordCount: 2,
        pageNumber: 1,
      },
    ];
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(mockCompletedDocument);
    vi.mocked(mockDocumentRepository.searchSimilarChunks).mockResolvedValue(mockSearchResults);

    // Act
    await queryDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
      query,
    });

    // Assert
    expect(mockDocumentRepository.searchSimilarChunks).toHaveBeenCalledWith(
      mockDocumentId,
      expect.any(Array),
      5 // Default topK is 5
    );
  });
});
