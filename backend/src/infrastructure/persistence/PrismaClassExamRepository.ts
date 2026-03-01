import type { Prisma, PrismaClient } from '@prisma/client';

import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import { ClassExam } from '@domain/entities/ClassExam.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

type ClassExamWithStats = ClassExam & {
  startedCount: number;
  submittedCount: number;
  gradedCount: number;
};

export class PrismaClassExamRepository implements IClassExamRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaClassExamRepository {
    return new PrismaClassExamRepository(prismaClient);
  }

  async findById(id: ClassExamId): Promise<ClassExam | null> {
    const record = await this.prisma.classExam.findUnique({
      where: { id: id.toString() },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByClassId(
    classId: ClassId,
    options?: { publishedOnly?: boolean }
  ): Promise<ClassExam[]> {
    const where: Prisma.ClassExamWhereInput = {
      classId: classId.toString(),
    };

    if (options?.publishedOnly) {
      where.isPublished = true;
    }

    const records = await this.prisma.classExam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  async findByClassIdWithStats(classId: ClassId): Promise<ClassExamWithStats[]> {
    const classExams = await this.prisma.classExam.findMany({
      where: { classId: classId.toString() },
      orderBy: { createdAt: 'desc' },
    });

    const results: ClassExamWithStats[] = [];

    for (const ce of classExams) {
      const [started, submitted, graded] = await Promise.all([
        this.prisma.examAssignment.count({
          where: { classExamId: ce.id, status: 'IN_PROGRESS' },
        }),
        this.prisma.examAssignment.count({
          where: { classExamId: ce.id, status: 'SUBMITTED' },
        }),
        this.prisma.examAssignment.count({
          where: { classExamId: ce.id, status: 'GRADED' },
        }),
      ]);

      const classExamEntity = this.toDomain(ce);
      const result: ClassExamWithStats = Object.assign({}, classExamEntity, {
        startedCount: started,
        submittedCount: submitted,
        gradedCount: graded,
      }) as ClassExamWithStats;

      results.push(result);
    }

    return results;
  }

  async findByStudentId(
    studentId: UserId,
    options?: { publishedOnly?: boolean; availableOnly?: boolean }
  ): Promise<ClassExam[]> {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        studentId: studentId.toString(),
        isActive: true,
      },
      select: { classId: true },
    });

    const classIds = enrollments.map((e) => e.classId);

    if (classIds.length === 0) return [];

    const where: Prisma.ClassExamWhereInput = {
      classId: { in: classIds },
    };

    if (options?.publishedOnly) {
      where.isPublished = true;
    }

    const records = await this.prisma.classExam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let classExams = records.map((record) => this.toDomain(record));

    if (options?.availableOnly) {
      const now = new Date();
      classExams = classExams.filter((ce) => {
        if (!ce.isPublished) return false;
        if (ce.availableAt && ce.availableAt > now) return false;
        return true;
      });
    }

    return classExams;
  }

  async findByClassAndExam(classId: ClassId, examId: string): Promise<ClassExam | null> {
    const record = await this.prisma.classExam.findUnique({
      where: {
        classId_examId: {
          classId: classId.toString(),
          examId,
        },
      },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async existsByClassAndExam(classId: ClassId, examId: string): Promise<boolean> {
    const count = await this.prisma.classExam.count({
      where: {
        classId: classId.toString(),
        examId,
      },
    });

    return count > 0;
  }

  async save(classExam: ClassExam): Promise<void> {
    await this.prisma.classExam.upsert({
      where: { id: classExam.id.toString() },
      update: {
        availableAt: classExam.availableAt,
        dueDate: classExam.dueDate,
        timeLimit: classExam.timeLimit,
        isPublished: classExam.isPublished,
        maxAttempts: classExam.maxAttempts,
        showResultsImmediately: classExam.showResultsImmediately,
        updatedAt: classExam.updatedAt,
      },
      create: {
        id: classExam.id.toString(),
        classId: classExam.classId.toString(),
        examId: classExam.examId,
        teacherId: classExam.teacherId.toString(),
        availableAt: classExam.availableAt,
        dueDate: classExam.dueDate,
        timeLimit: classExam.timeLimit,
        isPublished: classExam.isPublished,
        maxAttempts: classExam.maxAttempts,
        showResultsImmediately: classExam.showResultsImmediately,
        createdAt: classExam.createdAt,
        updatedAt: classExam.updatedAt,
      },
    });
  }

  async delete(id: ClassExamId): Promise<void> {
    await this.prisma.classExam.delete({
      where: { id: id.toString() },
    });
  }

  async countByClassId(classId: ClassId, options?: { publishedOnly?: boolean }): Promise<number> {
    const where: Prisma.ClassExamWhereInput = {
      classId: classId.toString(),
    };

    if (options?.publishedOnly) {
      where.isPublished = true;
    }

    return this.prisma.classExam.count({ where });
  }

  private toDomain(record: {
    id: string;
    classId: string;
    examId: string;
    teacherId: string;
    availableAt: Date | null;
    dueDate: Date | null;
    timeLimit: number | null;
    isPublished: boolean;
    maxAttempts: number;
    showResultsImmediately: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ClassExam {
    return ClassExam.create({
      id: ClassExamId.create(record.id),
      classId: ClassId.create(record.classId),
      examId: record.examId,
      teacherId: UserId.create(record.teacherId),
      availableAt: record.availableAt,
      dueDate: record.dueDate,
      timeLimit: record.timeLimit,
      isPublished: record.isPublished,
      maxAttempts: record.maxAttempts,
      showResultsImmediately: record.showResultsImmediately,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
