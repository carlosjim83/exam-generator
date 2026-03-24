/**
 * useExamSubmission Hook
 *
 * React hook for saving answers and submitting exam
 */

'use client';

import { useState, useCallback } from 'react';
import { studentExamAPI } from '../services/student-exam-api.service';

interface UseExamSubmissionResult {
  savedAnswers: Record<string, string>;
  answeredCount: number;
  isSavingAnswer: boolean;
  isSubmittingExam: boolean;
  isExamSubmitted: boolean;
  submissionError: Error | null;
  saveAnswer: (questionId: string, answer: string) => Promise<void>;
  submitExam: () => Promise<void>;
  getAnswerForQuestion: (questionId: string) => string | undefined;
}

/**
 * Hook for managing answer saving and exam submission
 *
 * - saveAnswer: Saves a single answer WITHOUT submitting the exam
 * - submitExam: Finalizes the exam with all saved answers
 *
 * @param assignmentId - The exam assignment ID
 * @returns Object containing submission state and functions
 */
export function useExamSubmission(assignmentId: string): UseExamSubmissionResult {
  // Local state for saved answers (questionId -> answerText)
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);

  /**
   * Save a single answer to the backend
   * This does NOT submit/finalize the exam
   */
  const saveAnswer = useCallback(
    async (questionId: string, answer: string) => {
      try {
        setIsSavingAnswer(true);
        setSubmissionError(null);

        await studentExamAPI.saveAnswer(assignmentId, questionId, answer);

        // Update local state
        setSavedAnswers((prev) => ({
          ...prev,
          [questionId]: answer,
        }));
      } catch (err) {
        setSubmissionError(err instanceof Error ? err : new Error('Failed to save answer'));
        throw err;
      } finally {
        setIsSavingAnswer(false);
      }
    },
    [assignmentId]
  );

  /**
   * Submit the exam (finalize)
   * This sends all saved answers and marks the exam as SUBMITTED
   */
  const submitExam = useCallback(async () => {
    try {
      setIsSubmittingExam(true);
      setSubmissionError(null);

      // Convert saved answers to array format
      const answers = Object.entries(savedAnswers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }));

      if (answers.length === 0) {
        throw new Error('No answers to submit. Please answer at least one question.');
      }

      await studentExamAPI.submitExam(assignmentId, answers);
      setIsExamSubmitted(true);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err : new Error('Failed to submit exam'));
      throw err;
    } finally {
      setIsSubmittingExam(false);
    }
  }, [assignmentId, savedAnswers]);

  const getAnswerForQuestion = useCallback(
    (questionId: string) => savedAnswers[questionId],
    [savedAnswers]
  );

  const answeredCount = Object.keys(savedAnswers).length;

  return {
    savedAnswers,
    answeredCount,
    isSavingAnswer,
    isSubmittingExam,
    isExamSubmitted,
    submissionError,
    saveAnswer,
    submitExam,
    getAnswerForQuestion,
  };
}
