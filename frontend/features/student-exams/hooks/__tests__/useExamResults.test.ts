/**
 * useExamResults Hook Tests
 *
 * TDD Red-Green-Refactor
 * Tests for hook that fetches exam results
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExamResults } from '../useExamResults';
import { studentExamAPI } from '../../services/student-exam-api.service';
import type { ExamResultsData } from '../../types';

// Mock the API service
vi.mock('../../services/student-exam-api.service', () => ({
  studentExamAPI: {
    getExamResults: vi.fn(),
  },
}));

describe('useExamResults', () => {
  const mockToken = 'test-jwt-token';
  const mockAssignmentId = 'assignment-123';

  const mockResults: ExamResultsData = {
    assignment: {
      id: mockAssignmentId,
      examId: 'exam-1',
      studentId: 'student-1',
      status: 'GRADED',
      startedAt: '2024-01-15T10:00:00Z',
      submittedAt: '2024-01-15T11:00:00Z',
      score: 85,
      maxScore: 100,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
    exam: {
      id: 'exam-1',
      title: 'Math Final Exam',
      description: 'Comprehensive math test',
      documentId: 'doc-1',
      createdBy: 'teacher-1',
      createdAt: '2024-01-01T10:00:00Z',
      questions: [
        { id: 'q1', text: 'What is 2 + 2?', order: 1 },
        { id: 'q2', text: 'What is 3 * 4?', order: 2 },
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
        updatedAt: '2024-01-15T12:00:00Z',
      },
      {
        id: 'answer-2',
        questionId: 'q2',
        answer: '11',
        isCorrect: false,
        feedback: 'The correct answer is 12',
        createdAt: '2024-01-15T10:10:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
      },
    ],
    score: 85,
    maxScore: 100,
    percentage: 85,
  };

  const mockGetExamResults = studentExamAPI.getExamResults as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with loading true', () => {
    mockGetExamResults.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useExamResults(mockAssignmentId, mockToken));

    expect(result.current.loading).toBe(true);
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return exam results successfully', async () => {
    mockGetExamResults.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useExamResults(mockAssignmentId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toEqual(mockResults);
    expect(result.current.error).toBeNull();
    expect(mockGetExamResults).toHaveBeenCalledWith(mockAssignmentId, mockToken);
  });

  it('should handle API errors gracefully', async () => {
    mockGetExamResults.mockRejectedValue(new Error('Results not available'));

    const { result } = renderHook(() => useExamResults(mockAssignmentId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toBeNull();
    expect(result.current.error).toEqual(new Error('Results not available'));
  });

  it('should not fetch if assignmentId is empty', () => {
    const { result } = renderHook(() => useExamResults('', mockToken));

    expect(result.current.loading).toBe(false);
    expect(result.current.results).toBeNull();
    expect(mockGetExamResults).not.toHaveBeenCalled();
  });

  it('should not fetch if token is empty', () => {
    const { result } = renderHook(() => useExamResults(mockAssignmentId, ''));

    expect(result.current.loading).toBe(false);
    expect(result.current.results).toBeNull();
    expect(mockGetExamResults).not.toHaveBeenCalled();
  });

  it('should provide score, maxScore, and percentage from results', async () => {
    mockGetExamResults.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useExamResults(mockAssignmentId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.score).toBe(85);
    expect(result.current.maxScore).toBe(100);
    expect(result.current.percentage).toBe(85);
  });

  it('should provide refetch function to reload results', async () => {
    mockGetExamResults.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useExamResults(mockAssignmentId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetExamResults).toHaveBeenCalledTimes(1);

    // Call refetch
    await result.current.refetch();

    expect(mockGetExamResults).toHaveBeenCalledTimes(2);
  });
});
