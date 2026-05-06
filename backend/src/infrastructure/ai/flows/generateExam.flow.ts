import { z } from 'genkit';
import { AzureOpenAI } from 'openai';

import { env } from '@config/env.js';
import {
  QuestionType,
  QuestionDifficulty,
  isStorableDifficulty,
} from '@domain/entities/ExamTypes.js';
import { ai } from '@infrastructure/ai/genkit.config.js';

// Re-export for convenience
export { QuestionType, QuestionDifficulty } from '@domain/entities/ExamTypes.js';

/**
 * Generate Exam Flow with Genkit + Azure OpenAI GPT-4o
 *
 * This flow handles exam generation using RAG + GPT-4o:
 * 1. Receives context chunks from RAG search
 * 2. Generates questions using GPT-4o
 * 3. Returns structured questions with validation
 *
 * Architecture:
 * - Uses Genkit's ai.run() for observability
 * - Uses Azure OpenAI GPT-4o for question generation
 * - Structured JSON output with zod validation
 */

// Initialize Azure OpenAI client
const azureClient = new AzureOpenAI({
  apiKey: env.AZURE_OPENAI_API_KEY,
  endpoint: env.AZURE_OPENAI_ENDPOINT,
  apiVersion: env.AZURE_OPENAI_API_VERSION,
  deployment: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
});

/**
 * Question schema (difficulty cannot be MIXED for individual questions)
 */
const QuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  difficulty: z.enum([QuestionDifficulty.EASY, QuestionDifficulty.MEDIUM, QuestionDifficulty.HARD]),
  questionText: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().int().positive(),
});

/**
 * Input schema for generate exam flow
 */
const GenerateExamInputSchema = z.object({
  context: z.string().describe('RAG context from document chunks'),
  numQuestions: z.number().int().min(5).max(50),
  difficulty: z.nativeEnum(QuestionDifficulty),
  questionTypes: z.array(z.nativeEnum(QuestionType)).min(1),
});

/**
 * Output schema for generate exam flow
 */
const GenerateExamOutputSchema = z.object({
  questions: z.array(QuestionSchema),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

/**
 * Build the system prompt for exam generation
 */
function buildSystemPrompt(difficulty: QuestionDifficulty, questionTypes: QuestionType[]): string {
  const typeInstructions = questionTypes
    .map((type) => {
      switch (type) {
        case QuestionType.MULTIPLE_CHOICE:
          return '- MULTIPLE_CHOICE: Provide exactly 4 options, with only 1 correct answer';
        case QuestionType.TRUE_FALSE:
          return '- TRUE_FALSE: Create statements that are clearly true or false based on the context';
        case QuestionType.SHORT_ANSWER:
          return '- SHORT_ANSWER: Create questions with definite, verifiable answers (1-3 sentences)';
      }
    })
    .join('\n');

  return `You are an expert exam question generator. Your task is to create high-quality exam questions based on the provided context.

Requirements:
- Questions must be clear, unambiguous, and directly based on the context
- Each question must have a detailed explanation
- Questions should test understanding, not just memorization
- Avoid questions that can be answered with "it depends" or "both"
- Options must ONLY contain the actual answer choices, never JSON keys or property names like "correctAnswer", "explanation", etc.
- Each option must be a valid answer that a student could select, not metadata or schema fragments

Question Types:
${typeInstructions}

Difficulty Level: ${difficulty === QuestionDifficulty.MIXED ? 'Mix of EASY, MEDIUM, and HARD (equal distribution)' : difficulty}
${difficulty === QuestionDifficulty.EASY ? '- EASY: Basic recall and comprehension' : ''}
${difficulty === QuestionDifficulty.MEDIUM ? '- MEDIUM: Application and analysis' : ''}
${difficulty === QuestionDifficulty.HARD ? '- HARD: Evaluation and synthesis' : ''}

Points:
- EASY: 1 point
- MEDIUM: 2 points
- HARD: 3 points

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "questionText": "string",
      "options": ["string"] (4 for MULTIPLE_CHOICE, ["True", "False"] for TRUE_FALSE, [] for SHORT_ANSWER),
      "correctAnswer": "string",
      "explanation": "string",
      "points": number
    }
  ]
}`;
}

/**
 * Build the user prompt for exam generation
 */
function buildUserPrompt(
  context: string,
  numQuestions: number,
  questionTypes: QuestionType[]
): string {
  return `Generate ${numQuestions} exam questions based on the following context.

Question types to generate: ${questionTypes.join(', ')}

Context:
${context}

Generate exactly ${numQuestions} questions. Return ONLY the JSON object, no additional text.`;
}

/**
 * Raw question type from GPT-4o response (before validation)
 */
interface RawQuestion {
  type?: string;
  difficulty?: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  [key: string]: unknown;
}

/**
 * Check if an option looks like an LLM artifact/template marker.
 * Only detects obvious JSON/template fragments, not valid answer text.
 *
 * Patterns detected:
 * - Property names with JSON punctuation: "correctAnswer]:", "explanation":
 * - Standalone property names that aren't sentences
 * - JSON structure fragments
 */
export function isLLMArtifact(option: string): boolean {
  const trimmed = option.trim();

  // Pattern 1: Property name followed by JSON punctuation ]: or ]:
  // e.g., "correctAnswer]:", "explanation]:", "options]:
  if (/^\w+\]\s*:$/.test(trimmed)) return true;

  // Pattern 2: Standalone property names (exact match, case insensitive)
  // e.g., "correctAnswer", "explanation", "questionText" alone
  const standaloneProperties = [
    'correctanswer',
    'explanation',
    'questiontext',
    'difficulty',
    'points',
    'options',
    'type',
  ];
  if (standaloneProperties.includes(trimmed.toLowerCase())) return true;

  // Pattern 3: Property with JSON quotes and colon
  // e.g., '"correctAnswer":', '"explanation":'
  if (/^"\w+"\s*:$/.test(trimmed)) return true;

  // Pattern 4: Opening/closing braces alone (JSON structure fragments)
  if (/^[{}]\s*$/.test(trimmed)) return true;

  return false;
}

/**
 * Validate and normalize generated questions
 */
function validateAndNormalizeQuestions(
  questions: RawQuestion[],
  difficulty: QuestionDifficulty
): z.infer<typeof QuestionSchema>[] {
  const validated: z.infer<typeof QuestionSchema>[] = [];

  for (const q of questions) {
    try {
      // Normalize difficulty for MIXED
      let normalizedDifficulty: string;
      if (difficulty === QuestionDifficulty.MIXED) {
        // Keep the difficulty as generated by GPT-4o, but ensure it's storable
        if (!isStorableDifficulty(q.difficulty as QuestionDifficulty)) {
          // Default to MEDIUM if invalid or MIXED
          normalizedDifficulty = QuestionDifficulty.MEDIUM;
        } else {
          normalizedDifficulty = q.difficulty as string;
        }
      } else {
        // Force the requested difficulty
        normalizedDifficulty = difficulty;
      }

      // Assign points based on difficulty
      let points: number;
      if (normalizedDifficulty === QuestionDifficulty.EASY) {
        points = 1;
      } else if (normalizedDifficulty === QuestionDifficulty.MEDIUM) {
        points = 2;
      } else if (normalizedDifficulty === QuestionDifficulty.HARD) {
        points = 3;
      } else {
        points = 1;
      }

      // Normalize options for TRUE_FALSE
      let normalizedOptions: string[] | undefined;
      if (q.type === QuestionType.TRUE_FALSE) {
        normalizedOptions = ['True', 'False'];
      } else if (q.options && Array.isArray(q.options)) {
        // Filter out LLM artifacts from options
        normalizedOptions = q.options.filter((opt) => {
          if (typeof opt !== 'string') return false;
          if (isLLMArtifact(opt)) {
            console.warn(`Filtered out LLM artifact from options: "${opt}"`);
            return false;
          }
          return true;
        });
      }

      // Build a new normalized question object instead of mutating the input
      const normalizedQuestion: RawQuestion = {
        ...q,
        difficulty: normalizedDifficulty,
        points,
        options: normalizedOptions,
      };

      // Validate with Zod
      const validatedQuestion = QuestionSchema.parse(normalizedQuestion);
      validated.push(validatedQuestion);
    } catch (_error) {
      console.warn('Invalid question filtered out:', _error);
      // Skip invalid questions
    }
  }

  return validated;
}

/**
 * Genkit Flow: Generate Exam Questions
 *
 * Main entry point for exam generation with GPT-4o
 */
export const generateExamFlow = ai.defineFlow(
  {
    name: 'generateExam',
    inputSchema: GenerateExamInputSchema,
    outputSchema: GenerateExamOutputSchema,
  },
  async ({ context, numQuestions, difficulty, questionTypes }) => {
    // Step 1: Build prompts
    const systemPrompt = buildSystemPrompt(difficulty, questionTypes);
    const userPrompt = buildUserPrompt(context, numQuestions, questionTypes);

    // Step 2: Call GPT-4o with Genkit observability
    const response = await ai.run('gpt4o-generate-questions', async () => {
      console.log(`[GPT-4o] Generating ${numQuestions} questions...`);

      const completion = await azureClient.chat.completions.create({
        model: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_completion_tokens: numQuestions * 500, // Estimate ~500 tokens per question
        response_format: { type: 'json_object' }, // Force JSON mode
      });

      return completion;
    });

    // Step 3: Parse and validate response
    const parsedResponse = await ai.run('parse-questions', async () => {
      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in GPT-4o response');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content) as unknown;
      } catch (_error) {
        throw new Error('Failed to parse GPT-4o response as JSON');
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('questions' in parsed) ||
        !Array.isArray((parsed as { questions: unknown[] }).questions)
      ) {
        throw new Error('Invalid response format: missing questions array');
      }

      // Validate and normalize questions
      const validatedQuestions = validateAndNormalizeQuestions(
        (parsed as { questions: unknown[] }).questions as RawQuestion[],
        difficulty
      );

      if (validatedQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      console.log(`[GPT-4o] ✅ Generated ${validatedQuestions.length} valid questions`);

      return {
        questions: validatedQuestions,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      };
    });

    return parsedResponse;
  }
);
