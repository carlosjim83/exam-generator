/**
 * useExamAssignment Hook
 *
 * React hook for starting an exam and managing exam-taking state
 * Includes question navigation and current question tracking
 */

'use client';

import { useState, useCallback } from 'react';
import { studentExamAPI } from '../services/student-exam-api.service';
import type { ExamAssignment, ExamWithQuestions, Question } from '../types';

interface UseExamAssignmentResult {
  assignment: ExamAssignment | null;
  exam: ExamWithQuestions | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  totalQuestions: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isStarting: boolean;
  error: Error | null;
  startExam: () => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
}

/**
 * Hook for managing exam assignment and question navigation
 *
 * @param assignmentId - The exam assignment ID
 * @param token - JWT authentication token
 * @returns Object containing assignment data, navigation functions, and state
 *
 * @example
 * ```tsx
 * const {
 *   assignment,
 *   exam,
 *   currentQuestion,
 *   isStarting,
 *   startExam,
 *   nextQuestion,
 *   previousQuestion,
 * } = useExamAssignment(assignmentId, token);
 *
 * // Start the exam
 * <button onClick={startExam} disabled={isStarting}>
 *   {isStarting ? 'Starting...' : 'Start Exam'}
 * </button>
 *
 * // Display current question
 * {currentQuestion && (
 *   <div>
 *     <h2>{currentQuestion.text}</h2>
 *     <button onClick={previousQuestion}>Previous</button>
 *     <button onClick={nextQuestion}>Next</button>
 *   </div>
 * )}
 * ```
 */
export function useExamAssignment(assignmentId: string, token: string): UseExamAssignmentResult {
  const [assignment, setAssignment] = useState<ExamAssignment | null>(null);
  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startExam = useCallback(async () => {
    try {
      setIsStarting(true);
      setError(null);
      const response = await studentExamAPI.startExam(assignmentId, token);
      setAssignment(response.assignment);
      setExam(response.exam);
      setCurrentQuestionIndex(0); // Reset to first question
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start exam'));
    } finally {
      setIsStarting(false);
    }
  }, [assignmentId, token]);

  const nextQuestion = useCallback(() => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [exam, currentQuestionIndex]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (exam && index >= 0 && index < exam.questions.length) {
        setCurrentQuestionIndex(index);
      }
    },
    [exam]
  );

  // Derived state
  const currentQuestion = exam?.questions[currentQuestionIndex] || null;
  const totalQuestions = exam?.questions.length || 0;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = exam ? currentQuestionIndex === exam.questions.length - 1 : false;

  return {
    assignment,
    exam,
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    isStarting,
    error,
    startExam,
    nextQuestion,
    previousQuestion,
    goToQuestion,
  };
}
