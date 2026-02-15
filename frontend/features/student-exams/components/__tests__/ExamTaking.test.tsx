/**
 * ExamTaking Component Tests
 *
 * TDD Red-Green-Refactor
 * Tests for the main exam-taking experience component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExamTaking } from '../ExamTaking';
import { useExamAssignment, useExamSubmission } from '../../hooks';
import type { ExamAssignment, ExamWithQuestions, Question, StudentAnswer } from '../../types';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useExamAssignment: vi.fn(),
  useExamSubmission: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'examTaking.ready': 'Ready to Start?',
        'examTaking.starting': 'Starting Exam',
        'examTaking.startButton': 'Start Exam',
        'examTaking.success.title': 'Exam Submitted Successfully!',
        'examTaking.yourAnswer': 'Your Answer',
        'examTaking.saveAnswer': 'Save Answer',
        'examTaking.previousQuestion': 'Previous',
        'examTaking.nextQuestion': 'Next',
        'examTaking.submitExam': 'Submit Exam',
        'examTaking.of': 'of',
        'examTaking.question': 'Question',
        'examDetail.questions': 'Questions',
        'examList.questions': 'questions',
        'examList.answered': 'answered',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ExamTaking', () => {
  const mockToken = 'test-jwt-token';
  const mockAssignmentId = 'assignment-123';

  const mockQuestions: Question[] = [
    { id: 'q1', text: 'What is 2 + 2?', order: 1 },
    { id: 'q2', text: 'What is the capital of France?', order: 2 },
    { id: 'q3', text: 'Explain the theory of relativity.', order: 3 },
  ];

  const mockExam: ExamWithQuestions = {
    id: 'exam-1',
    title: 'Math & Science Exam',
    description: 'A comprehensive test',
    documentId: 'doc-1',
    createdBy: 'teacher-1',
    createdAt: '2024-01-15T10:00:00Z',
    questions: mockQuestions,
  };

  const mockAssignment: ExamAssignment = {
    id: mockAssignmentId,
    examId: 'exam-1',
    studentId: 'student-1',
    status: 'IN_PROGRESS',
    startedAt: '2024-01-15T10:00:00Z',
    submittedAt: null,
    score: null,
    maxScore: 100,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockUseExamAssignment = useExamAssignment as ReturnType<typeof vi.fn>;
  const mockUseExamSubmission = useExamSubmission as ReturnType<typeof vi.fn>;

  const defaultExamAssignmentReturn = {
    assignment: null,
    exam: null,
    currentQuestionIndex: 0,
    currentQuestion: null,
    totalQuestions: 0,
    isFirstQuestion: true,
    isLastQuestion: false,
    isStarting: false,
    error: null,
    startExam: vi.fn(),
    nextQuestion: vi.fn(),
    previousQuestion: vi.fn(),
    goToQuestion: vi.fn(),
  };

  const defaultExamSubmissionReturn = {
    answers: {},
    answeredCount: 0,
    isSubmittingAnswer: false,
    isSubmittingExam: false,
    isExamSubmitted: false,
    submissionError: null,
    submitAnswer: vi.fn(),
    submitExam: vi.fn(),
    getAnswerForQuestion: vi.fn().mockReturnValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExamAssignment.mockReturnValue(defaultExamAssignmentReturn);
    mockUseExamSubmission.mockReturnValue(defaultExamSubmissionReturn);
  });

  describe('Pre-Start State', () => {
    it('should display start exam button when exam not started', () => {
      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /start exam/i })).toBeInTheDocument();
    });

    it('should display loading state while starting exam', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        isStarting: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/starting exam/i)).toBeInTheDocument();
    });

    it('should call startExam when start button is clicked', async () => {
      const startExamMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        startExam: startExamMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      await userEvent.click(screen.getByRole('button', { name: /start exam/i }));

      expect(startExamMock).toHaveBeenCalled();
    });

    it('should display error when starting exam fails', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        error: new Error('Failed to start exam'),
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/failed to start exam/i)).toBeInTheDocument();
    });
  });

  describe('Exam Header', () => {
    it('should display exam title when exam is loaded', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('Math & Science Exam')).toBeInTheDocument();
    });

    it('should display question progress (e.g., "Question 1 of 3")', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
    });

    it('should display answered count', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        answeredCount: 1,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/1 of 3 answered/i)).toBeInTheDocument();
    });
  });

  describe('Question Display', () => {
    it('should display current question text', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    });

    it('should display text area for answer input', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('textbox', { name: /your answer/i })).toBeInTheDocument();
    });

    it('should pre-fill answer if already answered', () => {
      const existingAnswer: StudentAnswer = {
        id: 'answer-1',
        questionId: 'q1',
        answer: 'The answer is 4',
        createdAt: '2024-01-15T10:05:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
      };

      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        answers: { q1: existingAnswer },
        getAnswerForQuestion: vi.fn().mockReturnValue(existingAnswer),
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const textarea = screen.getByRole('textbox', { name: /your answer/i });
      expect(textarea).toHaveValue('The answer is 4');
    });
  });

  describe('Answer Submission', () => {
    it('should have a save answer button', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /save answer/i })).toBeInTheDocument();
    });

    it('should call submitAnswer when save button is clicked', async () => {
      const submitAnswerMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        submitAnswer: submitAnswerMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const textarea = screen.getByRole('textbox', { name: /your answer/i });
      await userEvent.type(textarea, 'My answer is 4');

      const saveButton = screen.getByRole('button', { name: /save answer/i });
      await userEvent.click(saveButton);

      expect(submitAnswerMock).toHaveBeenCalledWith('q1', 'My answer is 4');
    });

    it('should disable save button while submitting answer', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        isSubmittingAnswer: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when answer is empty', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const saveButton = screen.getByRole('button', { name: /save answer/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should display previous button', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[1],
        currentQuestionIndex: 1,
        totalQuestions: 3,
        isFirstQuestion: false,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    it('should display next button', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isLastQuestion: false,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should disable previous button on first question', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isFirstQuestion: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('should call previousQuestion when previous button is clicked', async () => {
      const previousQuestionMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[1],
        currentQuestionIndex: 1,
        totalQuestions: 3,
        isFirstQuestion: false,
        previousQuestion: previousQuestionMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      await userEvent.click(screen.getByRole('button', { name: /previous/i }));

      expect(previousQuestionMock).toHaveBeenCalled();
    });

    it('should call nextQuestion when next button is clicked', async () => {
      const nextQuestionMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        isLastQuestion: false,
        nextQuestion: nextQuestionMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      await userEvent.click(screen.getByRole('button', { name: /next/i }));

      expect(nextQuestionMock).toHaveBeenCalled();
    });

    it('should display question navigation dots', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const dots = screen.getAllByTestId(/question-dot/i);
      expect(dots).toHaveLength(3);
    });

    it('should highlight answered questions in navigation dots', () => {
      const answeredQuestion: StudentAnswer = {
        id: 'answer-1',
        questionId: 'q1',
        answer: '4',
        createdAt: '2024-01-15T10:05:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
      };

      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[1],
        currentQuestionIndex: 1,
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        answers: { q1: answeredQuestion },
        answeredCount: 1,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const dot1 = screen.getByTestId('question-dot-0');
      expect(dot1).toHaveClass('answered');
    });

    it('should navigate to question when dot is clicked', async () => {
      const goToQuestionMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        currentQuestionIndex: 0,
        totalQuestions: 3,
        goToQuestion: goToQuestionMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      const dot2 = screen.getByTestId('question-dot-1');
      await userEvent.click(dot2);

      expect(goToQuestionMock).toHaveBeenCalledWith(1);
    });
  });

  describe('Submit Exam', () => {
    it('should display submit exam button on last question', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[2],
        currentQuestionIndex: 2,
        totalQuestions: 3,
        isLastQuestion: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /submit exam/i })).toBeInTheDocument();
    });

    it('should call submitExam when submit button is clicked', async () => {
      const submitExamMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[2],
        currentQuestionIndex: 2,
        totalQuestions: 3,
        isLastQuestion: true,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        submitExam: submitExamMock,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      // Click submit button to open dialog
      await userEvent.click(screen.getByRole('button', { name: /submit exam/i }));

      // Confirm in the dialog
      const confirmButton = await screen.findByRole('button', { name: /^submit exam$/i });
      await userEvent.click(confirmButton);

      expect(submitExamMock).toHaveBeenCalled();
    });

    it('should show loading state while submitting exam', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[2],
        currentQuestionIndex: 2,
        totalQuestions: 3,
        isLastQuestion: true,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        isSubmittingExam: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });

    it.skip('should show confirmation dialog before submitting', async () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[2],
        currentQuestionIndex: 2,
        totalQuestions: 3,
        isLastQuestion: true,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        answeredCount: 2,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      await userEvent.click(screen.getByRole('button', { name: /submit exam/i }));

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  describe('Exam Submitted State', () => {
    it('should display success message when exam is submitted', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        isExamSubmitted: true,
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/exam submitted successfully/i)).toBeInTheDocument();
    });

    it('should call onComplete callback when exam is submitted', () => {
      const onCompleteMock = vi.fn();
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        isExamSubmitted: true,
      });

      render(
        <ExamTaking assignmentId={mockAssignmentId} token={mockToken} onComplete={onCompleteMock} />
      );

      expect(onCompleteMock).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display submission error message', () => {
      mockUseExamAssignment.mockReturnValue({
        ...defaultExamAssignmentReturn,
        assignment: mockAssignment,
        exam: mockExam,
        currentQuestion: mockQuestions[0],
        totalQuestions: 3,
      });
      mockUseExamSubmission.mockReturnValue({
        ...defaultExamSubmissionReturn,
        submissionError: new Error('Network error'),
      });

      render(<ExamTaking assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
