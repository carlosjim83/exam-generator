/**
 * Azure GPT-4o Service
 *
 * Generates exam questions using Azure OpenAI GPT-4o model.
 * Uses structured outputs with JSON schema for reliable question generation.
 */

import { AzureOpenAI } from 'openai';

export interface GenerateQuestionsInput {
  context: string; // Relevant document chunks
  numQuestions: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  questionTypes: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[];
  subject?: string; // Optional subject/topic
}

export interface GeneratedQuestion {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface GenerateQuestionsOutput {
  questions: GeneratedQuestion[];
  totalGenerated: number;
}

export class AzureGPT4Service {
  private client: AzureOpenAI;
  private deploymentName: string;

  constructor() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    this.deploymentName = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o';

    if (!apiKey || !endpoint) {
      throw new Error(
        'Missing Azure OpenAI configuration. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env'
      );
    }

    this.client = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion,
    });

    console.log('✅ Azure GPT-4o Service initialized');
    console.log(`   - Endpoint: ${endpoint}`);
    console.log(`   - Deployment: ${this.deploymentName}`);
    console.log(`   - API Version: ${apiVersion}`);
  }

  /**
   * Generate exam questions based on document context
   */
  async generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const { context, numQuestions, difficulty, questionTypes, subject } = input;

    console.log(`[GPT-4o] Generating ${numQuestions} questions...`);
    console.log(`[GPT-4o] Difficulty: ${difficulty}`);
    console.log(`[GPT-4o] Types: ${questionTypes.join(', ')}`);

    try {
      const systemPrompt = this.buildSystemPrompt(difficulty, questionTypes, subject);
      const userPrompt = this.buildUserPrompt(context, numQuestions);

      const response = await this.client.chat.completions.create({
        model: this.deploymentName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }, // Enable JSON mode
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from GPT-4o');
      }

      const parsed = JSON.parse(content);
      const questions = this.validateAndNormalizeQuestions(parsed.questions || []);

      console.log(`[GPT-4o] ✅ Generated ${questions.length} questions successfully`);

      return {
        questions,
        totalGenerated: questions.length,
      };
    } catch (error: any) {
      // Handle rate limit errors
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        const errorMessage = `Azure OpenAI rate limit exceeded: ${error.message}`;
        console.error(`[GPT-4o] ⚠️  ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        console.error(`[GPT-4o] ❌ Failed to parse JSON response`);
        throw new Error('Failed to parse GPT-4o response. Invalid JSON format.');
      }

      // Handle other errors
      const errorMessage = `Failed to generate questions: ${error.message || 'Unknown error'}`;
      console.error(`[GPT-4o] ❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Build system prompt for question generation
   */
  private buildSystemPrompt(difficulty: string, questionTypes: string[], subject?: string): string {
    return `You are an expert exam question generator. Your task is to create high-quality, educational exam questions based on provided context.

REQUIREMENTS:
- Generate questions that test understanding, not just memorization
- Ensure questions are clear, unambiguous, and grammatically correct
- For multiple choice: provide 4 options with only 1 correct answer
- For true/false: ensure the statement is clearly true or false based on context
- For short answer: questions should have a definite, verifiable answer
- Include detailed explanations for correct answers
- Difficulty level: ${difficulty}
- Allowed question types: ${questionTypes.join(', ')}
${subject ? `- Subject/Topic: ${subject}` : ''}

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "questionText": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MULTIPLE_CHOICE
      "correctAnswer": "The correct answer",
      "explanation": "Detailed explanation of why this is correct",
      "points": 1 // EASY=1, MEDIUM=2, HARD=3
    }
  ]
}

DIFFICULTY GUIDELINES:
- EASY: Basic recall and understanding
- MEDIUM: Application and analysis
- HARD: Synthesis and evaluation
- MIXED: Mix of all difficulty levels

Ensure all questions are directly based on the provided context.`;
  }

  /**
   * Build user prompt with context and requirements
   */
  private buildUserPrompt(context: string, numQuestions: number): string {
    return `Generate ${numQuestions} exam questions based on the following content:

CONTENT:
${context}

Please generate exactly ${numQuestions} questions that cover different aspects of this content.
Return the response as valid JSON following the specified format.`;
  }

  /**
   * Validate and normalize generated questions
   */
  private validateAndNormalizeQuestions(questions: any[]): GeneratedQuestion[] {
    return questions
      .filter((q) => {
        // Basic validation
        return (
          q.questionText &&
          q.correctAnswer &&
          q.explanation &&
          ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(q.type) &&
          ['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)
        );
      })
      .map((q) => ({
        type: q.type,
        difficulty: q.difficulty,
        questionText: q.questionText.trim(),
        options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
        correctAnswer: q.correctAnswer.trim(),
        explanation: q.explanation.trim(),
        points: q.points || this.getDefaultPoints(q.difficulty),
      }));
  }

  /**
   * Get default points based on difficulty
   */
  private getDefaultPoints(difficulty: string): number {
    switch (difficulty) {
      case 'EASY':
        return 1;
      case 'MEDIUM':
        return 2;
      case 'HARD':
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Get the deployment name
   */
  getDeploymentName(): string {
    return this.deploymentName;
  }
}
