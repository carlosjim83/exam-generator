/**
 * GetExamUseCase
 * Retrieves an exam with all its questions
 */

import { IExamRepository } from '../../../domain/repositories/IExamRepository.js';
import { ExamId } from '../../../domain/value-objects/ExamId.js';
import { UserId } from '../../../domain/value-objects/UserId.js';

export interface GetExamInput {
  examId: string;
  userId: string;
}

export interface GetExamOutput {
  exam: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  questions: {
    id: string;
    type: string;
    difficulty: string;
    questionText: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
    orderIndex: number;
  }[];
}

export class GetExamUseCase {
  constructor(private examRepository: IExamRepository) {}

  async execute(input: GetExamInput): Promise<GetExamOutput> {
    const examId = ExamId.create(input.examId);
    const userId = UserId.create(input.userId);

    const exam = await this.examRepository.findById(examId);

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Authorization check
    if (exam.userId !== userId.value) {
      throw new Error('Unauthorized: Exam does not belong to user');
    }

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        questionCount: exam.questionCount,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      },
      questions: (exam.questions || []).map((q) => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        orderIndex: q.orderIndex,
      })),
    };
  }
}
