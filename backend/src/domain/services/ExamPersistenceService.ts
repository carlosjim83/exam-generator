import type { Exam } from '@domain/entities/Exam.js';
import type { CreateQuestionDTO, IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { ILogger } from '@domain/services/ILogger.js';
import { UserId } from '@domain/value-objects/UserId.js';
import type {
  GenerateExamInput,
  GenerateExamOutput,
} from '@application/use-cases/exams/GenerateExamUseCase.js';

export interface IExamPersistenceService {
  persist(
    userId: UserId,
    input: GenerateExamInput,
    questionDTOs: CreateQuestionDTO[]
  ): Promise<Exam>;
  buildOutput(exam: Exam, input: GenerateExamInput, generationTimeMs: number): GenerateExamOutput;
}

/**
 * ExamPersistenceService
 * Handles persistence of exams and questions, and output building.
 */
export class ExamPersistenceService implements IExamPersistenceService {
  constructor(
    private readonly examRepository: IExamRepository,
    private readonly logger: ILogger
  ) {}

  async persist(
    userId: UserId,
    input: GenerateExamInput,
    questionDTOs: CreateQuestionDTO[]
  ): Promise<Exam> {
    this.logger.info('Storing exam and questions in database');
    return this.examRepository.createWithQuestions(
      {
        userId,
        title: input.title,
        description: input.description,
        generatedFrom: input.documentIds,
        promptUsed: `Generated ${input.numQuestions} ${input.difficulty} questions from ${input.documentIds.length} document(s)`,
      },
      questionDTOs
    );
  }

  buildOutput(exam: Exam, input: GenerateExamInput, generationTimeMs: number): GenerateExamOutput {
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
      generationTimeMs,
    };
  }
}
