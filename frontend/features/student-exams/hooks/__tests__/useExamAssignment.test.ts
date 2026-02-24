/**
 * useExamAssignment Hook Tests
 *
 * TDD Red-Green-Refactor
 * Tests for React hook that manages starting and taking an exam
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExamAssignment } from '../useExamAssignment';
import { studentExamAPI } from '../../services/student-exam-api.service';
import type { StartExamResponse, ExamAssignment, ExamWithQuestions } from '../../types';

// Mock the API service singleton
vi.mock('../../services/student-exam-api.service', () => ({
  studentExamAPI: {
    startExam: vi.fn(),
  },
}));

describe('useExamAssignment', () => {
  const mockAssignmentId = 'assignment-123';

  // Mock TokenManager
  vi.mock('@/lib/api-client', () => ({
    TokenManager: {
      getAccessToken: vi.fn().mockReturnValue('test-jwt-token'),
    },
  }));

  const mockAssignment: ExamAssignment = {
    id: mockAssignmentId,
    examId: 'exam-1',
    studentId: 'student-1',
    status: 'IN_PROGRESS',
    startedAt: '2024-01-20T10:00:00Z',
    submittedAt: null,
    score: null,
    maxScore: 100,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  };

  const mockExam: ExamWithQuestions = {
    id: 'exam-1',
    title: 'Math Final Exam',
    description: 'Comprehensive math test',
    documentId: 'doc-1',
    createdBy: 'teacher-1',
    createdAt: '2024-01-10T10:00:00Z',
    questions: [
      { id: 'q1', text: 'What is 2+2?', order: 1 },
      { id: 'q2', text: 'What is 3+3?', order: 2 },
      { id: 'q3', text: 'What is 4+4?', order: 3 },
    ],
  };

  const mockStartExamResponse: StartExamResponse = {
    assignment: mockAssignment,
    exam: mockExam,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state before starting exam', () => {
      // Arrange & Act
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      // Assert
      expect(result.current.assignment).toBeNull();
      expect(result.current.exam).toBeNull();
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.isStarting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.startExam).toBe('function');
      expect(typeof result.current.nextQuestion).toBe('function');
      expect(typeof result.current.previousQuestion).toBe('function');
      expect(typeof result.current.goToQuestion).toBe('function');
    });
  });

  describe('Starting Exam', () => {
    it('should start exam successfully', async () => {
      // Arrange
      const startExamMock = vi
        .spyOn(studentExamAPI, 'startExam')
        .mockResolvedValue(mockStartExamResponse);

      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      // Act
      await act(async () => {
        await result.current.startExam();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isStarting).toBe(false);
      });

      expect(result.current.assignment).toEqual(mockAssignment);
      expect(result.current.exam).toEqual(mockExam);
      expect(result.current.error).toBeNull();
      expect(startExamMock).toHaveBeenCalledWith(mockAssignmentId);
      expect(startExamMock).toHaveBeenCalledTimes(1);
    });

    it('should set isStarting to true while starting exam', async () => {
      // Arrange
      let resolveStartExam: (value: StartExamResponse) => void;
      const delayedPromise = new Promise<StartExamResponse>((resolve) => {
        resolveStartExam = resolve;
      });

      vi.spyOn(studentExamAPI, 'startExam').mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      // Act
      act(() => {
        result.current.startExam();
      });

      // Assert: Should be starting
      await waitFor(() => {
        expect(result.current.isStarting).toBe(true);
      });

      // Complete the start
      act(() => {
        resolveStartExam!(mockStartExamResponse);
      });

      // Assert: Should be done
      await waitFor(() => {
        expect(result.current.isStarting).toBe(false);
      });
    });

    it('should handle start exam error', async () => {
      // Arrange
      const mockError = new Error('Failed to start exam');
      const startExamMock = vi.spyOn(studentExamAPI, 'startExam').mockRejectedValue(mockError);

      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      // Act
      await act(async () => {
        await result.current.startExam();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isStarting).toBe(false);
      });

      expect(result.current.assignment).toBeNull();
      expect(result.current.exam).toBeNull();
      expect(result.current.error).toEqual(mockError);
      expect(startExamMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Question Navigation', () => {
    beforeEach(async () => {
      vi.spyOn(studentExamAPI, 'startExam').mockResolvedValue(mockStartExamResponse);
    });

    it('should navigate to next question', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      expect(result.current.currentQuestionIndex).toBe(0);

      // Act
      act(() => {
        result.current.nextQuestion();
      });

      // Assert
      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('should not navigate past last question', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Act: Go to last question
      act(() => {
        result.current.goToQuestion(2); // Last question (index 2)
      });

      expect(result.current.currentQuestionIndex).toBe(2);

      // Act: Try to go past last
      act(() => {
        result.current.nextQuestion();
      });

      // Assert: Should stay at last question
      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('should navigate to previous question', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Go to question 2
      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      // Act
      act(() => {
        result.current.previousQuestion();
      });

      // Assert
      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should not navigate before first question', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      expect(result.current.currentQuestionIndex).toBe(0);

      // Act
      act(() => {
        result.current.previousQuestion();
      });

      // Assert: Should stay at first question
      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should navigate to specific question', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Act
      act(() => {
        result.current.goToQuestion(2);
      });

      // Assert
      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('should handle invalid question index gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Act: Try negative index
      act(() => {
        result.current.goToQuestion(-1);
      });

      // Assert: Should stay at current (0)
      expect(result.current.currentQuestionIndex).toBe(0);

      // Act: Try index beyond last
      act(() => {
        result.current.goToQuestion(999);
      });

      // Assert: Should stay at current (0)
      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('Helper Properties', () => {
    beforeEach(async () => {
      vi.spyOn(studentExamAPI, 'startExam').mockResolvedValue(mockStartExamResponse);
    });

    it('should provide currentQuestion', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Assert
      expect(result.current.currentQuestion).toEqual(mockExam.questions[0]);

      // Navigate
      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestion).toEqual(mockExam.questions[1]);
    });

    it('should provide totalQuestions', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Assert
      expect(result.current.totalQuestions).toBe(3);
    });

    it('should provide isLastQuestion', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Assert: Not last
      expect(result.current.isLastQuestion).toBe(false);

      // Navigate to last
      act(() => {
        result.current.goToQuestion(2);
      });

      // Assert: Is last
      expect(result.current.isLastQuestion).toBe(true);
    });

    it('should provide isFirstQuestion', async () => {
      // Arrange
      const { result } = renderHook(() => useExamAssignment(mockAssignmentId));

      await act(async () => {
        await result.current.startExam();
      });

      // Assert: Is first
      expect(result.current.isFirstQuestion).toBe(true);

      // Navigate away
      act(() => {
        result.current.nextQuestion();
      });

      // Assert: Not first
      expect(result.current.isFirstQuestion).toBe(false);
    });
  });
});
