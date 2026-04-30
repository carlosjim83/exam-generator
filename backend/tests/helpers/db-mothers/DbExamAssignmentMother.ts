/**
 * ExamAssignment Object Mother
 * Provides pre-configured exam assignment objects for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize assignment creation with different states
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DbExamMother } from './DbExamMother.js';

const prisma = new PrismaClient();

export interface ExamAssignmentMotherOptions {
  id?: string;
  examId?: string;
  studentId?: string;
  teacherId?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  dueDate?: Date;
  startedAt?: Date;
  submittedAt?: Date;
  score?: number;
  feedback?: string;
}

/**
 * ExamAssignment Mother - Creates test assignments in different states
 */
export class DbExamAssignmentMother {
  /**
   * Creates a pending assignment (just assigned, not started)
   */
  static async pending(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'PENDING',
      ...overrides,
    });
  }

  /**
   * Creates an in-progress assignment (student started)
   */
  static async inProgress(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Creates a submitted assignment (student finished, not graded)
   */
  static async submitted(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'SUBMITTED',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      submittedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Creates a graded assignment (complete flow)
   */
  static async graded(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'GRADED',
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      submittedAt: new Date(Date.now() - 3600000), // 1 hour ago
      score: 83.33, // 25/30 = 83.33%
      feedback: 'Good job! You demonstrated solid understanding.',
      ...overrides,
    });
  }

  /**
   * Creates assignment with due date
   */
  static async withDueDate(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
      ...overrides,
    });
  }

  /**
   * Creates overdue assignment
   */
  static async overdue(overrides: Partial<ExamAssignmentMotherOptions> = {}) {
    return this.create({
      status: 'PENDING',
      dueDate: new Date(Date.now() - 86400000), // 1 day ago
      ...overrides,
    });
  }

  /**
   * Base factory method - creates assignment in database
   */
  static async create(options: ExamAssignmentMotherOptions) {
    // Create exam if not provided
    let examId = options.examId;
    let teacherId = options.teacherId;

    if (!examId) {
      const { exam } = await DbExamMother.complete({ userId: teacherId });
      examId = exam.id;
      teacherId = exam.userId;
    }

    const defaults = {
      id: randomUUID(),
      status: 'PENDING' as const,
    };

    const data = { ...defaults, ...options, examId, teacherId };

    if (!data.studentId) {
      throw new Error('studentId is required for ExamAssignment');
    }

    if (!data.teacherId) {
      throw new Error('teacherId is required for ExamAssignment');
    }

    const assignment = await prisma.examAssignment.create({
      data: {
        id: data.id,
        examId: data.examId!,
        studentId: data.studentId,
        teacherId: data.teacherId!,
        status: data.status,
        dueDate: data.dueDate,
        startedAt: data.startedAt,
        submittedAt: data.submittedAt,
        score: data.score,
        feedback: data.feedback,
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    return assignment;
  }

  /**
   * Creates multiple assignments at once
   */
  static async createMany(count: number, options: ExamAssignmentMotherOptions = {}) {
    const promises = Array.from({ length: count }, () => this.create(options));
    return Promise.all(promises);
  }
}
