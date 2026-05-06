import { AzureOpenAI } from 'openai';
import { z } from 'zod';
import type {
  GradeAnswerInput,
  GradeAnswerOutput,
  IAnswerGradingService,
} from '@domain/services/IAnswerGradingService.js';
import { env } from '@config/env.js';

const GradingResponseSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0),
  feedback: z.string(),
  explanation: z.string(),
});

export class AzureOpenAIGradingService implements IAnswerGradingService {
  private client: AzureOpenAI;

  constructor() {
    this.client = new AzureOpenAI({
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      apiVersion: env.AZURE_OPENAI_API_VERSION,
      apiKey: env.AZURE_OPENAI_API_KEY,
    });
  }

  async gradeAnswer(params: GradeAnswerInput): Promise<GradeAnswerOutput> {
    const { questionText, correctAnswer, studentAnswer, points } = params;

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
        temperature: 0.3,
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Azure OpenAI');
      }

      const parsed = JSON.parse(content);
      const result = GradingResponseSchema.safeParse(parsed);

      if (!result.success) {
        console.error('Invalid grading response from Azure OpenAI:', result.error.format());
        // Fallback: return 0 points on validation failure
        return {
          isCorrect: false,
          score: 0,
          feedback: 'Error during automatic grading. Please contact your teacher.',
        };
      }

      const validated = result.data;

      // Validate score is within bounds
      const score = Math.max(0, Math.min(points, validated.score));

      return {
        isCorrect: validated.isCorrect,
        score,
        feedback: validated.feedback,
        explanation: validated.explanation,
      };
    } catch (error) {
      console.error('Error grading answer with Azure OpenAI:', error);
      // Fallback: return 0 points on error to avoid blocking submission
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Error during automatic grading. Please contact your teacher.',
      };
    }
  }

  private buildSystemPrompt(maxPoints: number): string {
    return `You are an AI exam grader. Your task is to evaluate student answers and provide detailed feedback.

Grading Guidelines:
1. Evaluate the student's answer against the correct answer provided
2. Consider partial credit for answers that show understanding but may have minor errors
3. Be lenient with spelling and grammar mistakes if the core concept is correct
4. For numerical answers, accept equivalent values (e.g., "0.5" = "1/2" = "50%")
5. For explanations, focus on key concepts being present

Scoring:
- Maximum points: ${maxPoints}
- Award partial credit based on how close the answer is to the correct answer
- Consider 70%+ of max points if the answer demonstrates good understanding
- Consider 30-70% if partially correct
- 0 points if completely wrong or off-topic

You must respond with a JSON object in this exact format:
{
  "isCorrect": boolean,      // true if answer is mostly/fully correct
  "score": number,           // points earned (0 to ${maxPoints})
  "feedback": string,      // brief feedback for the student (1-2 sentences)
  "explanation": string      // brief explanation of why this score was given
}`;
  }

  private buildUserPrompt(
    questionText: string,
    correctAnswer: string,
    studentAnswer: string
  ): string {
    return `Question: ${questionText}

Correct Answer: ${correctAnswer || 'N/A (any reasonable answer may be acceptable)'}

Student's Answer: ${studentAnswer}

Please evaluate the student's answer and respond with the required JSON format.`;
  }
}
