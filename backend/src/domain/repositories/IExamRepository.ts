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
   * Find an exam by ID
   */
  findById(id: string): Promise<Exam | null>;

  /**
   * Find an exam by ID with questions
   */
  findByIdWithQuestions(id: string): Promise<Exam | null>;

  /**
   * Find all exams by user ID
   */
  findByUserId(userId: string): Promise<Exam[]>;

  /**
   * Create a new exam
   */
  create(data: CreateExamDTO): Promise<Exam>;

  /**
   * Update an existing exam
   */
  update(exam: Exam): Promise<Exam>;

  /**
   * Delete an exam
   */
  delete(id: string): Promise<void>;

  /**
   * Count exams by user ID
   */
  countByUserId(userId: string): Promise<number>;
}
