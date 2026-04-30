import type {
  QuestionDifficulty,
  QuestionType,
  StorableDifficulty,
} from '@domain/entities/ExamTypes.js';

/**
 * IExamGenerator Interface (Port)
 *
 * Abstraction for AI-powered exam question generation.
 * Implementation is in the infrastructure layer (e.g., Genkit + GPT-4o flow).
 */

export interface GeneratedQuestion {
  type: QuestionType;
  difficulty: StorableDifficulty;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface GenerateExamInput {
  context: string;
  numQuestions: number;
  difficulty: QuestionDifficulty;
  questionTypes: QuestionType[];
}

export interface GenerateExamOutput {
  questions: GeneratedQuestion[];
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface IExamGenerator {
  /**
   * Generate exam questions from RAG context using AI.
   */
  generate(input: GenerateExamInput): Promise<GenerateExamOutput>;
}
