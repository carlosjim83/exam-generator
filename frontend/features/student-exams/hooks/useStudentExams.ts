/**
 * useStudentExams Hook
 *
 * React hook for fetching assigned exams with automatic loading/error states.
 * Follows the same pattern as useDashboard hooks (useState + useEffect).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { studentExamAPI } from '../services/student-exam-api.service';
import type { StudentExamListItem } from '../types';

interface UseStudentExamsResult {
  exams: StudentExamListItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Get all exams assigned to the current student
 *
 * @returns Object containing exams array, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { exams, loading, error, refetch } = useStudentExams();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     {exams.map(exam => (
 *       <ExamCard key={exam.id} exam={exam} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useStudentExams(): UseStudentExamsResult {
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentExamAPI.getAssignedExams();
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assigned exams'));
      setExams([]); // Clear exams on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return { exams, loading, error, refetch: fetchExams };
}
