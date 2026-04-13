/**
 * useExamResults Hook
 *
 * React hook for fetching exam results after grading
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { studentExamAPI } from '../services/student-exam-api.service';
import type { ExamResultsData } from '../types';

interface UseExamResultsReturn {
  results: ExamResultsData | null;
  loading: boolean;
  error: Error | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching exam results
 *
 * @param assignmentId - The exam assignment ID
 * @returns Object containing results data, loading state, and error
 */
export function useExamResults(assignmentId: string): UseExamResultsReturn {
  const [results, setResults] = useState<ExamResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(async () => {
    if (!assignmentId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await studentExamAPI.getExamResults(assignmentId);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch exam results'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) {
      fetchResults();
    }
  }, [assignmentId, fetchResults]);

  // Derived values
  const score = results?.score ?? null;
  const maxScore = results?.maxScore ?? null;
  const percentage = results?.percentage ?? null;
  const status = results?.assignment?.status ?? null;

  return {
    results,
    loading,
    error,
    score,
    maxScore,
    percentage,
    status,
    refetch: fetchResults,
  };
}
