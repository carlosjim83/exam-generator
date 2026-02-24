import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StudentExamAPIService } from '../student-exam-api.service';
import type {
  StudentExamListItem,
  StartExamResponse,
  SubmitAnswerResponse,
  SubmitExamResponse,
  ExamResultsData,
} from '../../types';

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  TokenManager: {
    getAccessToken: vi.fn(() => 'mock-jwt-token'),
    isAuthenticated: vi.fn(() => true),
  },
}));

import { apiClient } from '@/lib/api-client';

describe('StudentExamAPIService', () => {
  let service: StudentExamAPIService;

  beforeEach(() => {
    service = new StudentExamAPIService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAssignedExams', () => {
    it('should fetch all assigned exams for the current student', async () => {
      // ARRANGE
      const mockExams: StudentExamListItem[] = [
        {
          id: 'assignment-1',
          examId: 'exam-1',
          examTitle: 'Math Test',
          examDescription: 'Basic algebra',
          status: 'PENDING',
          questionCount: 10,
          maxScore: 100,
          score: null,
          startedAt: null,
          submittedAt: null,
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ assignments: mockExams });

      // ACT
      const result = await service.getAssignedExams();

      // ASSERT
      expect(apiClient.get).toHaveBeenCalledWith('/api/students/assignments');
      expect(result).toEqual(mockExams);
    });

    it('should throw error when API request fails', async () => {
      // ARRANGE
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Unauthorized'));

      // ACT & ASSERT
      await expect(service.getAssignedExams()).rejects.toThrow('Unauthorized');
    });
  });

  describe('startExam', () => {
    it('should start an exam assignment and return exam with questions', async () => {
      // ARRANGE
      const mockResponse: StartExamResponse = {
        assignment: {
          id: 'assignment-1',
          examId: 'exam-1',
          studentId: 'student-1',
          status: 'IN_PROGRESS',
          startedAt: '2024-01-15T10:00:00Z',
          submittedAt: null,
          score: null,
          maxScore: 100,
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        exam: {
          id: 'exam-1',
          title: 'Math Test',
          description: 'Basic algebra',
          documentId: 'doc-1',
          createdBy: 'teacher-1',
          createdAt: '2024-01-10T08:00:00Z',
          questions: [
            {
              id: 'q1',
              text: 'What is 2+2?',
              order: 1,
            },
          ],
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      // ACT
      const result = await service.startExam('assignment-1');

      // ASSERT
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/students/assignments/assignment-1/start',
        {}
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer to a question', async () => {
      // ARRANGE
      const mockResponse: SubmitAnswerResponse = {
        answer: {
          id: 'answer-1',
          questionId: 'q1',
          answer: '4',
          createdAt: '2024-01-15T10:05:00Z',
          updatedAt: '2024-01-15T10:05:00Z',
        },
        message: 'Answer saved successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      // ACT
      const result = await service.submitAnswer('assignment-1', 'q1', '4');

      // ASSERT
      expect(apiClient.post).toHaveBeenCalledWith('/api/students/assignments/assignment-1/submit', {
        answers: [{ questionId: 'q1', answerText: '4' }],
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitExam', () => {
    it('should submit the complete exam', async () => {
      // ARRANGE
      const mockResponse: SubmitExamResponse = {
        assignment: {
          id: 'assignment-1',
          examId: 'exam-1',
          studentId: 'student-1',
          status: 'SUBMITTED',
          startedAt: '2024-01-15T10:00:00Z',
          submittedAt: '2024-01-15T10:30:00Z',
          score: null,
          maxScore: 100,
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Exam submitted successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      // ACT
      const result = await service.submitExam('assignment-1');

      // ASSERT
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/students/assignments/assignment-1/submit',
        {}
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getExamResults', () => {
    it('should fetch results for a graded exam', async () => {
      // ARRANGE
      const mockResponse: ExamResultsData = {
        assignment: {
          id: 'assignment-1',
          examId: 'exam-1',
          studentId: 'student-1',
          status: 'GRADED',
          startedAt: '2024-01-15T10:00:00Z',
          submittedAt: '2024-01-15T10:30:00Z',
          score: 80,
          maxScore: 100,
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        exam: {
          id: 'exam-1',
          title: 'Math Test',
          description: 'Basic algebra',
          documentId: 'doc-1',
          createdBy: 'teacher-1',
          createdAt: '2024-01-10T08:00:00Z',
          questions: [
            {
              id: 'q1',
              text: 'What is 2+2?',
              order: 1,
            },
          ],
        },
        answers: [
          {
            id: 'answer-1',
            questionId: 'q1',
            answer: '4',
            isCorrect: true,
            feedback: 'Correct!',
            createdAt: '2024-01-15T10:05:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
          },
        ],
        score: 80,
        maxScore: 100,
        percentage: 80,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      // ACT
      const result = await service.getExamResults('assignment-1');

      // ASSERT
      expect(apiClient.get).toHaveBeenCalledWith('/api/students/assignments/assignment-1/results');
      expect(result).toEqual(mockResponse);
    });
  });
});
