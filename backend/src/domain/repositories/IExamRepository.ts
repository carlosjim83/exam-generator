/**
 * IExamRepository - Domain Repository Interface
 * Defines contract for exam persistence operations
 */

import { Exam } from '../entities/Exam.js';
import { ExamId } from '../value-objects/ExamId.js';
import { UserId } from '../value-objects/UserId.js';
import { QuestionType, StorableDifficulty } from '../entities/ExamTypes.js';

export interface CreateExamDTO {
  userId: UserId;
  title: string;
  description?: string;
  generatedFrom: string[]; // Document IDs
  promptUsed?: string;
}

export interface CreateQuestionDTO {
  examId: ExamId;
  type: QuestionType;
  difficulty: StorableDifficulty; // Cannot be MIXED
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  orderIndex: number;
  sourceChunkIds: string[];
}

export interface IExamRepository {
  /**
   * Create a new exam with questions
   */
  create(exam: CreateExamDTO, questions: CreateQuestionDTO[]): Promise<Exam>;

  /**
   * Find an exam by ID (with questions)
   */
  findById(id: ExamId): Promise<Exam | null>;

  /**
   * Find all exams for a user
   */
  findByUserId(userId: UserId): Promise<Exam[]>;

  /**
   * Check if exam exists
   */
  exists(id: ExamId): Promise<boolean>;

  /**
   * Delete an exam (cascade deletes questions)
   */
  delete(id: ExamId): Promise<void>;

  /**
   * Count exams by user
   */
  countByUserId(userId: UserId): Promise<number>;
}
