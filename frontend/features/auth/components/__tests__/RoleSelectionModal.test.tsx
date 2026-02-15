import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleSelectionModal } from '../RoleSelectionModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.authenticationFailed': 'Authentication failed. Please try again.',
        'auth.chooseYourRole': 'Choose Your Role',
        'auth.signInWithGoogle': 'Sign in with Google as a teacher or student',
        'auth.teacher': 'Teacher',
        'auth.teacherDescription': 'Create and manage exams for your students',
        'auth.student': 'Student',
        'auth.studentDescription': 'Take exams and track your progress',
        'auth.orContinueWith': 'Or continue with',
        'auth.signIn': 'Sign in',
        'auth.signUp': 'Sign up',
        'auth.signingIn': 'Signing in',
        'auth.signingUp': 'Signing up',
        'auth.authenticating': 'Signing in...',
        'auth.passwordsDoNotMatch': 'Passwords do not match',
        'auth.passwordTooShort': 'Password must be at least 8 characters long',
        'auth.iAmA': 'I am a...',
        'auth.signingUpAs': 'Signing up as',
        'auth.withGoogle': 'with Google',
        'auth.with': 'with',
        cancel: 'Cancel',
        'common.clickToContinue': 'Click to continue',
        'common.with': 'with',
        'common.or': 'or',
        close: 'Close',
        success: 'Success',
        welcome: 'Welcome',
        loading: 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RoleSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectRole = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSelectRole: mockOnSelectRole,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<RoleSelectionModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Choose Your Role')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google as a teacher or student')).toBeInTheDocument();
    });

    it('should render teacher and student cards', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      expect(screen.getByText('Teacher')).toBeInTheDocument();
      expect(screen.getByText('Create and manage exams for your students')).toBeInTheDocument();

      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Take exams and track your progress')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      // Should have: X button, Teacher card, Student card, Cancel button
      expect(closeButtons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render cancel button', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should call onSelectRole with TEACHER when teacher card is clicked', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const teacherCard = screen.getByText('Teacher').closest('button');
      expect(teacherCard).toBeInTheDocument();

      fireEvent.click(teacherCard!);

      expect(mockOnSelectRole).toHaveBeenCalledWith('TEACHER');
      expect(mockOnSelectRole).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectRole with STUDENT when student card is clicked', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const studentCard = screen.getByText('Student').closest('button');
      expect(studentCard).toBeInTheDocument();

      fireEvent.click(studentCard!);

      expect(mockOnSelectRole).toHaveBeenCalledWith('STUDENT');
      expect(mockOnSelectRole).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after selecting a role', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const teacherCard = screen.getByText('Teacher').closest('button');
      fireEvent.click(teacherCard!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Actions', () => {
    it('should call onClose when backdrop is clicked', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      // The backdrop is the first div with fixed positioning
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      // Find the close button by looking for buttons without text content
      const buttons = screen.getAllByRole('button');
      // The X button should be the first one (before Teacher and Student cards)
      const closeButton = buttons[0];

      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hover States', () => {
    it('should update hover state on mouse enter and leave', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const teacherCard = screen.getByText('Teacher').closest('button');
      expect(teacherCard).toBeInTheDocument();

      // Mouse enter
      fireEvent.mouseEnter(teacherCard!);

      // Check if "Click to continue" badge appears
      const badges = screen.getAllByText('Click to continue');
      expect(badges.length).toBeGreaterThan(0);

      // Mouse leave
      fireEvent.mouseLeave(teacherCard!);
    });

    it('should show hover state for student card', () => {
      render(<RoleSelectionModal {...defaultProps} />);

      const studentCard = screen.getByText('Student').closest('button');
      expect(studentCard).toBeInTheDocument();

      fireEvent.mouseEnter(studentCard!);

      const badges = screen.getAllByText('Click to continue');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
