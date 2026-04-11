/**
 * Azure OpenAI Answer Grading Service
 *
 * Implementation of IAnswerGradingService using Azure OpenAI GPT-4o
 * to evaluate short-answer questions.
 */

import { AzureOpenAI } from 'openai';

import { env } from '@config/env.js';
import type {
  GradeAnswerInput,
  GradeAnswerOutput,
  IAnswerGradingService,
} from '@domain/services/IAnswerGradingService.js';

/**
 * Service for grading short-answer questions using Azure OpenAI
 */
export class AzureOpenAIGradingService implements IAnswerGradingService {
  private readonly client: AzureOpenAI;

  constructor() {
    this.client = new AzureOpenAI({
      apiKey: env.AZURE_OPENAI_API_KEY,
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      apiVersion: env.AZURE_OPENAI_API_VERSION,
      deployment: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
    });
  }

  /**
   * Grade a student's answer using Azure OpenAI
   *
   * @param params - Grading parameters
   * @returns Grading result with score and feedback
   */
  async gradeAnswer(params: GradeAnswerInput): Promise<GradeAnswerOutput> {
    const { questionText, correctAnswer, studentAnswer, points } = params;

    // Handle empty answers immediately
    if (!studentAnswer || studentAnswer.trim().length === 0) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'No answer provided.',
      };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(points),
          },
          {
            role: 'user',
            content: this.buildUserPrompt(questionText, correctAnswer, studentAnswer),
          },
        ],
        temperature: 0.3, // Low temperature for consistent grading
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Azure OpenAI');
      }

      const result = this.parseResponse(content, points);
      return result;
    } catch (error) {
      console.error('Error grading answer with Azure OpenAI:', error);
      // Fallback: if AI fails, return partial credit for non-empty answers
      return this.fallbackGrading(studentAnswer, correctAnswer, points);
    }
  }

  /**
   * Build the system prompt for grading
   */
  private buildSystemPrompt(maxPoints: number): string {
    return `You are an expert teacher grading student answers for short-answer questions.

Your task is to evaluate the student's answer and provide:
1. A score (0 to ${maxPoints})
2. Whether the answer is correct (score >= ${Math.round(maxPoints * 0.8)})
3. Constructive feedback explaining the grade

Grading guidelines:
- Score ${maxPoints}: Perfect or essentially correct answer with key concepts
- Score ${Math.round(maxPoints * 0.7)}-${maxPoints - 1}: Mostly correct with minor errors or omissions
- Score ${Math.round(maxPoints * 0.4)}-${Math.round(maxPoints * 0.6)}: Partially correct, shows some understanding
- Score 0-${Math.round(maxPoints * 0.3)}: Incorrect or shows little understanding

Return ONLY valid JSON with this exact structure:
{
  "score": number,
  "isCorrect": boolean,
  "feedback": "string explaining the grade"
}`;
  }

  /**
   * Build the user prompt with question and answers
   */
  private buildUserPrompt(
    questionText: string,
    correctAnswer: string,
    studentAnswer: string
  ): string {
    return `Question: ${questionText}

Correct Answer (reference): ${correctAnswer}

Student's Answer: ${studentAnswer}

Please evaluate the student's answer and provide the JSON response.`;
  }

  /**
   * Parse the AI response
   */
  private parseResponse(content: string, maxPoints: number): GradeAnswerOutput {
    try {
      const parsed = JSON.parse(content);

      // Validate and normalize
      let score = Math.max(0, Math.min(maxPoints, Number(parsed.score) || 0));
      score = Math.round(score); // Round to nearest integer

      const isCorrect = parsed.isCorrect === true || score >= maxPoints * 0.8;

      return {
        isCorrect,
        score,
        feedback: String(parsed.feedback || 'No feedback provided.'),
      };
    } catch (error) {
      console.error('Error parsing grading response:', error);
      throw new Error('Failed to parse AI grading response');
    }
  }

  /**
   * Fallback grading method when AI fails
   * Uses simple string similarity
   */
  private fallbackGrading(
    studentAnswer: string,
    correctAnswer: string,
    maxPoints: number
  ): GradeAnswerOutput {
    const similarity = this.calculateSimilarity(studentAnswer, correctAnswer);
    const score = Math.round(similarity * maxPoints);

    return {
      isCorrect: score >= maxPoints * 0.8,
      score,
      feedback:
        similarity >= 0.8
          ? 'Correct answer.'
          : 'Partial credit based on similarity to correct answer.',
    };
  }

  /**
   * Calculate simple string similarity (0-1)
   */
  private calculateSimilarity(a: string, b: string): number {
    const aLower = a.toLowerCase().trim();
    const bLower = b.toLowerCase().trim();

    if (aLower === bLower) return 1;

    // Check if one contains the other
    if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;

    // Calculate word overlap
    const aWords = new Set(aLower.split(/\s+/));
    const bWords = new Set(bLower.split(/\s+/));

    const intersection = [...aWords].filter((word) => bWords.has(word));
    const union = new Set([...aWords, ...bWords]);

    return intersection.length / union.size;
  }
}
