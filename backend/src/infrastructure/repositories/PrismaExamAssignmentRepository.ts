import type { PrismaClient } from '@prisma/client';

import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import type {
  IExamAssignmentRepository,
  CreateExamAssignmentDTO,
  FindAssignmentsFilters,
} from '@domain/repositories/IExamAssignmentRepository.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class PrismaExamAssignmentRepository implements IExamAssignmentRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaExamAssignmentRepository {
    return new PrismaExamAssignmentRepository(prismaClient);
  }

  async findById(id: AssignmentId): Promise<ExamAssignment | null> {
    const assignment = await this.prisma.examAssignment.findUnique({
      where: { id: id.value },
    });

    if (!assignment) return null;

    return this.toDomain(assignment);
  }

  async findByExamAndStudent(examId: string, studentId: UserId): Promise<ExamAssignment | null> {
    const assignment = await this.prisma.examAssignment.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: studentId.value,
        },
      },
    });

    if (!assignment) return null;

    return this.toDomain(assignment);
  }

  async findAll(filters: FindAssignmentsFilters): Promise<ExamAssignment[]> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId.value;
    }

    if (filters.teacherId) {
      where.teacherId = filters.teacherId.value;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const assignments = await this.prisma.examAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a: any) => this.toDomain(a));
  }

  async findByClassExamId(classExamId: ClassExamId): Promise<ExamAssignment[]> {
    const assignments = await this.prisma.examAssignment.findMany({
      where: { classExamId: classExamId.value },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a: any) => this.toDomain(a));
  }

  async countByClassExamId(classExamId: ClassExamId): Promise<number> {
    return this.prisma.examAssignment.count({
      where: { classExamId: classExamId.value },
    });
  }

  async create(data: CreateExamAssignmentDTO): Promise<ExamAssignment> {
    const assignment = await this.prisma.examAssignment.create({
      data: {
        examId: data.examId,
        studentId: data.studentId.value,
        teacherId: data.teacherId.value,
        status: ExamAssignmentStatus.PENDING,
        dueDate: data.dueDate,
        classExamId: data.classExamId ?? null,
      },
    });

    return this.toDomain(assignment);
  }

  async update(assignment: ExamAssignment): Promise<ExamAssignment> {
    const updated = await this.prisma.examAssignment.update({
      where: { id: assignment.id.value },
      data: {
        status: assignment.status,
        startedAt: assignment.startedAt,
        submittedAt: assignment.submittedAt,
        score: assignment.score,
        feedback: assignment.feedback,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: AssignmentId): Promise<void> {
    await this.prisma.examAssignment.delete({
      where: { id: id.value },
    });
  }

  private toDomain(prismaAssignment: any): ExamAssignment {
    return ExamAssignment.create({
      id: AssignmentId.create(prismaAssignment.id),
      examId: prismaAssignment.examId,
      studentId: UserId.create(prismaAssignment.studentId),
      teacherId: UserId.create(prismaAssignment.teacherId),
      status: prismaAssignment.status as ExamAssignmentStatus,
      dueDate: prismaAssignment.dueDate,
      startedAt: prismaAssignment.startedAt,
      submittedAt: prismaAssignment.submittedAt,
      score: prismaAssignment.score,
      feedback: prismaAssignment.feedback,
      createdAt: prismaAssignment.createdAt,
      updatedAt: prismaAssignment.updatedAt,
    });
  }
}
