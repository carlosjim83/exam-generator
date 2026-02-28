/**
 * GenerateExamUseCase
 * Orchestrates exam generation using RAG + GPT-4o
 *
 * Flow:
 * 1. Validate documents exist and user has access
 * 2. Extract relevant context using RAG (semantic search across N documents)
 * 3. Generate questions using GPT-4o
 * 4. Store exam + questions in database
 *
 * Supports:
 * - Single document exams
 * - Multi-document exams (up to 10 documents)
 */

import { QuestionType, QuestionDifficulty } from '@domain/entities/ExamTypes.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IExamRepository, CreateQuestionDTO } from '@domain/repositories/IExamRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import type { AzureOpenAIEmbeddingService } from '@infrastructure/ai/AzureOpenAIEmbeddingService.js';
import { generateExamFlow } from '@infrastructure/ai/flows/generateExam.flow.js';

export interface GenerateExamInput {
  userId: string;
  documentIds: string[]; // Changed: Now accepts multiple documents
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
    documentCount: number; // New: number of source documents
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
  private static readonly MAX_DOCUMENTS = 10; // Maximum documents per exam
  private static readonly MAX_CHUNKS_PER_DOCUMENT = 20; // Chunks per document for balanced context

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly examRepository: IExamRepository,
    private readonly embeddingService: AzureOpenAIEmbeddingService
  ) {}

  async execute(input: GenerateExamInput): Promise<GenerateExamOutput> {
    const startTime = Date.now();

    // Validation
    this.validateInput(input);

    const userId = UserId.create(input.userId);
    const documentIds = input.documentIds.map((id) => DocumentId.create(id));

    // Step 1: Verify all documents exist and user has access
    console.log(`[GenerateExam] Validating ${documentIds.length} document(s)...`);
    const documents = await this.validateDocuments(userId, documentIds);

    // Step 2: Extract relevant context using RAG (across all documents)
    console.log(`[GenerateExam] Extracting context from ${documents.length} document(s)...`);
    const context = await this.extractMultiDocumentContext(documentIds, input.numQuestions);

    // Step 3: Generate questions using GPT-4o (via Genkit flow)
    console.log(`[GenerateExam] Generating ${input.numQuestions} questions with GPT-4o...`);
    // Map string types to enum types for the flow
    const difficultyMap: Record<string, QuestionDifficulty> = {
      EASY: QuestionDifficulty.EASY,
      MEDIUM: QuestionDifficulty.MEDIUM,
      HARD: QuestionDifficulty.HARD,
      MIXED: QuestionDifficulty.MIXED,
    };

    const questionTypeMap: Record<string, QuestionType> = {
      MULTIPLE_CHOICE: QuestionType.MULTIPLE_CHOICE,
      TRUE_FALSE: QuestionType.TRUE_FALSE,
      SHORT_ANSWER: QuestionType.SHORT_ANSWER,
    };

    const generatedQuestions = await generateExamFlow({
      context,
      numQuestions: input.numQuestions,
      difficulty: difficultyMap[input.difficulty] || QuestionDifficulty.MEDIUM,
      questionTypes: input.questionTypes
        .map((t) => questionTypeMap[t])
        .filter((t): t is QuestionType => Boolean(t)),
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

    const exam = await this.examRepository.createWithQuestions(
      {
        userId,
        title: input.title,
        description: input.description,
        generatedFrom: input.documentIds,
        promptUsed: `Generated ${input.numQuestions} ${input.difficulty} questions from ${input.documentIds.length} document(s)`,
      },
      questionsDTO
    );

    const generationTime = Date.now() - startTime;
    console.log(
      `[GenerateExam] ✅ Exam generated successfully in ${generationTime}ms from ${input.documentIds.length} document(s)`
    );

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        questionCount: exam.questionCount,
        documentCount: input.documentIds.length,
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
   * Validate all documents exist, are COMPLETED, and belong to user
   */
  private async validateDocuments(userId: UserId, documentIds: DocumentId[]) {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        const document = await this.documentRepository.findById(docId);

        if (!document) {
          throw new Error(`Document not found: ${docId.value}`);
        }

        if (document.userId.value !== userId.value) {
          throw new Error(`Unauthorized: Document ${docId.value} does not belong to user`);
        }

        if (document.status !== 'COMPLETED') {
          throw new Error(
            `Document ${docId.value} not ready for exam generation. Status: ${document.status}`
          );
        }

        return document;
      })
    );

    return documents;
  }

  /**
   * Extract relevant context from multiple documents using RAG
   *
   * Strategy:
   * - Distribute chunk extraction across all documents
   * - Use diverse queries for better coverage
   * - Deduplicate and rank by similarity
   * - Balance representation from all sources
   */
  private async extractMultiDocumentContext(
    documentIds: DocumentId[],
    numQuestions: number
  ): Promise<string> {
    // Calculate total chunks to extract (3x questions, max 100 total)
    const totalChunksToExtract = Math.min(numQuestions * 3, 100);

    // Distribute chunks across documents (minimum 10 per document for balance)
    const chunksPerDocument = Math.max(
      GenerateExamUseCase.MAX_CHUNKS_PER_DOCUMENT,
      Math.ceil(totalChunksToExtract / documentIds.length)
    );

    // Diverse queries for comprehensive coverage
    const queries = [
      'main concepts and key ideas',
      'important definitions and explanations',
      'examples and applications',
      'critical information and facts',
    ];

    const allChunks: Array<{
      content: string;
      similarity: number;
      documentId: string;
    }> = [];

    // Extract chunks from each document
    for (const documentId of documentIds) {
      console.log(
        `[GenerateExam] Extracting up to ${chunksPerDocument} chunks from document ${documentId.value}`
      );

      for (const query of queries) {
        // Generate embedding for query
        const embeddings = await this.embeddingService.generateEmbeddings([query]);
        const queryEmbedding = embeddings[0];

        // Search for similar chunks in this document
        const chunks = await this.documentRepository.searchSimilarChunks(
          documentId,
          queryEmbedding,
          Math.ceil(chunksPerDocument / queries.length)
        );

        allChunks.push(
          ...chunks.map((c) => ({
            content: c.content,
            similarity: c.similarity,
            documentId: documentId.value,
          }))
        );
      }
    }

    // Remove duplicates (same content from different queries)
    const uniqueChunks = Array.from(new Map(allChunks.map((c) => [c.content, c])).values());

    // Sort by similarity but ensure representation from all documents
    const balancedChunks = this.balanceChunkDistribution(
      uniqueChunks,
      documentIds.map((d) => d.value),
      totalChunksToExtract
    );

    // Concatenate chunks into context
    const context = balancedChunks.map((c) => c.content).join('\n\n');

    // Log distribution statistics
    const distribution = this.getChunkDistribution(balancedChunks);
    console.log(`[GenerateExam] Extracted ${balancedChunks.length} chunks total:`);
    documentIds.forEach((docId) => {
      const count = distribution.get(docId.value) || 0;
      console.log(`  - Document ${docId.value.substring(0, 8)}...: ${count} chunks`);
    });
    console.log(`[GenerateExam] Total context size: ${context.length} characters`);

    return context;
  }

  /**
   * Balance chunk distribution to ensure all documents are represented
   *
   * Strategy:
   * 1. Ensure minimum representation from each document
   * 2. Fill remaining slots with highest similarity chunks
   */
  private balanceChunkDistribution(
    chunks: Array<{ content: string; similarity: number; documentId: string }>,
    documentIds: string[],
    totalChunks: number
  ): Array<{ content: string; similarity: number; documentId: string }> {
    const minChunksPerDoc = Math.floor(totalChunks / documentIds.length);
    const selected: Array<{ content: string; similarity: number; documentId: string }> = [];

    // Group chunks by document
    const chunksByDoc = new Map<string, typeof chunks>();
    documentIds.forEach((docId) => {
      chunksByDoc.set(
        docId,
        chunks.filter((c) => c.documentId === docId).sort((a, b) => b.similarity - a.similarity)
      );
    });

    // Phase 1: Ensure minimum representation from each document
    documentIds.forEach((docId) => {
      const docChunks = chunksByDoc.get(docId) || [];
      const toTake = Math.min(minChunksPerDoc, docChunks.length);
      selected.push(...docChunks.slice(0, toTake));
    });

    // Phase 2: Fill remaining slots with highest similarity chunks
    const remaining = chunks
      .filter((c) => !selected.some((s) => s.content === c.content))
      .sort((a, b) => b.similarity - a.similarity);

    const slotsRemaining = totalChunks - selected.length;
    selected.push(...remaining.slice(0, slotsRemaining));

    // Sort final selection by similarity
    return selected.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get distribution of chunks per document
   */
  private getChunkDistribution(chunks: Array<{ documentId: string }>): Map<string, number> {
    const distribution = new Map<string, number>();
    chunks.forEach((chunk) => {
      distribution.set(chunk.documentId, (distribution.get(chunk.documentId) || 0) + 1);
    });
    return distribution;
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GenerateExamInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Exam title is required');
    }

    // Validate documentIds array
    if (!input.documentIds || !Array.isArray(input.documentIds)) {
      throw new Error('documentIds must be a non-empty array');
    }

    if (input.documentIds.length === 0) {
      throw new Error('At least one document must be provided');
    }

    if (input.documentIds.length > GenerateExamUseCase.MAX_DOCUMENTS) {
      throw new Error(`Maximum ${GenerateExamUseCase.MAX_DOCUMENTS} documents allowed per exam`);
    }

    // Validate no duplicate document IDs
    const uniqueIds = new Set(input.documentIds);
    if (uniqueIds.size !== input.documentIds.length) {
      throw new Error('Duplicate document IDs are not allowed');
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
