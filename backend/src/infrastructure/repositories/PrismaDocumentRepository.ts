import type { PrismaClient } from '@prisma/client';

import { Document, DocumentStatus } from '@domain/entities/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentDTO,
  UpdateDocumentStatusDTO,
  UpdateDocumentMetadataDTO,
  QueryDocumentResult, // Added this import
} from '@domain/repositories/IDocumentRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * PrismaDocumentRepository
 * Infrastructure implementation of IDocumentRepository using Prisma ORM
 */
export class PrismaDocumentRepository implements IDocumentRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaDocumentRepository {
    return new PrismaDocumentRepository(prismaClient);
  }

  async findById(id: DocumentId): Promise<Document | null> {
    const document = await this.prisma.document.findUnique({
      where: { id: id.value },
    });

    if (!document) return null;

    return this.toDomain(document);
  }

  async findByUserId(userId: UserId): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: { userId: userId.value },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((doc: any) => this.toDomain(doc));
  }

  async create(data: CreateDocumentDTO): Promise<Document> {
    const document = await this.prisma.document.create({
      data: {
        userId: data.userId.value,
        title: data.title,
        filename: data.filename,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        blobUrl: data.blobUrl,
        status: 'PENDING',
      },
    });

    return this.toDomain(document);
  }

  async updateStatus(id: DocumentId, data: UpdateDocumentStatusDTO): Promise<Document> {
    const document = await this.prisma.document.update({
      where: { id: id.value },
      data: {
        status: data.status,
        pageCount: data.pageCount,
        wordCount: data.wordCount,
        errorMessage: data.errorMessage,
        processedAt:
          data.status === DocumentStatus.COMPLETED || data.status === DocumentStatus.FAILED
            ? new Date()
            : undefined,
      },
    });

    return this.toDomain(document);
  }

  async updateMetadata(id: DocumentId, data: UpdateDocumentMetadataDTO): Promise<Document> {
    const document = await this.prisma.document.update({
      where: { id: id.value },
      data: {
        pageCount: data.pageCount,
        wordCount: data.wordCount,
        processedAt: data.processedAt || new Date(),
      },
    });

    return this.toDomain(document);
  }

  async delete(id: DocumentId): Promise<void> {
    await this.prisma.document.delete({
      where: { id: id.value },
    });
  }

  async deleteChunksByDocumentId(documentId: DocumentId): Promise<void> {
    await this.prisma.documentChunk.deleteMany({
      where: { documentId: documentId.value },
    });
  }

  async exists(id: DocumentId): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id: id.value },
    });

    return count > 0;
  }

  /**
   * Convert Prisma model to Domain Entity
   */
  private toDomain(prismaDocument: any): Document {
    return Document.create({
      id: DocumentId.create(prismaDocument.id),
      userId: UserId.create(prismaDocument.userId),
      title: prismaDocument.title,
      filename: prismaDocument.filename,
      fileSize: prismaDocument.fileSize,
      mimeType: prismaDocument.mimeType,
      blobUrl: prismaDocument.blobUrl,
      status: prismaDocument.status as DocumentStatus,
      pageCount: prismaDocument.pageCount,
      wordCount: prismaDocument.wordCount,
      errorMessage: prismaDocument.errorMessage,
      uploadedAt: prismaDocument.uploadedAt,
      processedAt: prismaDocument.processedAt,
      updatedAt: prismaDocument.updatedAt,
    });
  }

  async searchSimilarChunks(
    documentId: DocumentId,
    queryEmbedding: number[],
    topK: number
  ): Promise<QueryDocumentResult[]> {
    // Convert the number array to a pgvector string format
    const queryEmbeddingString = `[${queryEmbedding.join(',')}]`;

    // Use raw SQL query for pgvector's cosine similarity search
    // The <-> operator computes cosine distance, so we subtract from 1 to get similarity
    const results: {
      id: string;
      content: string;
      chunk_index: number;
      similarity: number;
      word_count: number;
      page_number: number | null;
    }[] = await this.prisma.$queryRaw`
      SELECT
        id,
        content,
        chunk_index,
        (1 - (embedding <=> ${queryEmbeddingString}::vector)) as similarity,
        word_count,
        page_number
      FROM document_chunks
      WHERE document_id = ${documentId.value}
      ORDER BY embedding <=> ${queryEmbeddingString}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => ({
      chunkIndex: r.chunk_index,
      content: r.content,
      similarity: r.similarity,
      wordCount: r.word_count,
      pageNumber: r.page_number,
    }));
  }

  async countByUserId(userId: UserId): Promise<number> {
    return this.prisma.document.count({
      where: { userId: userId.value },
    });
  }

  async findMostRecentByUserId(userId: UserId): Promise<Document | null> {
    const prismaDocument = await this.prisma.document.findFirst({
      where: { userId: userId.value },
      orderBy: { updatedAt: 'desc' },
    });

    if (!prismaDocument) {
      return null;
    }

    return this.toDomain(prismaDocument);
  }
}
