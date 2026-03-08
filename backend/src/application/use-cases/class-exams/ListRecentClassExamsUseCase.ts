/**
 * ListRecentClassExamsUseCase
 * Lists recent class exams for a teacher's dashboard
 */

import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ListRecentClassExamsInput {
  teacherId: string;
  limit?: number;
}

export interface ListRecentClassExamsOutput {
  classExams: {
    id: string;
    examId: string;
    examTitle: string;
    classId: string;
    className: string;
    isPublished: boolean;
    questionCount: number;
    submittedCount: number;
    createdAt: Date;
    dueDate?: Date | null;
  }[];
}

export class ListRecentClassExamsUseCase {
  constructor(private classExamRepository: IClassExamRepository) {}

  async execute(input: ListRecentClassExamsInput): Promise<ListRecentClassExamsOutput> {
    const teacherId = UserId.create(input.teacherId);
    const limit = input.limit ?? 5;

    const classExams = await this.classExamRepository.findRecentByTeacherId(teacherId.value, limit);

    return {
      classExams: classExams.map((ce) => ({
        id: ce.id,
        examId: ce.examId,
        examTitle: ce.examTitle ?? 'Untitled Exam',
        classId: ce.classId,
        className: ce.className ?? 'Unknown Class',
        isPublished: ce.isPublished,
        questionCount: ce.questionCount ?? 0,
        submittedCount: ce.submittedCount,
        createdAt: ce.createdAt,
        dueDate: ce.dueDate,
      })),
    };
  }
}
