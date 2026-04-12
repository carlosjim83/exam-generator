import type { PrismaClient } from '@prisma/client';

import { StudentAnswer } from '@domain/entities/StudentAnswer.js';
import type {
  IStudentAnswerRepository,
  CreateStudentAnswerDTO,
} from '@domain/repositories/IStudentAnswerRepository.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

export class PrismaStudentAnswerRepository implements IStudentAnswerRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaStudentAnswerRepository {
    return new PrismaStudentAnswerRepository(prismaClient);
  }

  async findById(id: string): Promise<StudentAnswer | null> {
    const answer = await this.prisma.studentAnswer.findUnique({
      where: { id },
    });

    if (!answer) return null;

    return this.toDomain(answer);
  }

  async findByAssignment(assignmentId: AssignmentId): Promise<StudentAnswer[]> {
    const answers = await this.prisma.studentAnswer.findMany({
      where: { assignmentId: assignmentId.value },
      orderBy: { createdAt: 'asc' },
    });

    return answers.map((a: any) => this.toDomain(a));
  }

  async findByAssignmentAndQuestion(
    assignmentId: AssignmentId,
    questionId: string
  ): Promise<StudentAnswer | null> {
    const answer = await this.prisma.studentAnswer.findUnique({
      where: {
        assignmentId_questionId: {
          assignmentId: assignmentId.value,
          questionId,
        },
      },
    });

    if (!answer) return null;

    return this.toDomain(answer);
  }

  async create(data: CreateStudentAnswerDTO): Promise<StudentAnswer> {
    const answer = await this.prisma.studentAnswer.create({
      data: {
        assignmentId: data.assignmentId.value,
        questionId: data.questionId,
        answerText: data.answerText,
        isCorrect: data.isCorrect ?? null,
      },
    });

    return this.toDomain(answer);
  }

  async update(answer: StudentAnswer): Promise<StudentAnswer> {
    const updated = await this.prisma.studentAnswer.update({
      where: { id: answer.id },
      data: {
        answerText: answer.answerText,
        isCorrect: answer.isCorrect,
      },
    });

    return this.toDomain(updated);
  }

  async upsert(data: CreateStudentAnswerDTO): Promise<StudentAnswer> {
    const answer = await this.prisma.studentAnswer.upsert({
      where: {
        assignmentId_questionId: {
          assignmentId: data.assignmentId.value,
          questionId: data.questionId,
        },
      },
      update: {
        answerText: data.answerText,
        isCorrect: data.isCorrect ?? null,
      },
      create: {
        assignmentId: data.assignmentId.value,
        questionId: data.questionId,
        answerText: data.answerText,
        isCorrect: data.isCorrect ?? null,
      },
    });

    return this.toDomain(answer);
  }

  async deleteByAssignment(assignmentId: AssignmentId): Promise<void> {
    await this.prisma.studentAnswer.deleteMany({
      where: { assignmentId: assignmentId.value },
    });
  }

  private toDomain(prismaAnswer: any): StudentAnswer {
    return StudentAnswer.create({
      id: prismaAnswer.id,
      assignmentId: AssignmentId.create(prismaAnswer.assignmentId),
      questionId: prismaAnswer.questionId,
      answerText: prismaAnswer.answerText,
      isCorrect: prismaAnswer.isCorrect,
      createdAt: prismaAnswer.createdAt,
      updatedAt: prismaAnswer.updatedAt,
    });
  }
}
