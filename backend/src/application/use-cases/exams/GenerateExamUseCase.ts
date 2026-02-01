/**
 * GenerateExamUseCase
 * Orchestrates exam generation using RAG + GPT-4o
 *
 * Flow:
 * 1. Validate document exists and user has access
 * 2. Extract relevant context using RAG (semantic search)
 * 3. Generate questions using GPT-4o
 * 4. Store exam + questions in database
 */

import { IDocumentRepository } from '../../../domain/repositories/IDocumentRepository.js';
import {
  IExamRepository,
  CreateQuestionDTO,
} from '../../../domain/repositories/IExamRepository.js';
import { DocumentId } from '../../../domain/value-objects/DocumentId.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
import { ExamId } from '../../../domain/value-objects/ExamId.js';
import { AzureOpenAIEmbeddingService } from '../../../infrastructure/ai/AzureOpenAIEmbeddingService.js';
import { generateExamFlow } from '../../../infrastructure/ai/flows/generateExam.flow.js';

export interface GenerateExamInput {
  userId: string;
  documentId: string;
  title: string;
  description?: string;
  numQuestions: number; // 5-50
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  questionTypes: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[];
}

export interface GenerateExamOutput {
  exam: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    createdAt: Date;
  };
  questions: {
    id: string;
    type: string;
    difficulty: string;
    questionText: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
  }[];
  generationTimeMs: number;
}

export class GenerateExamUseCase {
  constructor(
    private documentRepository: IDocumentRepository,
    private examRepository: IExamRepository,
    private embeddingService: AzureOpenAIEmbeddingService
  ) {}

  async execute(input: GenerateExamInput): Promise<GenerateExamOutput> {
    const startTime = Date.now();

    // Validation
    this.validateInput(input);

    const userId = UserId.create(input.userId);
    const documentId = DocumentId.create(input.documentId);

    // Step 1: Verify document exists and user has access
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId.value !== userId.value) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    if (document.status !== 'COMPLETED') {
      throw new Error(`Document not ready for exam generation. Status: ${document.status}`);
    }

    // Step 2: Extract relevant context using RAG (semantic search)
    console.log(`[GenerateExam] Extracting context from document ${input.documentId}...`);
    const context = await this.extractContext(documentId, input.numQuestions);

    // Step 3: Generate questions using GPT-4o (via Genkit flow)
    console.log(`[GenerateExam] Generating ${input.numQuestions} questions with GPT-4o...`);
    const generatedQuestions = await generateExamFlow({
      context,
      numQuestions: input.numQuestions,
      difficulty: input.difficulty as any,
      questionTypes: input.questionTypes as any,
    });

    // Step 4: Store exam + questions in database
    console.log(`[GenerateExam] Storing exam and questions in database...`);
    const questionsDTO: CreateQuestionDTO[] = generatedQuestions.questions.map((q, index) => ({
      examId: ExamId.create(), // Temporary, will be replaced by repository
      type: q.type,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
      orderIndex: index,
      sourceChunkIds: [], // TODO: Track which chunks were used
    }));

    const exam = await this.examRepository.create(
      {
        userId,
        title: input.title,
        description: input.description,
        generatedFrom: [input.documentId],
        promptUsed: `Generated ${input.numQuestions} ${input.difficulty} questions`,
      },
      questionsDTO
    );

    const generationTime = Date.now() - startTime;
    console.log(`[GenerateExam] ✅ Exam generated successfully in ${generationTime}ms`);

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        questionCount: exam.questionCount,
        createdAt: exam.createdAt,
      },
      questions: (exam.questions || []).map((q) => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
      })),
      generationTimeMs: generationTime,
    };
  }

  /**
   * Extract relevant context from document using RAG
   * Performs multiple semantic searches to get diverse content
   */
  private async extractContext(documentId: DocumentId, numQuestions: number): Promise<string> {
    // Strategy: Extract more chunks than questions to provide rich context
    const chunksToExtract = Math.min(numQuestions * 3, 50); // 3x questions, max 50 chunks

    // Perform semantic search with diverse queries to get representative content
    const queries = [
      'main concepts and key ideas',
      'important definitions and explanations',
      'examples and applications',
      'critical information and facts',
    ];

    const allChunks: Array<{ content: string; similarity: number }> = [];

    for (const query of queries) {
      // Generate embedding for query
      const embeddings = await this.embeddingService.generateEmbeddings([query]);
      const queryEmbedding = embeddings[0];

      // Search for similar chunks
      const chunks = await this.documentRepository.searchSimilarChunks(
        documentId,
        queryEmbedding,
        Math.ceil(chunksToExtract / queries.length)
      );

      allChunks.push(...chunks.map((c) => ({ content: c.content, similarity: c.similarity })));
    }

    // Remove duplicates and sort by similarity
    const uniqueChunks = Array.from(new Map(allChunks.map((c) => [c.content, c])).values()).sort(
      (a, b) => b.similarity - a.similarity
    );

    // Take top chunks and concatenate
    const context = uniqueChunks
      .slice(0, chunksToExtract)
      .map((c) => c.content)
      .join('\n\n');

    console.log(
      `[GenerateExam] Extracted ${uniqueChunks.slice(0, chunksToExtract).length} chunks (${
        context.length
      } characters)`
    );

    return context;
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GenerateExamInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Exam title is required');
    }

    if (input.numQuestions < 5 || input.numQuestions > 50) {
      throw new Error('Number of questions must be between 5 and 50');
    }

    if (!['EASY', 'MEDIUM', 'HARD', 'MIXED'].includes(input.difficulty)) {
      throw new Error('Invalid difficulty level');
    }

    if (!input.questionTypes || input.questionTypes.length === 0) {
      throw new Error('At least one question type must be specified');
    }

    const validTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
    for (const type of input.questionTypes) {
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid question type: ${type}`);
      }
    }
  }
}
