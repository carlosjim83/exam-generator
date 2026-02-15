/**
 * useExamSubmission Hook
 *
 * React hook for submitting answers and finalizing exam submission
 */

'use client';

import { useState, useCallback } from 'react';
import { studentExamAPI } from '../services/student-exam-api.service';
import type { StudentAnswer } from '../types';

interface UseExamSubmissionResult {
  answers: Record<string, StudentAnswer>;
  answeredCount: number;
  isSubmittingAnswer: boolean;
  isSubmittingExam: boolean;
  isExamSubmitted: boolean;
  submissionError: Error | null;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  submitExam: () => Promise<void>;
  getAnswerForQuestion: (questionId: string) => StudentAnswer | undefined;
}

/**
 * Hook for managing answer submissions and exam finalization
 *
 * @param assignmentId - The exam assignment ID
 * @param token - JWT authentication token
 * @returns Object containing submission state and functions
 */
export function useExamSubmission(assignmentId: string, token: string): UseExamSubmissionResult {
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);

  const submitAnswer = useCallback(
    async (questionId: string, answer: string) => {
      try {
        setIsSubmittingAnswer(true);
        setSubmissionError(null);
        const response = await studentExamAPI.submitAnswer(assignmentId, questionId, answer, token);
        setAnswers((prev) => ({
          ...prev,
          [questionId]: response.answer,
        }));
      } catch (err) {
        setSubmissionError(err instanceof Error ? err : new Error('Failed to submit answer'));
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [assignmentId, token]
  );

  const submitExam = useCallback(async () => {
    try {
      setIsSubmittingExam(true);
      setSubmissionError(null);
      await studentExamAPI.submitExam(assignmentId, token);
      setIsExamSubmitted(true);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err : new Error('Failed to submit exam'));
    } finally {
      setIsSubmittingExam(false);
    }
  }, [assignmentId, token]);

  const getAnswerForQuestion = useCallback((questionId: string) => answers[questionId], [answers]);

  const answeredCount = Object.keys(answers).length;

  return {
    answers,
    answeredCount,
    isSubmittingAnswer,
    isSubmittingExam,
    isExamSubmitted,
    submissionError,
    submitAnswer,
    submitExam,
    getAnswerForQuestion,
  };
}
