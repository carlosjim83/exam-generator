import type {
  IExamGenerator,
  GenerateExamInput,
  GenerateExamOutput,
  GeneratedQuestion,
} from '@domain/services/IExamGenerator.js';
import { generateExamFlow } from './flows/generateExam.flow.js';

/**
 * GenkitExamGenerator
 *
 * Infrastructure adapter for IExamGenerator.
 * Wraps the Genkit flow for AI-powered exam question generation.
 */
export class GenkitExamGenerator implements IExamGenerator {
  async generate(input: GenerateExamInput): Promise<GenerateExamOutput> {
    const result = await generateExamFlow({
      context: input.context,
      numQuestions: input.numQuestions,
      difficulty: input.difficulty,
      questionTypes: input.questionTypes,
    });

    return {
      questions: result.questions as GeneratedQuestion[],
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
    };
  }
}
