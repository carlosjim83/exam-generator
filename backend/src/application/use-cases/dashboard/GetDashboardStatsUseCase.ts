import { ValidationError } from '@domain/errors/DomainError.js';
import type { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetDashboardStatsInput {
  userId: string;
}

export interface GetDashboardStatsOutput {
  totalDocuments: number;
  totalExams: number;
  documentsChange: string; // "N/A" or "+25.5%" etc
  examsChange: string;
  lastActivity: {
    timestamp: Date;
    description: string;
  };
}

/**
 * GetDashboardStatsUseCase
 *
 * Returns dashboard statistics for a user:
 * - Total documents count
 * - Total exams count
 * - Last activity information
 * - Percentage changes (future)
 */
export class GetDashboardStatsUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(input: GetDashboardStatsInput): Promise<GetDashboardStatsOutput> {
    // Validate input
    if (!input.userId) {
      throw new ValidationError('userId is required');
    }

    const userId = UserId.create(input.userId);

    // Get document and exam counts
    const [totalDocuments, totalExams] = await Promise.all([
      this.documentRepository.countByUserId(userId),
      this.examRepository.countByUserId(userId.value),
    ]);

    // Get most recent document for last activity
    const mostRecentDocument = await this.documentRepository.findMostRecentByUserId(userId);

    // Build last activity
    const lastActivity = mostRecentDocument
      ? {
          timestamp: mostRecentDocument.updatedAt || mostRecentDocument.uploadedAt,
          description: `Last edit on "${mostRecentDocument.title}"`,
        }
      : {
          timestamp: new Date(),
          description: 'No recent activity',
        };

    // TODO: Implement percentage changes (requires historical data or previous month comparison)
    const documentsChange = 'N/A';
    const examsChange = 'N/A';

    return {
      totalDocuments,
      totalExams,
      documentsChange,
      examsChange,
      lastActivity,
    };
  }
}
