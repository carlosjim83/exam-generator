/**
 * Exam Object Mother
 * Provides pre-configured exam objects for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize exam creation with related questions
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DocumentMother } from './DocumentMother.js';

const prisma = new PrismaClient();

export interface ExamMotherOptions {
  id?: string;
  userId?: string;
  title?: string;
  description?: string;
  generatedFrom?: string[];
  promptUsed?: string;
  questionCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Exam Mother - Creates test exams with questions
 */
export class ExamMother {
  /**
   * Creates a complete exam with 3 multiple-choice questions (default)
   */
  static async complete(overrides: Partial<ExamMotherOptions> = {}) {
    return this.create({
      title: 'Complete Test Exam',
      description: 'A complete exam with multiple questions',
      questionCount: 3,
      ...overrides,
    });
  }

  /**
   * Creates a short exam (1 question)
   */
  static async short(overrides: Partial<ExamMotherOptions> = {}) {
    return this.create({
      title: 'Short Test Exam',
      description: 'A short exam with one question',
      questionCount: 1,
      ...overrides,
    });
  }

  /**
   * Creates a long exam (10 questions)
   */
  static async long(overrides: Partial<ExamMotherOptions> = {}) {
    return this.create({
      title: 'Long Test Exam',
      description: 'A comprehensive exam with many questions',
      questionCount: 10,
      ...overrides,
    });
  }

  /**
   * Creates an exam without questions (edge case)
   */
  static async empty(overrides: Partial<ExamMotherOptions> = {}) {
    return this.create({
      title: 'Empty Test Exam',
      description: 'An exam with no questions',
      questionCount: 0,
      ...overrides,
    });
  }

  /**
   * Base factory method - creates exam with questions in database
   */
  static async create(options: ExamMotherOptions) {
    const userId = options.userId || randomUUID();

    // Create a mock document if generatedFrom not provided
    let documentIds = options.generatedFrom;
    if (!documentIds || documentIds.length === 0) {
      const document = await DocumentMother.completed({ userId });
      documentIds = [document.id];
    }

    const defaults = {
      id: randomUUID(),
      title: 'Test Exam',
      description: 'A test exam for E2E testing',
      promptUsed: 'Generate test questions from the document',
      questionCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const data = { ...defaults, ...options, userId, generatedFrom: documentIds };

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        id: data.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        generatedFrom: data.generatedFrom,
        promptUsed: data.promptUsed,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    // Create questions
    const questions = [];
    for (let i = 0; i < data.questionCount; i++) {
      const question = await prisma.question.create({
        data: {
          id: randomUUID(),
          examId: exam.id,
          type: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
          questionText: `Question ${i + 1}: What is the correct answer?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is the correct answer because it demonstrates understanding.',
          points: 10,
          orderIndex: i,
          sourceChunkIds: [],
        },
      });
      questions.push(question);
    }

    return {
      exam,
      questions,
      documentIds,
    };
  }

  /**
   * Creates multiple exams at once
   */
  static async createMany(count: number, options: ExamMotherOptions = {}) {
    const promises = Array.from({ length: count }, (_, i) =>
      this.create({
        ...options,
        title: `${options.title || 'Test Exam'} ${i + 1}`,
      })
    );
    return Promise.all(promises);
  }
}
