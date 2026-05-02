import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { NotFoundError } from '@domain/errors/DomainError.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import type { IExamGenerator } from '@domain/services/IExamGenerator.js';
import type { IExamInputValidator } from '@domain/services/ExamInputValidator.js';
import type { IExamPersistenceService } from '@domain/services/ExamPersistenceService.js';
import type { ILogger } from '@domain/services/ILogger.js';
import type { IRAGContextExtractor } from '@domain/services/IRAGContextExtractor.js';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import type { IUsageMetricsUpdater } from '@domain/services/UsageMetricsUpdater.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
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
    private readonly documentRepository: IDocumentRepository,
    private readonly examGenerator: IExamGenerator,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly usageMetricsRepository: IUsageMetricsRepository,
    private readonly subscriptionEnforcementService: SubscriptionEnforcementService,
    private readonly inputValidator: IExamInputValidator,
    private readonly ragContextExtractor: IRAGContextExtractor,
    private readonly persistenceService: IExamPersistenceService,
    private readonly usageMetricsUpdater: IUsageMetricsUpdater,
    private readonly logger: ILogger
  ) {}

  async execute(input: GenerateExamInput): Promise<GenerateExamOutput> {
    const startTime = Date.now();

    // 1. Check subscription limit
    await this.enforceExamLimit(input.userId);

    // 2. Validate input parameters
    this.inputValidator.validate(input);

    // 3. Resolve domain IDs
    const userId = UserId.create(input.userId);
    const documentIds = input.documentIds.map((id) => DocumentId.create(id));

    // 4. Verify all documents exist and user has access
    this.logger.info(`Validating ${documentIds.length} document(s)...`);
    const documents = await this.validateDocuments(userId, documentIds);

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

    // 7. Build question DTOs and persist exam
    this.logger.info('Storing exam and questions in database...');
    const questionDTOs = this.inputValidator.buildQuestionDTOs(result.questions);
    const exam = await this.persistenceService.persist(userId, input, questionDTOs);

    // 8. Update usage metrics
    await this.usageMetricsUpdater.updateExamCount(input.userId);

    // 9. Build and return output
    const generationTime = Date.now() - startTime;
    this.logger.info(`Exam generated successfully`, {
      generationTimeMs: generationTime,
      documentCount: input.documentIds.length,
      questionCount: input.numQuestions,
    });

    return this.persistenceService.buildOutput(exam, input, generationTime);
  }

  // ---------------------------------------------------------------------------
  // Document Verification
  // ---------------------------------------------------------------------------

  private async validateDocuments(userId: UserId, documentIds: DocumentId[]) {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        const document = await this.documentRepository.findById(docId);

        if (!document) {
          throw new NotFoundError(`Document not found: ${docId.value}`);
        }

        assertOwnership(
          document.userId,
          userId,
          `Unauthorized: Document ${docId.value} does not belong to user`
        );

        if (document.status !== 'COMPLETED') {
          throw new NotFoundError(
            `Document ${docId.value} not ready for exam generation. Status: ${document.status}`
          );
        }

        return document;
      })
    );

    return documents;
  }

  // ---------------------------------------------------------------------------
  // Subscription Limits
  // ---------------------------------------------------------------------------

  private async enforceExamLimit(teacherId: string): Promise<void> {
    const teacherUserId = UserId.create(teacherId);
    const subscription = await this.subscriptionRepository.findByTeacherId(teacherUserId);

    if (!subscription) {
      const usageMetrics = await this.usageMetricsRepository.findCurrentByTeacherId(teacherUserId);
      this.subscriptionEnforcementService.enforceExamLimit(
        usageMetrics?.examsCreatedThisMonth ?? 0,
        SubscriptionTier.FREE
      );
      return;
    }

    const usageMetrics = await this.usageMetricsRepository.findCurrentByTeacherId(teacherUserId);
    this.subscriptionEnforcementService.enforceExamLimit(
      usageMetrics?.examsCreatedThisMonth ?? 0,
      subscription.tier
    );
  }
}
