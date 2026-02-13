/**
 * PrismaExamRepository - Infrastructure Implementation
 * Implements IExamRepository using Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import {
  IExamRepository,
  CreateExamDTO,
  CreateQuestionDTO,
} from '../../domain/repositories/IExamRepository.js';
import { Exam } from '../../domain/entities/Exam.js';
import { Question, QuestionType } from '../../domain/entities/Question.js';
import { StorableDifficulty } from '../../domain/entities/ExamTypes.js';
import { ExamId } from '../../domain/value-objects/ExamId.js';
import { QuestionId } from '../../domain/value-objects/QuestionId.js';
import { UserId } from '../../domain/value-objects/UserId.js';

export class PrismaExamRepository implements IExamRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaExamRepository {
    return new PrismaExamRepository(prismaClient);
  }

  /**
   * Create exam with questions in a transaction
   * Note: Questions are created separately via GenerateExamUseCase
   */
  async create(examData: CreateExamDTO): Promise<Exam> {
    const exam = await this.prisma.exam.create({
      data: {
        userId: examData.userId.value,
        title: examData.title,
        description: examData.description,
        generatedFrom: examData.generatedFrom,
        promptUsed: examData.promptUsed,
      },
    });

    return this.toDomain(exam, []);
  }

  /**
   * Create exam with questions in a transaction (legacy method for GenerateExamUseCase)
   */
  async createWithQuestions(
    examData: CreateExamDTO,
    questionsData: CreateQuestionDTO[]
  ): Promise<Exam> {
    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create exam
      const exam = await tx.exam.create({
        data: {
          userId: examData.userId.value,
          title: examData.title,
          description: examData.description,
          generatedFrom: examData.generatedFrom,
          promptUsed: examData.promptUsed,
        },
      });

      // Create questions
      const questions = await Promise.all(
        questionsData.map((q, index) =>
          tx.question.create({
            data: {
              examId: exam.id,
              type: q.type,
              difficulty: q.difficulty,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: q.points,
              orderIndex: index,
              sourceChunkIds: q.sourceChunkIds,
            },
          })
        )
      );

      return { exam, questions };
    });

    return this.toDomain(result.exam, result.questions);
  }

  /**
   * Update an exam (title, description)
   */
  async update(exam: Exam): Promise<Exam> {
    const updated = await this.prisma.exam.update({
      where: { id: exam.id },
      data: {
        title: exam.title,
        description: exam.description,
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    return this.toDomain(updated, updated.questions);
  }

  /**
   * Find exam by ID (with questions)
   */
  async findById(id: string): Promise<Exam | null> {
    return this.findByIdWithQuestions(id);
  }

  /**
   * Find exam by ID with questions
   */
  async findByIdWithQuestions(id: string): Promise<Exam | null> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!exam) return null;

    return this.toDomain(exam, exam.questions);
  }

  /**
   * Find all exams by user (without questions for performance)
   */
  async findByUserId(userId: string): Promise<Exam[]> {
    const exams = await this.prisma.exam.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } }, // Get question count
      },
    });

    return exams.map((exam: any) =>
      Exam.create({
        id: ExamId.create(exam.id),
        userId: UserId.create(exam.userId),
        title: exam.title,
        description: exam.description ?? undefined,
        generatedFrom: exam.generatedFrom || [],
        promptUsed: exam.promptUsed ?? undefined,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        questions: undefined, // Don't load questions for list
        questionCount: exam._count.questions, // Use count from Prisma
      })
    );
  }

  /**
   * Delete exam (cascade deletes questions)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.exam.delete({
      where: { id },
    });
  }

  /**
   * Check if exam exists (helper method, not in interface)
   */
  async exists(id: ExamId): Promise<boolean> {
    const count = await this.prisma.exam.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  /**
   * Count exams by user (helper method, not in interface)
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.exam.count({
      where: { userId },
    });
  }

  /**
   * Convert Prisma models to Domain entities
   */
  private toDomain(prismaExam: any, prismaQuestions: any[]): Exam {
    const questions = prismaQuestions.map((q) =>
      Question.create({
        id: QuestionId.create(q.id),
        examId: ExamId.create(prismaExam.id),
        type: q.type as QuestionType,
        difficulty: q.difficulty as StorableDifficulty,
        questionText: q.questionText,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        orderIndex: q.orderIndex,
        sourceChunkIds: q.sourceChunkIds || [],
      })
    );

    return Exam.create({
      id: ExamId.create(prismaExam.id),
      userId: UserId.create(prismaExam.userId),
      title: prismaExam.title,
      description: prismaExam.description,
      generatedFrom: prismaExam.generatedFrom || [],
      promptUsed: prismaExam.promptUsed,
      createdAt: prismaExam.createdAt,
      updatedAt: prismaExam.updatedAt,
      questions,
    });
  }
}
