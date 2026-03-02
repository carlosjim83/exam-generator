import type { ClassExam } from '@domain/entities/ClassExam.js';
import type { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

/**
 * ClassExam with statistics for teacher view
 */
export interface ClassExamWithStats {
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
  startedCount: number;
  submittedCount: number;
  gradedCount: number;
}

export interface IClassExamRepository {
  /**
   * Find a ClassExam by its ID
   */
  findById(id: ClassExamId): Promise<ClassExam | null>;

  /**
   * Find all exams assigned to a class
   * @param classId - The class ID
   * @param options - Filter options
   */
  findByClassId(classId: ClassId, options?: { publishedOnly?: boolean }): Promise<ClassExam[]>;

  /**
   * Find all exams assigned to a class with stats
   * @param classId - The class ID
   */
  findByClassIdWithStats(classId: ClassId): Promise<ClassExamWithStats[]>;

  /**
   * Find all class exams for a student (through enrollments)
   * @param studentId - The student ID
   * @param options - Filter options
   */
  findByStudentId(
    studentId: UserId,
    options?: { publishedOnly?: boolean; availableOnly?: boolean }
  ): Promise<ClassExam[]>;

  /**
   * Find a specific class-exam relationship
   */
  findByClassAndExam(classId: ClassId, examId: string): Promise<ClassExam | null>;

  /**
   * Check if an exam is already assigned to a class
   */
  existsByClassAndExam(classId: ClassId, examId: string): Promise<boolean>;

  /**
   * Save a ClassExam (create or update)
   */
  save(classExam: ClassExam): Promise<void>;

  /**
   * Delete a ClassExam
   */
  delete(id: ClassExamId): Promise<void>;

  /**
   * Count exams for a class
   */
  countByClassId(classId: ClassId, options?: { publishedOnly?: boolean }): Promise<number>;
}
