import { EXAM_LIMITS } from '@config/subscription-limits.js';
import { QuestionDifficulty, QuestionType } from '@domain/entities/ExamTypes.js';
import { ConflictError, ValidationError } from '@domain/errors/DomainError.js';
import type { GeneratedQuestion } from '@domain/services/IExamGenerator.js';
import type { ILogger } from '@domain/services/ILogger.js';
import type { CreateQuestionDTO } from '@domain/repositories/IExamRepository.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import type { GenerateExamInput } from '@application/use-cases/exams/GenerateExamUseCase.js';

export interface IExamInputValidator {
  validate(input: GenerateExamInput): void;
  validateGeneratedQuestions(questions: GeneratedQuestion[], expectedCount: number): void;
  mapDifficulty(inputDifficulty: string): QuestionDifficulty;
  mapQuestionTypes(inputTypes: string[]): QuestionType[];
  buildQuestionDTOs(questions: GeneratedQuestion[]): CreateQuestionDTO[];
  buildPromptUsed(input: GenerateExamInput): string;
}

/**
 * ExamInputValidator
 * Pure domain service for validating exam generation inputs.
 * No external dependencies — fully testable in isolation.
 */
export class ExamInputValidator implements IExamInputValidator {
  constructor(private readonly logger?: ILogger) {}

  validate(input: GenerateExamInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Exam title is required');
    }

    if (!input.documentIds || !Array.isArray(input.documentIds)) {
      throw new ValidationError('documentIds must be a non-empty array');
    }

    if (input.documentIds.length === 0) {
      throw new ValidationError('At least one document must be provided');
    }

    if (input.documentIds.length > EXAM_LIMITS.MAX_DOCUMENTS_PER_EXAM) {
      throw new ValidationError(
        `Maximum ${EXAM_LIMITS.MAX_DOCUMENTS_PER_EXAM} documents allowed per exam`
      );
    }

    const uniqueIds = new Set(input.documentIds);
    if (uniqueIds.size !== input.documentIds.length) {
      throw new ConflictError('Duplicate document IDs are not allowed');
    }

    if (
      input.numQuestions < EXAM_LIMITS.MIN_QUESTIONS_PER_EXAM ||
      input.numQuestions > EXAM_LIMITS.MAX_QUESTIONS_PER_EXAM
    ) {
      throw new ValidationError(
        `Number of questions must be between ${EXAM_LIMITS.MIN_QUESTIONS_PER_EXAM} and ${EXAM_LIMITS.MAX_QUESTIONS_PER_EXAM}`
      );
    }

    if (!['EASY', 'MEDIUM', 'HARD', 'MIXED'].includes(input.difficulty)) {
      throw new ValidationError('Invalid difficulty level');
    }

    if (!input.questionTypes || input.questionTypes.length === 0) {
      throw new ValidationError('At least one question type must be specified');
    }

    const validTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
    for (const type of input.questionTypes) {
      if (!validTypes.includes(type)) {
        throw new ValidationError(`Invalid question type: ${type}`);
      }
    }
  }

  validateGeneratedQuestions(questions: GeneratedQuestion[], expectedCount: number): void {
    if (!questions || questions.length === 0) {
      throw new ValidationError('AI generator returned no questions');
    }

    if (questions.length !== expectedCount) {
      this.logger?.warn('Question count mismatch', {
        expected: expectedCount,
        received: questions.length,
      });
    }

    for (const q of questions) {
      if (!q.questionText || q.questionText.trim().length === 0) {
        throw new ValidationError('Generated question is missing question text');
      }
      if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
        throw new ValidationError('Generated question is missing correct answer');
      }
    }
  }

  mapDifficulty(inputDifficulty: string): QuestionDifficulty {
    const difficultyMap: Record<string, QuestionDifficulty> = {
      EASY: QuestionDifficulty.EASY,
      MEDIUM: QuestionDifficulty.MEDIUM,
      HARD: QuestionDifficulty.HARD,
      MIXED: QuestionDifficulty.MIXED,
    };
    return difficultyMap[inputDifficulty] ?? QuestionDifficulty.MEDIUM;
  }

  mapQuestionTypes(inputTypes: string[]): QuestionType[] {
    const questionTypeMap: Record<string, QuestionType> = {
      MULTIPLE_CHOICE: QuestionType.MULTIPLE_CHOICE,
      TRUE_FALSE: QuestionType.TRUE_FALSE,
      SHORT_ANSWER: QuestionType.SHORT_ANSWER,
    };
    return inputTypes.map((t) => questionTypeMap[t]).filter((t): t is QuestionType => Boolean(t));
  }

  buildQuestionDTOs(questions: GeneratedQuestion[]): CreateQuestionDTO[] {
    return questions.map((q, index) => ({
      examId: ExamId.create(),
      type: q.type,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
      orderIndex: index,
      sourceChunkIds: [],
    }));
  }

  buildPromptUsed(input: GenerateExamInput): string {
    return `Generated ${input.numQuestions} ${input.difficulty} questions from ${input.documentIds.length} document(s)`;
  }
}
