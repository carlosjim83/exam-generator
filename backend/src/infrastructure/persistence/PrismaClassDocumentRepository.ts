import type { Prisma, PrismaClient } from '@prisma/client';

import { ClassDocument } from '@domain/entities/ClassDocument.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';

/**
 * PrismaClassDocumentRepository
 * Infrastructure implementation of IClassDocumentRepository using Prisma ORM
 */
export class PrismaClassDocumentRepository implements IClassDocumentRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaClassDocumentRepository {
    return new PrismaClassDocumentRepository(prismaClient);
  }

  async findById(id: ClassDocumentId): Promise<ClassDocument | null> {
    const record = await this.prisma.classDocument.findUnique({
      where: { id: id.value },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByClassAndDocument(
    classId: ClassId,
    documentId: DocumentId
  ): Promise<ClassDocument | null> {
    const record = await this.prisma.classDocument.findUnique({
      where: {
        classId_documentId: {
          classId: classId.value,
          documentId: documentId.value,
        },
      },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByClassId(
    classId: ClassId,
    options?: { visibleOnly?: boolean }
  ): Promise<ClassDocument[]> {
    const where: Prisma.ClassDocumentWhereInput = {
      classId: classId.value,
    };

    if (options?.visibleOnly) {
      where.isVisible = true;
    }

    const records = await this.prisma.classDocument.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  async findByDocumentId(documentId: DocumentId): Promise<ClassDocument[]> {
    const records = await this.prisma.classDocument.findMany({
      where: { documentId: documentId.value },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  async isSharedWithClass(classId: ClassId, documentId: DocumentId): Promise<boolean> {
    const count = await this.prisma.classDocument.count({
      where: {
        classId: classId.value,
        documentId: documentId.value,
      },
    });

    return count > 0;
  }

  async save(classDocument: ClassDocument): Promise<void> {
    const data = {
      id: classDocument.id.value,
      classId: classDocument.classId.value,
      documentId: classDocument.documentId.value,
      isVisible: classDocument.isVisible,
      publishedAt: classDocument.publishedAt,
      orderIndex: classDocument.orderIndex,
      createdAt: classDocument.createdAt,
      updatedAt: classDocument.updatedAt,
    };

    await this.prisma.classDocument.upsert({
      where: { id: classDocument.id.value },
      update: {
        isVisible: data.isVisible,
        publishedAt: data.publishedAt,
        orderIndex: data.orderIndex,
        updatedAt: data.updatedAt,
      },
      create: data,
    });
  }

  async delete(id: ClassDocumentId): Promise<void> {
    await this.prisma.classDocument.delete({
      where: { id: id.value },
    });
  }

  async deleteByClassId(classId: ClassId): Promise<void> {
    await this.prisma.classDocument.deleteMany({
      where: { classId: classId.value },
    });
  }

  async deleteByDocumentId(documentId: DocumentId): Promise<void> {
    await this.prisma.classDocument.deleteMany({
      where: { documentId: documentId.value },
    });
  }

  async countByClassId(classId: ClassId, options?: { visibleOnly?: boolean }): Promise<number> {
    const where: Prisma.ClassDocumentWhereInput = {
      classId: classId.value,
    };

    if (options?.visibleOnly) {
      where.isVisible = true;
    }

    return this.prisma.classDocument.count({ where });
  }

  /**
   * Maps Prisma ClassDocument record to domain ClassDocument entity
   */
  private toDomain(record: {
    id: string;
    classId: string;
    documentId: string;
    isVisible: boolean;
    publishedAt: Date | null;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }): ClassDocument {
    return ClassDocument.create({
      id: new ClassDocumentId(record.id),
      classId: ClassId.create(record.classId),
      documentId: DocumentId.create(record.documentId),
      isVisible: record.isVisible,
      publishedAt: record.publishedAt,
      orderIndex: record.orderIndex,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
