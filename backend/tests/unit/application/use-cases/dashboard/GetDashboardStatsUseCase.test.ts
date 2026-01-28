import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetDashboardStatsUseCase } from '@application/use-cases/dashboard/GetDashboardStatsUseCase.js';
import { IDocumentRepository } from '@domain/repositories/IDocumentRepository.js';

describe('GetDashboardStatsUseCase', () => {
  let getDashboardStatsUseCase: GetDashboardStatsUseCase;
  let mockDocumentRepository: IDocumentRepository;

  beforeEach(() => {
    // Mock document repository
    mockDocumentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
      findMostRecentByUserId: vi.fn(),
    } as any;

    getDashboardStatsUseCase = new GetDashboardStatsUseCase(mockDocumentRepository);
  });

  it('should return dashboard stats with document count', async () => {
    // Arrange
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    const mockDocument = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: userId,
      title: 'Test Document.pdf',
      filename: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'COMPLETED',
      uploadedAt: new Date('2026-01-28T10:00:00Z'),
      updatedAt: new Date('2026-01-28T10:30:00Z'),
    };

    vi.mocked(mockDocumentRepository.countByUserId).mockResolvedValue(5);
    vi.mocked(mockDocumentRepository.findMostRecentByUserId).mockResolvedValue(mockDocument as any);

    // Act
    const result = await getDashboardStatsUseCase.execute({ userId });

    // Assert
    expect(result.totalDocuments).toBe(5);
    expect(result.totalExams).toBe(0); // Exams not implemented yet
    expect(result.lastActivity).toBeDefined();
    expect(result.lastActivity.description).toContain('Test Document.pdf');
    expect(mockDocumentRepository.countByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ value: userId })
    );
    expect(mockDocumentRepository.findMostRecentByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ value: userId })
    );
  });

  it('should return zero stats when user has no documents', async () => {
    // Arrange
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    vi.mocked(mockDocumentRepository.countByUserId).mockResolvedValue(0);
    vi.mocked(mockDocumentRepository.findMostRecentByUserId).mockResolvedValue(null);

    // Act
    const result = await getDashboardStatsUseCase.execute({ userId });

    // Assert
    expect(result.totalDocuments).toBe(0);
    expect(result.totalExams).toBe(0);
    expect(result.lastActivity.description).toBe('No recent activity');
  });

  it('should handle missing userId', async () => {
    // Act & Assert
    await expect(getDashboardStatsUseCase.execute({ userId: '' })).rejects.toThrow(
      'userId is required'
    );
  });
});
