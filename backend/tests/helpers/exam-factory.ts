/**
 * Exam Factory Helper
 * Creates exams and questions directly in the database for testing
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface CreateExamOptions {
  userId: string;
  title?: string;
  description?: string;
  questionCount?: number;
}

export interface CreateQuestionOptions {
  examId: string;
  text?: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
  points?: number;
  correctAnswer?: string;
  explanation?: string;
  options?: string[];
}

/**
 * Creates a complete exam with questions for testing
 */
export async function createTestExam(options: CreateExamOptions) {
  const {
    userId,
    title = 'Test Exam',
    description = 'A test exam for E2E testing',
    questionCount = 3,
  } = options;

  // Create a mock document first (exams are generated from documents)
  const document = await prisma.document.create({
    data: {
      id: randomUUID(),
      userId,
      title: 'Test Document',
      filename: 'test.pdf',
      fileUrl: 'http://example.com/test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1000,
      status: 'COMPLETED',
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create exam
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      userId,
      title,
      description,
      generatedFrom: [document.id],
      promptUsed: 'Generate test questions',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create questions
  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const question = await createTestQuestion({
      examId: exam.id,
      text: `Question ${i + 1}: What is the answer?`,
      type: 'MULTIPLE_CHOICE',
      points: 10,
      correctAnswer: 'Option A',
      explanation: 'This is the correct answer because...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
    });
    questions.push(question);
  }

  return {
    exam,
    questions,
    document,
  };
}

/**
 * Creates a single question for an exam
 */
export async function createTestQuestion(options: CreateQuestionOptions) {
  const {
    examId,
    text = 'What is the answer?',
    type = 'MULTIPLE_CHOICE',
    points = 10,
    correctAnswer = 'Option A',
    explanation = 'This is correct',
    options = ['Option A', 'Option B', 'Option C', 'Option D'],
  } = options;

  return prisma.question.create({
    data: {
      id: randomUUID(),
      examId,
      text,
      type,
      points,
      correctAnswer,
      explanation,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Cleanup all test data
 */
export async function cleanupTestExam(examId: string) {
  // Delete in correct order due to foreign keys
  await prisma.question.deleteMany({ where: { examId } });
  await prisma.exam.delete({ where: { id: examId } });
}

/**
 * Get exam with questions
 */
export async function getExamWithQuestions(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: true,
    },
  });
}
