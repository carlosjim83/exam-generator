/**
 * useStudentExams Hook Tests
 *
 * TDD Red-Green-Refactor
 * Tests for React hook that fetches assigned exams for students
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStudentExams } from '../useStudentExams';
import { studentExamAPI } from '../../services/student-exam-api.service';
import type { StudentExamListItem } from '../../types';

// Mock the API service singleton
vi.mock('../../services/student-exam-api.service', () => ({
  studentExamAPI: {
    getAssignedExams: vi.fn(),
  },
}));

describe('useStudentExams', () => {
  const mockToken = 'test-jwt-token';

  const mockExams: StudentExamListItem[] = [
    {
      id: 'assignment-1',
      examId: 'exam-1',
      examTitle: 'Math Final Exam',
      examDescription: null,
      status: 'PENDING',
      startedAt: null,
      submittedAt: null,
      score: null,
      maxScore: 100,
      questionCount: 10,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'assignment-2',
      examId: 'exam-2',
      examTitle: 'Physics Midterm',
      examDescription: null,
      status: 'IN_PROGRESS',
      startedAt: '2024-01-16T09:00:00Z',
      submittedAt: null,
      score: null,
      maxScore: 100,
      questionCount: 20,
      createdAt: '2024-01-14T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial state with loading true', () => {
    // Arrange: Mock API to never resolve (simulate loading)
    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockImplementation(() => new Promise(() => {}));

    // Act
    const { result } = renderHook(() => useStudentExams(mockToken));

    // Assert
    expect(result.current.exams).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
    expect(getAssignedExamsMock).toHaveBeenCalledWith(mockToken);
  });

  it('should fetch and return exams successfully', async () => {
    // Arrange
    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockResolvedValue(mockExams);

    // Act
    const { result } = renderHook(() => useStudentExams(mockToken));

    // Assert: Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.exams).toEqual([]);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert: Final state
    expect(result.current.exams).toEqual(mockExams);
    expect(result.current.error).toBeNull();
    expect(getAssignedExamsMock).toHaveBeenCalledTimes(1);
    expect(getAssignedExamsMock).toHaveBeenCalledWith(mockToken);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockError = new Error('Network error');
    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useStudentExams(mockToken));

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.exams).toEqual([]);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.loading).toBe(false);
    expect(getAssignedExamsMock).toHaveBeenCalledTimes(1);
  });

  it('should refetch exams when refetch is called', async () => {
    // Arrange
    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockResolvedValue(mockExams);

    const { result } = renderHook(() => useStudentExams(mockToken));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getAssignedExamsMock).toHaveBeenCalledTimes(1);

    // Act: Trigger refetch
    await result.current.refetch();

    // Assert: Should call API again
    expect(getAssignedExamsMock).toHaveBeenCalledTimes(2);
    expect(result.current.exams).toEqual(mockExams);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty exams list', async () => {
    // Arrange
    const getAssignedExamsMock = vi.spyOn(studentExamAPI, 'getAssignedExams').mockResolvedValue([]);

    // Act
    const { result } = renderHook(() => useStudentExams(mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.exams).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should refetch when token changes', async () => {
    // Arrange
    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockResolvedValue(mockExams);

    const { result, rerender } = renderHook(({ token }) => useStudentExams(token), {
      initialProps: { token: 'token-1' },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getAssignedExamsMock).toHaveBeenCalledWith('token-1');
    expect(getAssignedExamsMock).toHaveBeenCalledTimes(1);

    // Act: Change token
    rerender({ token: 'token-2' });

    // Assert: Should refetch with new token
    await waitFor(() => {
      expect(getAssignedExamsMock).toHaveBeenCalledWith('token-2');
    });

    expect(getAssignedExamsMock).toHaveBeenCalledTimes(2);
  });

  it('should successfully refetch and update data', async () => {
    // Arrange
    const initialExams = [mockExams[0]];
    const updatedExams = mockExams;

    const getAssignedExamsMock = vi
      .spyOn(studentExamAPI, 'getAssignedExams')
      .mockResolvedValueOnce(initialExams) // First call
      .mockResolvedValueOnce(updatedExams); // Second call (refetch)

    const { result } = renderHook(() => useStudentExams(mockToken));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.exams).toEqual(initialExams);

    // Act: Trigger refetch
    await result.current.refetch();

    // Assert: Should have updated exams
    await waitFor(() => {
      expect(result.current.exams).toEqual(updatedExams);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getAssignedExamsMock).toHaveBeenCalledTimes(2);
  });
});
