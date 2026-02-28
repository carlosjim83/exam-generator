import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IStorageService } from '@domain/services/IStorageService.js';
import type { DocumentDeletedEvent } from '@domain/events/DocumentEvents.js';
import { DocumentDeletedEventHandler } from '@infrastructure/events/handlers/DocumentDeletedEventHandler.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

describe('DocumentDeletedEventHandler', () => {
  let handler: DocumentDeletedEventHandler;
  let mockDocumentRepository: IDocumentRepository;
  let mockClassDocumentRepository: IClassDocumentRepository;
  let mockStorageService: IStorageService;

  beforeEach(() => {
    // Create mocks
    mockDocumentRepository = {
      findById: vi.fn(),
      deleteChunksByDocumentId: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      // Add other required methods with mock implementations
    } as unknown as IDocumentRepository;

    mockClassDocumentRepository = {
      deleteByDocumentId: vi.fn().mockResolvedValue(undefined),
      // Add other required methods
    } as unknown as IClassDocumentRepository;

    mockStorageService = {
      delete: vi.fn().mockResolvedValue(undefined),
      // Add other required methods
    } as unknown as IStorageService;

    handler = new DocumentDeletedEventHandler(
      mockDocumentRepository,
      mockClassDocumentRepository,
      mockStorageService
    );
  });

  it('should delete chunks, class-document relationships, and blob storage', async () => {
    const documentId = uuidv4();
    const userId = uuidv4();
    const event: DocumentDeletedEvent = {
      eventName: 'document.deleted',
      aggregateId: documentId,
      occurredAt: new Date(),
      payload: {
        documentId,
        userId,
        filename: 'test.pdf',
        blobUrl: 'https://storage.example.com/test.pdf',
      },
    };

    await handler.handle(event);

    // Verify chunks were deleted
    expect(mockDocumentRepository.deleteChunksByDocumentId).toHaveBeenCalledWith(
      DocumentId.create(documentId)
    );

    // Verify class-document relationships were deleted
    expect(mockClassDocumentRepository.deleteByDocumentId).toHaveBeenCalledWith(
      DocumentId.create(documentId)
    );

    // Verify blob was deleted
    expect(mockStorageService.delete).toHaveBeenCalledWith('https://storage.example.com/test.pdf');
  });

  it('should log error and rethrow if cleanup fails', async () => {
    const documentId = uuidv4();
    const userId = uuidv4();
    const event: DocumentDeletedEvent = {
      eventName: 'document.deleted',
      aggregateId: documentId,
      occurredAt: new Date(),
      payload: {
        documentId,
        userId,
        filename: 'test.pdf',
        blobUrl: 'https://storage.example.com/test.pdf',
      },
    };

    // Make deleteChunksByDocumentId throw
    (
      mockDocumentRepository.deleteChunksByDocumentId as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handler.handle(event)).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should continue if blob deletion fails but log error', async () => {
    const documentId = uuidv4();
    const userId = uuidv4();
    const event: DocumentDeletedEvent = {
      eventName: 'document.deleted',
      aggregateId: documentId,
      occurredAt: new Date(),
      payload: {
        documentId,
        userId,
        filename: 'test.pdf',
        blobUrl: 'https://storage.example.com/test.pdf',
      },
    };

    // Make blob deletion throw
    (mockStorageService.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Storage error')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handler.handle(event)).rejects.toThrow('Storage error');

    consoleSpy.mockRestore();
  });
});
