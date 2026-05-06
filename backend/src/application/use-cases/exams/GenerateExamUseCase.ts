import type { PrismaClient } from '@prisma/client';

import type { IDocumentAuthorizationService } from '@domain/services/DocumentAuthorizationService.js';
import type { IExamGenerator } from '@domain/services/IExamGenerator.js';
import type { IExamInputValidator } from '@domain/services/ExamInputValidator.js';
import type { IExamPersistenceService } from '@domain/services/ExamPersistenceService.js';
import type { ILogger } from '@domain/services/ILogger.js';
import type { IRAGContextExtractor } from '@domain/services/IRAGContextExtractor.js';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import type { IUsageMetricsUpdater } from '@domain/services/UsageMetricsUpdater.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { DocumentId } from '@domain/value-objects/DocumentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * GenerateExamUseCase
 * Orchestrates exam generation using RAG + GPT-4o
 *
 * Flow:
 * 1. Validate input
 * 2. Verify document access
 * 3. Extract RAG context
 * 4. Generate questions via AI
 * 5. Persist exam
 * 6. Update metrics
 */

export interface GenerateExamInput {
  userId: string;
  documentIds: string[];
  title: string;
  description?: string;
  numQuestions: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  questionTypes: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[];
}

export interface GenerateExamOutput {
  exam: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    documentCount: number;
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
    private readonly documentAuthorizationService: IDocumentAuthorizationService,
    private readonly examGenerator: IExamGenerator,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly usageMetricsRepository: IUsageMetricsRepository,
    private readonly subscriptionEnforcementService: SubscriptionEnforcementService,
    private readonly inputValidator: IExamInputValidator,
    private readonly ragContextExtractor: IRAGContextExtractor,
    private readonly persistenceService: IExamPersistenceService,
    private readonly usageMetricsUpdater: IUsageMetricsUpdater,
    private readonly logger: ILogger,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: GenerateExamInput): Promise<GenerateExamOutput> {
    const startTime = Date.now();

    // 1. Check subscription limit
    await this.subscriptionEnforcementService.checkExamLimit(
      input.userId,
      this.subscriptionRepository,
      this.usageMetricsRepository
    );

    // 2. Validate input parameters
    this.inputValidator.validate(input);

    // 3. Resolve domain IDs
    const userId = UserId.create(input.userId);
    const documentIds = input.documentIds.map((id) => DocumentId.create(id));

    // 4. Verify all documents exist, belong to user, and are ready
    this.logger.info(`Validating ${documentIds.length} document(s)...`);
    const documents = await this.documentAuthorizationService.verifyDocuments(userId, documentIds, {
      requiredStatus: 'COMPLETED',
    });

    // 5. Extract relevant context using RAG (across all documents)
    this.logger.info(`Extracting context from ${documents.length} document(s)...`);
    const context = await this.ragContextExtractor.extract(documentIds, input.numQuestions);

    // 6. Generate questions using GPT-4o (via Genkit flow)
    this.logger.info(`Generating ${input.numQuestions} questions...`);
    const difficulty = this.inputValidator.mapDifficulty(input.difficulty);
    const questionTypes = this.inputValidator.mapQuestionTypes(input.questionTypes);

    const result = await this.examGenerator.generate({
      context,
      numQuestions: input.numQuestions,
      difficulty,
      questionTypes,
    });

    this.inputValidator.validateGeneratedQuestions(result.questions, input.numQuestions);

    // 7. Build question DTOs and persist exam + metrics in a single transaction
    this.logger.info('Storing exam and questions in database...');
    const questionDTOs = this.inputValidator.buildQuestionDTOs(result.questions);
    const exam = await this.prisma.$transaction(async (tx) => {
      const persistedExam = await this.persistenceService.persist(userId, input, questionDTOs, tx);
      await this.usageMetricsUpdater.updateExamCount(input.userId, tx);
      return persistedExam;
    });

    // 9. Build and return output
    const generationTime = Date.now() - startTime;
    this.logger.info(`Exam generated successfully`, {
      generationTimeMs: generationTime,
      documentCount: input.documentIds.length,
      questionCount: input.numQuestions,
    });

    return this.persistenceService.buildOutput(exam, input, generationTime);
  }
}
