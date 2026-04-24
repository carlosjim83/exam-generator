/**
 * useExamSubmission Hook Tests
 *
 * TDD Red-Green-Refactor
 * Tests for React hook that handles answer saving and exam finalization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExamSubmission } from '../useExamSubmission';
import { studentExamAPI } from '../../services/student-exam-api.service';
import type { SaveAnswerResponse, SubmitExamResponse, ExamAssignment } from '../../types';

// Mock the API service singleton
vi.mock('../../services/student-exam-api.service', () => ({
  studentExamAPI: {
    saveAnswer: vi.fn(),
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

  const mockSaveAnswerResponse: SaveAnswerResponse = {
    saved: true,
    questionId: 'q1',
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

      expect(result.current.savedAnswers).toEqual({});
      expect(result.current.isSavingAnswer).toBe(false);
      expect(result.current.isSubmittingExam).toBe(false);
      expect(result.current.submissionError).toBeNull();
      expect(result.current.isExamSubmitted).toBe(false);
      expect(typeof result.current.saveAnswer).toBe('function');
      expect(typeof result.current.submitExam).toBe('function');
      expect(typeof result.current.getAnswerForQuestion).toBe('function');
    });
  });

  describe('Save Answer', () => {
    it('should save answer successfully', async () => {
      const saveAnswerMock = vi
        .spyOn(studentExamAPI, 'saveAnswer')
        .mockResolvedValue(mockSaveAnswerResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.saveAnswer('q1', 'The answer is 4');
      });

      await waitFor(() => {
        expect(result.current.isSavingAnswer).toBe(false);
      });

      expect(result.current.savedAnswers['q1']).toBe('The answer is 4');
      expect(result.current.submissionError).toBeNull();
      expect(saveAnswerMock).toHaveBeenCalledWith(mockAssignmentId, 'q1', 'The answer is 4');
    });

    it('should set isSavingAnswer while saving', async () => {
      let resolveSave: (value: SaveAnswerResponse) => void;
      const delayedPromise = new Promise<SaveAnswerResponse>((resolve) => {
        resolveSave = resolve;
      });

      vi.spyOn(studentExamAPI, 'saveAnswer').mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      act(() => {
        result.current.saveAnswer('q1', 'answer');
      });

      await waitFor(() => {
        expect(result.current.isSavingAnswer).toBe(true);
      });

      act(() => {
        resolveSave!(mockSaveAnswerResponse);
      });

      await waitFor(() => {
        expect(result.current.isSavingAnswer).toBe(false);
      });
    });

    it('should handle save answer error', async () => {
      const mockError = new Error('Failed to save answer');
      vi.spyOn(studentExamAPI, 'saveAnswer').mockRejectedValue(mockError);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await expect(result.current.saveAnswer('q1', 'answer')).rejects.toThrow(
          'Failed to save answer'
        );
      });

      await waitFor(() => {
        expect(result.current.isSavingAnswer).toBe(false);
      });

      expect(result.current.submissionError).toEqual(mockError);
      expect(result.current.savedAnswers['q1']).toBeUndefined();
    });

    it('should store multiple answers', async () => {
      vi.spyOn(studentExamAPI, 'saveAnswer')
        .mockResolvedValueOnce({ saved: true, questionId: 'q1' })
        .mockResolvedValueOnce({ saved: true, questionId: 'q2' });

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.saveAnswer('q1', 'Answer 1');
      });

      await act(async () => {
        await result.current.saveAnswer('q2', 'Answer 2');
      });

      expect(Object.keys(result.current.savedAnswers)).toHaveLength(2);
      expect(result.current.savedAnswers['q1']).toBe('Answer 1');
      expect(result.current.savedAnswers['q2']).toBe('Answer 2');
    });
  });

  describe('Submit Exam', () => {
    it('should submit exam successfully', async () => {
      const submitExamMock = vi
        .spyOn(studentExamAPI, 'submitExam')
        .mockResolvedValue(mockSubmitExamResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      // First save an answer
      await act(async () => {
        await result.current.saveAnswer('q1', 'Answer text');
      });

      await act(async () => {
        await result.current.submitExam();
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(false);
      });

      expect(result.current.isExamSubmitted).toBe(true);
      expect(result.current.submissionError).toBeNull();
      expect(submitExamMock).toHaveBeenCalledWith(mockAssignmentId, [
        { questionId: 'q1', answerText: 'Answer text' },
      ]);
    });

    it('should set isSubmittingExam while submitting', async () => {
      let resolveSubmit: (value: SubmitExamResponse) => void;
      const delayedPromise = new Promise<SubmitExamResponse>((resolve) => {
        resolveSubmit = resolve;
      });

      vi.spyOn(studentExamAPI, 'submitExam').mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      // First save an answer
      await act(async () => {
        await result.current.saveAnswer('q1', 'Answer text');
      });

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

      // First save an answer
      await act(async () => {
        await result.current.saveAnswer('q1', 'Answer text');
      });

      await act(async () => {
        await expect(result.current.submitExam()).rejects.toThrow('Failed to submit exam');
      });

      await waitFor(() => {
        expect(result.current.isSubmittingExam).toBe(false);
      });

      expect(result.current.submissionError).toEqual(mockError);
      expect(result.current.isExamSubmitted).toBe(false);
    });

    it('should throw error when submitting with no answers', async () => {
      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await expect(result.current.submitExam()).rejects.toThrow(
        'No answers to submit. Please answer at least one question.'
      );
    });
  });

  describe('getAnswerForQuestion', () => {
    it('should return answer for a specific question', async () => {
      vi.spyOn(studentExamAPI, 'saveAnswer').mockResolvedValue(mockSaveAnswerResponse);

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      await act(async () => {
        await result.current.saveAnswer('q1', 'The answer is 4');
      });

      const answer = result.current.getAnswerForQuestion('q1');
      expect(answer).toBe('The answer is 4');
    });

    it('should return undefined for unanswered question', () => {
      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      const answer = result.current.getAnswerForQuestion('non-existent');
      expect(answer).toBeUndefined();
    });
  });

  describe('answeredCount', () => {
    it('should track number of answered questions', async () => {
      vi.spyOn(studentExamAPI, 'saveAnswer')
        .mockResolvedValueOnce({ saved: true, questionId: 'q1' })
        .mockResolvedValueOnce({ saved: true, questionId: 'q2' });

      const { result } = renderHook(() => useExamSubmission(mockAssignmentId));

      expect(result.current.answeredCount).toBe(0);

      await act(async () => {
        await result.current.saveAnswer('q1', 'Answer 1');
      });

      expect(result.current.answeredCount).toBe(1);

      await act(async () => {
        await result.current.saveAnswer('q2', 'Answer 2');
      });

      expect(result.current.answeredCount).toBe(2);
    });
  });
});
