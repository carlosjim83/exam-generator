/**
 * ExamResults Component Tests
 *
 * TDD Red-Green-Refactor
 * Tests for component that displays graded exam results
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExamResults } from '../ExamResults';
import { useExamResults } from '../../hooks';
import type { ExamResultsData, Question, StudentAnswer } from '../../types';

// Mock the hook
vi.mock('../../hooks', () => ({
  useExamResults: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'results.title': 'Exam Results',
        'results.score': 'Score',
        'results.percentage': 'Percentage',
        'results.passed': 'Great job! You passed the exam.',
        'results.failed': 'Keep practicing! You can improve.',
        'results.questionBreakdown': 'Question Breakdown',
        'results.question': 'Question',
        'results.yourAnswer': 'Your Answer',
        'results.feedback': 'Feedback',
        'results.correctCount': 'Correct',
        'results.incorrectCount': 'Incorrect',
        'results.correct': 'Correct!',
        'results.incorrect': 'Incorrect.',
        'results.noResults': 'No Results Found',
        'results.errorLoading': 'Error Loading Results',
        'results.gradingInProgressTitle': 'Grading in Progress',
        'results.gradingInProgressMessage':
          'Your exam has been submitted and is being graded by your teacher. Check back later for your results.',
        'results.submittedOn': 'Submitted on',
        'examList.actions.viewResults': 'View Results',
        'examList.actions.backToExams': 'Back to Exams',
        'errors.retry': 'Retry',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('ExamResults', () => {
  const mockToken = 'test-jwt-token';
  const mockAssignmentId = 'assignment-123';

  const mockQuestions: Question[] = [
    { id: 'q1', text: 'What is 2 + 2?', order: 1 },
    { id: 'q2', text: 'What is the capital of France?', order: 2 },
    { id: 'q3', text: 'Name the largest planet in our solar system.', order: 3 },
  ];

  const mockAnswers: StudentAnswer[] = [
    {
      id: 'answer-1',
      questionId: 'q1',
      answer: '4',
      isCorrect: true,
      feedback: 'Correct! Well done.',
      createdAt: '2024-01-15T10:05:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
    {
      id: 'answer-2',
      questionId: 'q2',
      answer: 'London',
      isCorrect: false,
      feedback: 'Incorrect. The correct answer is Paris.',
      createdAt: '2024-01-15T10:10:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
    {
      id: 'answer-3',
      questionId: 'q3',
      answer: 'Jupiter',
      isCorrect: true,
      feedback: 'Correct!',
      createdAt: '2024-01-15T10:15:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
  ];

  const mockResults: ExamResultsData = {
    assignment: {
      id: mockAssignmentId,
      examId: 'exam-1',
      studentId: 'student-1',
      status: 'GRADED',
      startedAt: '2024-01-15T10:00:00Z',
      submittedAt: '2024-01-15T11:00:00Z',
      score: 67,
      maxScore: 100,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
    exam: {
      id: 'exam-1',
      title: 'General Knowledge Quiz',
      description: 'Test your knowledge',
      documentId: 'doc-1',
      createdBy: 'teacher-1',
      createdAt: '2024-01-01T10:00:00Z',
      questions: mockQuestions,
    },
    answers: mockAnswers,
    score: 67,
    maxScore: 100,
    percentage: 67,
  };

  const mockUseExamResults = useExamResults as ReturnType<typeof vi.fn>;

  const defaultUseExamResultsReturn = {
    results: null,
    loading: false,
    error: null,
    score: null,
    maxScore: null,
    percentage: null,
    status: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExamResults.mockReturnValue(defaultUseExamResultsReturn);
  });

  describe('Loading State', () => {
    it('should display loading skeleton when loading', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        loading: true,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByTestId('exam-results-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        error: new Error('Results not available'),
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/results not available/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        error: new Error('Network error'),
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Results Header', () => {
    it('should display exam title', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('General Knowledge Quiz')).toBeInTheDocument();
    });

    it('should display score summary', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/67\/100/)).toBeInTheDocument();
      expect(screen.getByText(/67%/)).toBeInTheDocument();
    });

    it('should display passing message for good score', () => {
      const passingResults = {
        ...mockResults,
        score: 85,
        percentage: 85,
      };
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: passingResults,
        score: 85,
        maxScore: 100,
        percentage: 85,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/great job/i)).toBeInTheDocument();
    });

    it('should display improvement message for low score', () => {
      const lowResults = {
        ...mockResults,
        score: 45,
        percentage: 45,
      };
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: lowResults,
        score: 45,
        maxScore: 100,
        percentage: 45,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/keep practicing/i)).toBeInTheDocument();
    });
  });

  describe('Question-by-Question Results', () => {
    it('should display all questions with answers', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText('Name the largest planet in our solar system.')).toBeInTheDocument();
    });

    it('should display student answers', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
    });

    it('should display correct/incorrect indicator for each answer', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      // Check for correct indicators (2 correct answers)
      const correctIcons = screen.getAllByTestId('correct-icon');
      expect(correctIcons).toHaveLength(2);

      // Check for incorrect indicators (1 incorrect answer)
      const incorrectIcons = screen.getAllByTestId('incorrect-icon');
      expect(incorrectIcons).toHaveLength(1);
    });

    it('should display feedback for each answer', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('Correct! Well done.')).toBeInTheDocument();
      expect(screen.getByText('Incorrect. The correct answer is Paris.')).toBeInTheDocument();
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });
  });

  describe('Statistics Summary', () => {
    it('should display number of correct answers', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/2 correct/i)).toBeInTheDocument();
      expect(screen.getByText(/1 incorrect/i)).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      const onBackMock = vi.fn();
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockResults,
        score: 67,
        maxScore: 100,
        percentage: 67,
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} onBack={onBackMock} />);

      const { default: userEvent } = await import('@testing-library/user-event');
      await userEvent.click(screen.getByRole('button', { name: /back to exams/i }));

      expect(onBackMock).toHaveBeenCalled();
    });
  });

  describe('SUBMITTED State (Grading in Progress)', () => {
    const mockSubmittedResults: ExamResultsData = {
      ...mockResults,
      assignment: {
        ...mockResults.assignment,
        status: 'SUBMITTED',
        submittedAt: '2024-01-15T11:00:00Z',
      },
    };

    it('should show grading in progress message when status is SUBMITTED', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockSubmittedResults,
        status: 'SUBMITTED',
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/grading in progress/i)).toBeInTheDocument();
    });

    it('should show exam title in submitted state', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockSubmittedResults,
        status: 'SUBMITTED',
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText('General Knowledge Quiz')).toBeInTheDocument();
    });

    it('should show submission date in submitted state', () => {
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockSubmittedResults,
        status: 'SUBMITTED',
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} />);

      expect(screen.getByText(/Submitted on:/i)).toBeInTheDocument();
    });

    it('should show back button in submitted state', async () => {
      const onBackMock = vi.fn();
      mockUseExamResults.mockReturnValue({
        ...defaultUseExamResultsReturn,
        results: mockSubmittedResults,
        status: 'SUBMITTED',
      });

      render(<ExamResults assignmentId={mockAssignmentId} token={mockToken} onBack={onBackMock} />);

      const { default: userEvent } = await import('@testing-library/user-event');
      await userEvent.click(screen.getByRole('button', { name: /back to exams/i }));

      expect(onBackMock).toHaveBeenCalled();
    });
  });
});
