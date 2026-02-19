/**
 * useExamSubmission Hook Tests
 *
 * TDD Red-Green-Refactor
 * Tests for React hook that handles answer submission and exam finalization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExamSubmission } from '../useExamSubmission';
import { studentExamAPI } from '../../services/student-exam-api.service';
import type {
  SubmitAnswerResponse,
  SubmitExamResponse,
  StudentAnswer,
  ExamAssignment,
} from '../../types';

// Mock the API service singleton
vi.mock('../../services/student-exam-api.service', () => ({
  studentExamAPI: {
    submitAnswer: vi.fn(),
    submitExam: vi.fn(),
  },
}));

describe('useExamSubmission', () => {
  const mockAssignmentId = 'assignment-123';

  // Mock TokenManager
  vi.mock('@/lib/api-client', () => ({
    TokenManager: {
      getAccessToken: vi.fn().mockReturnValue('test-jwt-token'),
    },
  }));

  const mockAnswer: StudentAnswer = {
    id: 'answer-1',
    questionId: 'q1',
    answer: 'The answer is 4',
    isCorrect: undefined,
    feedback: undefined,
    createdAt: '2024-01-20T10:05:00Z',
    updatedAt: '2024-01-20T10:05:00Z',
  };

  const mockSubmitAnswerResponse: SubmitAnswerResponse = {
    answer: mockAnswer,
    message: 'Answer saved successfully',
  };

  const mockSubmittedAssignment: ExamAssignment = {
    id: mockAssignmentId,
    examId: 'exam-1',
    studentId: 'student-1',
    status: 'SUBMITTED',
    startedAt: '2024-01-20T10:00:00Z',
    submittedAt: '2024-01-20T10:30:00Z',
    score: null,
    maxScore: 100,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  };

  const mockSubmitExamResponse: SubmitExamResponse = {
    assignment: mockSubmittedAssignment,
    message: 'Exam submitted successfully',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      expect(result.current.answers).toEqual({});
      expect(result.current.isSubmittingAnswer).toBe(false);
      expect(result.current.isSubmittingExam).toBe(false);
      expect(result.current.submissionError).toBeNull();
      expect(result.current.isExamSubmitted).toBe(false);
      expect(typeof result.current.submitAnswer).toBe('function');
      expect(typeof result.current.submitExam).toBe('function');
      expect(typeof result.current.getAnswerForQuestion).toBe('function');
    });
  });

  describe('Submit Answer', () => {
    it('should submit answer successfully', async () => {
      const submitAnswerMock = vi
        .spyOn(studentExamAPI, 'submitAnswer')
        .mockResolvedValue(mockSubmitAnswerResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitAnswer('q1', 'The answer is 4');
      });

      await waitFor(() => {
        expect(result.current.isSubmittingAnswer).toBe(false);
      });

      expect(result.current.answers['q1']).toEqual(mockAnswer);
      expect(result.current.submissionError).toBeNull();
      expect(submitAnswerMock).toHaveBeenCalledWith(mockAssignmentId, 'q1', 'The answer is 4');
    });

    it('should set isSubmittingAnswer while submitting', async () => {
      let resolveSubmit: (value: SubmitAnswerResponse) => void;
      const delayedPromise = new Promise<SubmitAnswerResponse>((resolve) => {
        resolveSubmit = resolve;
      });

      vi.spyOn(studentExamAPI, 'submitAnswer').mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      act(() => {
        result.current.submitAnswer('q1', 'answer');
      });

      await waitFor(() => {
        expect(result.current.isSubmittingAnswer).toBe(true);
      });

      act(() => {
        resolveSubmit!(mockSubmitAnswerResponse);
      });

      await waitFor(() => {
        expect(result.current.isSubmittingAnswer).toBe(false);
      });
    });

    it('should handle submit answer error', async () => {
      const mockError = new Error('Failed to submit answer');
      vi.spyOn(studentExamAPI, 'submitAnswer').mockRejectedValue(mockError);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitAnswer('q1', 'answer');
      });

      await waitFor(() => {
        expect(result.current.isSubmittingAnswer).toBe(false);
      });

      expect(result.current.submissionError).toEqual(mockError);
      expect(result.current.answers['q1']).toBeUndefined();
    });

    it('should store multiple answers', async () => {
      const answer1: StudentAnswer = { ...mockAnswer, id: 'a1', questionId: 'q1' };
      const answer2: StudentAnswer = {
        ...mockAnswer,
        id: 'a2',
        questionId: 'q2',
        answer: 'Answer 2',
      };

      vi.spyOn(studentExamAPI, 'submitAnswer')
        .mockResolvedValueOnce({ answer: answer1, message: 'ok' })
        .mockResolvedValueOnce({ answer: answer2, message: 'ok' });

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitAnswer('q1', 'Answer 1');
      });

      await act(async () => {
        await result.current.submitAnswer('q2', 'Answer 2');
      });

      expect(Object.keys(result.current.answers)).toHaveLength(2);
      expect(result.current.answers['q1']).toEqual(answer1);
      expect(result.current.answers['q2']).toEqual(answer2);
    });
  });

  describe('Submit Exam', () => {
    it('should submit exam successfully', async () => {
      const submitExamMock = vi
        .spyOn(studentExamAPI, 'submitExam')
        .mockResolvedValue(mockSubmitExamResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitExam();
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(false);
      });

      expect(result.current.isExamSubmitted).toBe(true);
      expect(result.current.submissionError).toBeNull();
      expect(submitExamMock).toHaveBeenCalledWith(mockAssignmentId);
    });

    it('should set isSubmittingExam while submitting', async () => {
      let resolveSubmit: (value: SubmitExamResponse) => void;
      const delayedPromise = new Promise<SubmitExamResponse>((resolve) => {
        resolveSubmit = resolve;
      });

      vi.spyOn(studentExamAPI, 'submitExam').mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      act(() => {
        result.current.submitExam();
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(true);
      });

      act(() => {
        resolveSubmit!(mockSubmitExamResponse);
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(false);
      });
    });

    it('should handle submit exam error', async () => {
      const mockError = new Error('Failed to submit exam');
      vi.spyOn(studentExamAPI, 'submitExam').mockRejectedValue(mockError);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitExam();
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(false);
      });

      expect(result.current.submissionError).toEqual(mockError);
      expect(result.current.isExamSubmitted).toBe(false);
    });
  });

  describe('getAnswerForQuestion', () => {
    it('should return answer for a specific question', async () => {
      vi.spyOn(studentExamAPI, 'submitAnswer').mockResolvedValue(mockSubmitAnswerResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.submitAnswer('q1', 'The answer is 4');
      });

      const answer = result.current.getAnswerForQuestion('q1');
      expect(answer).toEqual(mockAnswer);
    });

    it('should return undefined for unanswered question', () => {
      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      const answer = result.current.getAnswerForQuestion('non-existent');
      expect(answer).toBeUndefined();
    });
  });

  describe('answeredCount', () => {
    it('should track number of answered questions', async () => {
      const answer1: StudentAnswer = { ...mockAnswer, id: 'a1', questionId: 'q1' };
      const answer2: StudentAnswer = { ...mockAnswer, id: 'a2', questionId: 'q2' };

      vi.spyOn(studentExamAPI, 'submitAnswer')
        .mockResolvedValueOnce({ answer: answer1, message: 'ok' })
        .mockResolvedValueOnce({ answer: answer2, message: 'ok' });

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      expect(result.current.answeredCount).toBe(0);

      await act(async () => {
        await result.current.submitAnswer('q1', 'Answer 1');
      });

      expect(result.current.answeredCount).toBe(1);

      await act(async () => {
        await result.current.submitAnswer('q2', 'Answer 2');
      });

      expect(result.current.answeredCount).toBe(2);
    });
  });
});
