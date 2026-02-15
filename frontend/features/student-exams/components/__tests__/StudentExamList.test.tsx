/**
 * StudentExamList Component Tests
 *
 * TDD Red-Green-Refactor
 * Tests for component that displays assigned exams for students
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StudentExamList } from '../StudentExamList';
import { useStudentExams } from '../../hooks';
import type { StudentExamListItem } from '../../types';

// Mock the hook
vi.mock('../../hooks', () => ({
  useStudentExams: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'examList.errorLoading': 'Error Loading Exams',
        'examList.noExams': 'No Exams Assigned',
        'dashboard.noExams': 'No exams assigned yet',
        'examList.status.PENDING': 'Pending',
        'examList.status.IN_PROGRESS': 'In Progress',
        'examList.status.SUBMITTED': 'Submitted',
        'examList.status.GRADED': 'Graded',
        'examList.actions.start': 'Start Exam',
        'examList.actions.continue': 'Continue',
        'examList.actions.viewResults': 'View Results',
        'examList.questions': 'questions',
        'examList.assigned': 'Assigned',
        'results.score': 'Score',
        'errors.retry': 'Retry',
      };
      return translations[key] || key;
    },
  }),
}));

describe('StudentExamList', () => {
  const mockToken = 'test-jwt-token';

  const mockExams: StudentExamListItem[] = [
    {
      id: 'assignment-1',
      examId: 'exam-1',
      examTitle: 'Math Final Exam',
      examDescription: 'Comprehensive math test',
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
    {
      id: 'assignment-3',
      examId: 'exam-3',
      examTitle: 'History Quiz',
      examDescription: 'Chapter 5 quiz',
      status: 'GRADED',
      startedAt: '2024-01-10T09:00:00Z',
      submittedAt: '2024-01-10T10:00:00Z',
      score: 85,
      maxScore: 100,
      questionCount: 15,
      createdAt: '2024-01-08T10:00:00Z',
    },
  ];

  const mockUseStudentExams = useStudentExams as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton when loading', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByTestId('student-exam-list-loading')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no exams', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getAllByText(/no exams assigned/i)).toHaveLength(2);
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [],
        loading: false,
        error: new Error('Failed to fetch exams'),
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText(/failed to fetch exams/i)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const refetchMock = vi.fn();
      mockUseStudentExams.mockReturnValue({
        exams: [],
        loading: false,
        error: new Error('Network error'),
        refetch: refetchMock,
      });

      render(<StudentExamList token={mockToken} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe('Exam List Display', () => {
    it('should display list of exams', () => {
      mockUseStudentExams.mockReturnValue({
        exams: mockExams,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText('Math Final Exam')).toBeInTheDocument();
      expect(screen.getByText('Physics Midterm')).toBeInTheDocument();
      expect(screen.getByText('History Quiz')).toBeInTheDocument();
    });

    it('should display exam descriptions when available', () => {
      mockUseStudentExams.mockReturnValue({
        exams: mockExams,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText('Comprehensive math test')).toBeInTheDocument();
      expect(screen.getByText('Chapter 5 quiz')).toBeInTheDocument();
    });

    it('should display question count for each exam', () => {
      mockUseStudentExams.mockReturnValue({
        exams: mockExams,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText(/10 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/20 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/15 questions/i)).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display PENDING status badge', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[0]], // PENDING exam
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display IN_PROGRESS status badge', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[1]], // IN_PROGRESS exam
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should display GRADED status badge with score', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[2]], // GRADED exam
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByText('Graded')).toBeInTheDocument();
      expect(screen.getByText(/85\/100/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show "Start Exam" button for PENDING exams', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[0]], // PENDING
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByRole('button', { name: /start exam/i })).toBeInTheDocument();
    });

    it('should show "Continue Exam" button for IN_PROGRESS exams', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[1]], // IN_PROGRESS
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByRole('button', { name: /continue exam/i })).toBeInTheDocument();
    });

    it('should show "View Results" button for GRADED exams', () => {
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[2]], // GRADED
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} />);

      expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument();
    });
  });

  describe('onExamSelect callback', () => {
    it('should call onExamSelect when exam action is clicked', async () => {
      const onExamSelectMock = vi.fn();
      mockUseStudentExams.mockReturnValue({
        exams: [mockExams[0]],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<StudentExamList token={mockToken} onExamSelect={onExamSelectMock} />);

      const startButton = screen.getByRole('button', { name: /start exam/i });
      await userEvent.click(startButton);

      expect(onExamSelectMock).toHaveBeenCalledWith(mockExams[0]);
    });
  });
});
