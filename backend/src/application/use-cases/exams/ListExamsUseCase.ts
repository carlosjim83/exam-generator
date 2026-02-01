/**
 * ListExamsUseCase
 * Lists all exams for a user
 */

import { IExamRepository } from '../../../domain/repositories/IExamRepository.js';
import { UserId } from '../../../domain/value-objects/UserId.js';

export interface ListExamsInput {
  userId: string;
}

export interface ListExamsOutput {
  exams: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    createdAt: Date;
  }[];
  total: number;
}

export class ListExamsUseCase {
  constructor(private examRepository: IExamRepository) {}

  async execute(input: ListExamsInput): Promise<ListExamsOutput> {
    const userId = UserId.create(input.userId);

    const exams = await this.examRepository.findByUserId(userId);

    return {
      exams: exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        questionCount: exam.questionCount,
        createdAt: exam.createdAt,
      })),
      total: exams.length,
    };
  }
}
