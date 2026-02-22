import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { Class } from '@domain/entities/Class.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClassRepository
 * Infrastructure implementation of IClassRepository using Prisma ORM
 */
export class PrismaClassRepository implements IClassRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaClassRepository {
    return new PrismaClassRepository(prismaClient);
  }

  async save(classEntity: Class): Promise<void> {
    const data = {
      id: classEntity.id.toString(),
      name: classEntity.name,
      description: classEntity.description,
      code: classEntity.code,
      color: classEntity.color,
      teacherId: classEntity.teacherId.toString(),
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt,
    };

    await this.prisma.class.upsert({
      where: { id: classEntity.id.toString() },
      update: {
        name: classEntity.name,
        description: classEntity.description,
        color: classEntity.color,
        updatedAt: classEntity.updatedAt,
      },
      create: data,
    });
  }

  async findById(id: ClassId): Promise<Class | null> {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: id.toString() },
    });

    console.log('findById - DB Record:', classRecord);

    if (!classRecord) return null;

    return this.toDomain(classRecord);
  }

  async findByCode(code: string): Promise<Class | null> {
    const classRecord = await this.prisma.class.findUnique({
      where: { code },
    });

    if (!classRecord) return null;

    return this.toDomain(classRecord);
  }

  async findByTeacherId(
    teacherId: UserId,
    options?: { page?: number; limit?: number; search?: string }
  ): Promise<{ classes: Class[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      teacherId: teacherId.toString(),
    };

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.class.count({ where });

    // Get paginated results
    const classRecords = await this.prisma.class.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      classes: classRecords.map((record) => this.toDomain(record)),
      total,
    };
  }

  async delete(id: ClassId): Promise<void> {
    await this.prisma.class.delete({
      where: { id: id.toString() },
    });
  }

  async existsByCode(code: string, excludeId?: ClassId): Promise<boolean> {
    const where: any = { code };

    if (excludeId) {
      where.id = { not: excludeId.toString() };
    }

    const count = await this.prisma.class.count({ where });

    return count > 0;
  }

  async countStudents(classId: ClassId): Promise<number> {
    return await this.prisma.studentEnrollment.count({
      where: {
        classId: classId.toString(),
        isActive: true,
      },
    });
  }

  async countByTeacherId(teacherId: UserId): Promise<number> {
    return await this.prisma.class.count({
      where: { teacherId: teacherId.toString() },
    });
  }

  /**
   * Maps Prisma Class record to domain Class entity
   */
  private toDomain(record: any): Class {
    return new Class(
      new ClassId(record.id),
      UserId.create(record.teacherId),
      record.name,
      record.code,
      record.description,
      record.color,
      record.createdAt ? new Date(record.createdAt) : new Date()
    );
  }
}
