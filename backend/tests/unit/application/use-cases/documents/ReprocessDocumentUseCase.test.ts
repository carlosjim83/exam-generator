import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { ReprocessDocumentUseCase } from '@application/use-cases/documents/ReprocessDocumentUseCase.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import { Document, DocumentStatus } from '@domain/entities/Document.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { mockMessageBroker } from '@tests/mocks/mockMessageBroker.js'; // Import the mock

describe('ReprocessDocumentUseCase', () => {
  let reprocessDocumentUseCase: ReprocessDocumentUseCase;
  let mockDocumentRepository: IDocumentRepository;

  const mockUserId = UserId.create(randomUUID());
  const mockDocumentId = DocumentId.create(randomUUID());

  const createMockDocument = (status: DocumentStatus) =>
    Document.create({
      id: mockDocumentId,
      userId: mockUserId,
      title: 'Test Document for Reprocessing',
      filename: 'reprocess-doc.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      blobUrl: 'https://storage.example.com/reprocess-doc.pdf',
      status: status,
      pageCount: status === DocumentStatus.COMPLETED ? 10 : null,
      wordCount: status === DocumentStatus.COMPLETED ? 100 : null,
      errorMessage: status === DocumentStatus.FAILED ? 'Processing failed' : null,
      uploadedAt: new Date(),
      processedAt: status === DocumentStatus.COMPLETED ? new Date() : null,
    });

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test

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
      deleteChunksByDocumentId: vi.fn(), // Mock the new method
    };

    reprocessDocumentUseCase = new ReprocessDocumentUseCase(
      mockDocumentRepository,
      mockMessageBroker
    );
  });

  it('should successfully initiate re-processing for a FAILED document', async () => {
    // Arrange
    const failedDocument = createMockDocument(DocumentStatus.FAILED);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(failedDocument);
    vi.mocked(mockDocumentRepository.updateStatus).mockResolvedValue(
      createMockDocument(DocumentStatus.PENDING) // Simulate update to PENDING
    );
    vi.mocked(mockDocumentRepository.deleteChunksByDocumentId).mockResolvedValue(undefined); // Simulate chunk deletion

    // Act
    const result = await reprocessDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
    });

    // Assert
    expect(mockDocumentRepository.findById).toHaveBeenCalledWith(mockDocumentId);
    expect(mockDocumentRepository.updateStatus).toHaveBeenCalledWith(mockDocumentId, {
      status: DocumentStatus.PENDING,
      errorMessage: null, // Should be cleared
      pageCount: null, // Should be cleared
      wordCount: null, // Should be cleared
      processedAt: null, // Should be cleared
    });
    expect(mockDocumentRepository.deleteChunksByDocumentId).toHaveBeenCalledWith(mockDocumentId);
    expect(mockMessageBroker.publish).toHaveBeenCalledWith('document.uploaded', {
      aggregateId: mockDocumentId.value,
      occurredAt: expect.any(Date),
    });

    expect(result.id).toBe(mockDocumentId.value);
    expect(result.status).toBe(DocumentStatus.PENDING);
    expect(result.message).toBe('Document re-processing initiated successfully.');
  });

  it('should successfully initiate re-processing for a COMPLETED document', async () => {
    // Arrange
    const completedDocument = createMockDocument(DocumentStatus.COMPLETED);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(completedDocument);
    vi.mocked(mockDocumentRepository.updateStatus).mockResolvedValue(
      createMockDocument(DocumentStatus.PENDING) // Simulate update to PENDING
    );
    vi.mocked(mockDocumentRepository.deleteChunksByDocumentId).mockResolvedValue(undefined); // Simulate chunk deletion

    // Act
    const result = await reprocessDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
    });

    // Assert
    expect(mockDocumentRepository.findById).toHaveBeenCalledWith(mockDocumentId);
    expect(mockDocumentRepository.updateStatus).toHaveBeenCalledWith(mockDocumentId, {
      status: DocumentStatus.PENDING,
      errorMessage: null,
      pageCount: null,
      wordCount: null,
      processedAt: null,
    });
    expect(mockDocumentRepository.deleteChunksByDocumentId).toHaveBeenCalledWith(mockDocumentId);
    expect(mockMessageBroker.publish).toHaveBeenCalledWith('document.uploaded', {
      aggregateId: mockDocumentId.value,
      occurredAt: expect.any(Date),
    });

    expect(result.id).toBe(mockDocumentId.value);
    expect(result.status).toBe(DocumentStatus.PENDING);
    expect(result.message).toBe('Document re-processing initiated successfully.');
  });

  it('should throw an error if document is not found', async () => {
    // Arrange
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      reprocessDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
      })
    ).rejects.toThrow('Document not found');
    expect(mockDocumentRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockDocumentRepository.deleteChunksByDocumentId).not.toHaveBeenCalled();
    expect(mockMessageBroker.publish).not.toHaveBeenCalled();
  });

  it('should throw an error if user does not own the document', async () => {
    // Arrange
    const anotherUserId = UserId.create(randomUUID());
    const failedDocument = createMockDocument(DocumentStatus.FAILED);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(failedDocument);

    // Act & Assert
    await expect(
      reprocessDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: anotherUserId.value,
      })
    ).rejects.toThrow('Unauthorized: Document does not belong to user');
    expect(mockDocumentRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockDocumentRepository.deleteChunksByDocumentId).not.toHaveBeenCalled();
    expect(mockMessageBroker.publish).not.toHaveBeenCalled();
  });

  it('should throw an error if document is currently PROCESSING (not stuck)', async () => {
    // Arrange - create a document that was updated recently (not stuck)
    const processingDocument = createMockDocument(DocumentStatus.PROCESSING);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(processingDocument);

    // Act & Assert - should throw because document is actively processing
    await expect(
      reprocessDocumentUseCase.execute({
        documentId: mockDocumentId.value,
        userId: mockUserId.value,
      })
    ).rejects.toThrow('Document is currently being processed');
    expect(mockDocumentRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockDocumentRepository.deleteChunksByDocumentId).not.toHaveBeenCalled();
    expect(mockMessageBroker.publish).not.toHaveBeenCalled();
  });

  it('should allow re-processing for a PROCESSING document that is stuck (>10 minutes)', async () => {
    // Arrange - create a document that has been processing for more than 10 minutes
    const stuckDocument = Document.create({
      id: mockDocumentId,
      userId: mockUserId,
      title: 'Stuck Document',
      filename: 'stuck-doc.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      blobUrl: 'https://storage.example.com/stuck-doc.pdf',
      status: DocumentStatus.PROCESSING,
      pageCount: null,
      wordCount: null,
      errorMessage: null,
      uploadedAt: new Date(Date.now() - 20 * 60 * 1000), // Uploaded 20 minutes ago
      processedAt: null,
      updatedAt: new Date(Date.now() - 15 * 60 * 1000), // Updated 15 minutes ago (stuck)
    });
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(stuckDocument);
    vi.mocked(mockDocumentRepository.updateStatus).mockResolvedValue(
      createMockDocument(DocumentStatus.PENDING)
    );
    vi.mocked(mockDocumentRepository.deleteChunksByDocumentId).mockResolvedValue(undefined);

    // Act
    const result = await reprocessDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
    });

    // Assert
    expect(mockDocumentRepository.updateStatus).toHaveBeenCalledWith(mockDocumentId, {
      status: DocumentStatus.PENDING,
      errorMessage: null,
      pageCount: null,
      wordCount: null,
      processedAt: null,
    });
    expect(result.status).toBe(DocumentStatus.PENDING);
    expect(result.message).toBe('Document re-processing initiated successfully.');
  });

  it('should allow re-processing for a PENDING document (stuck in queue)', async () => {
    // Arrange
    const pendingDocument = createMockDocument(DocumentStatus.PENDING);
    vi.mocked(mockDocumentRepository.findById).mockResolvedValue(pendingDocument);
    vi.mocked(mockDocumentRepository.updateStatus).mockResolvedValue(
      createMockDocument(DocumentStatus.PENDING)
    );
    vi.mocked(mockDocumentRepository.deleteChunksByDocumentId).mockResolvedValue(undefined);

    // Act
    const result = await reprocessDocumentUseCase.execute({
      documentId: mockDocumentId.value,
      userId: mockUserId.value,
    });

    // Assert
    expect(mockDocumentRepository.updateStatus).toHaveBeenCalledWith(mockDocumentId, {
      status: DocumentStatus.PENDING,
      errorMessage: null,
      pageCount: null,
      wordCount: null,
      processedAt: null,
    });
    expect(result.status).toBe(DocumentStatus.PENDING);
    expect(result.message).toBe('Document re-processing initiated successfully.');
  });
});
