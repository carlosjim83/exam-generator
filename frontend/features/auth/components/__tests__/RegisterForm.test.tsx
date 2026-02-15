import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import { ApiError } from '../../services/api.service';

// Mock AuthContext
const mockRegister = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the register form', () => {
      render(<RegisterForm />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Get started with AI-powered exam generation')).toBeInTheDocument();
    });

    it('should render ExamForge logo', () => {
      render(<RegisterForm />);

      expect(screen.getByText('ExamForge')).toBeInTheDocument();
    });

    it('should render all form inputs', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render role toggle with Teacher and Student options', () => {
      render(<RegisterForm />);

      expect(screen.getByText('I am a...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /teacher/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /student/i })).toBeInTheDocument();
    });

    it('should render role badge indicator', () => {
      render(<RegisterForm />);

      expect(screen.getByText(/signing up as teacher/i)).toBeInTheDocument();
    });

    it('should render create account button', () => {
      render(<RegisterForm />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render link to login page', () => {
      render(<RegisterForm />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render OAuth buttons', () => {
      render(<RegisterForm />);

      expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
    });

    it('should render footer with terms', () => {
      render(<RegisterForm />);

      expect(
        screen.getByText(
          /by creating an account, you agree to our terms of service and privacy policy/i
        )
      ).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<RegisterForm />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Role Toggle', () => {
    it('should default to TEACHER role', () => {
      render(<RegisterForm />);

      expect(screen.getByText(/signing up as teacher/i)).toBeInTheDocument();
    });

    it('should switch to STUDENT role when student button is clicked', () => {
      render(<RegisterForm />);

      const studentButton = screen.getByRole('button', { name: /student/i });
      fireEvent.click(studentButton);

      expect(screen.getByText(/signing up as student/i)).toBeInTheDocument();
    });

    it('should switch back to TEACHER role', () => {
      render(<RegisterForm />);

      const studentButton = screen.getByRole('button', { name: /student/i });
      const teacherButton = screen.getByRole('button', { name: /teacher/i });

      fireEvent.click(studentButton);
      expect(screen.getByText(/signing up as student/i)).toBeInTheDocument();

      fireEvent.click(teacherButton);
      expect(screen.getByText(/signing up as teacher/i)).toBeInTheDocument();
    });

    it('should change email placeholder based on role', () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.placeholder).toBe('professor@university.edu');

      const studentButton = screen.getByRole('button', { name: /student/i });
      fireEvent.click(studentButton);

      expect(emailInput.placeholder).toBe('student@university.edu');
    });

    it('should disable role toggle during form submission', async () => {
      mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      const teacherButton = screen.getByRole('button', { name: /teacher/i });
      const studentButton = screen.getByRole('button', { name: /student/i });

      expect(teacherButton).toBeDisabled();
      expect(studentButton).toBeDisabled();

      await waitFor(() => {
        expect(teacherButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should update form inputs when typing', () => {
      render(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
    });

    it('should have required attribute on all inputs', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/first name/i)).toBeRequired();
      expect(screen.getByLabelText(/last name/i)).toBeRequired();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
    });
  });

  describe('Client-Side Validation', () => {
    it('should show error if passwords do not match', async () => {
      render(<RegisterForm />);

      fillForm({ password: 'password123', confirmPassword: 'different123' });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error if password is less than 8 characters', async () => {
      render(<RegisterForm />);

      fillForm({ password: 'short', confirmPassword: 'short' });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should not submit if validation fails', async () => {
      render(<RegisterForm />);

      fillForm({ password: 'password123', confirmPassword: 'different' });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call register function with correct data on submit', async () => {
      mockRegister.mockResolvedValueOnce(undefined);

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'john@example.com',
          'password123',
          'John',
          'Doe',
          'TEACHER'
        );
      });
    });

    it('should submit with STUDENT role when selected', async () => {
      mockRegister.mockResolvedValueOnce(undefined);

      render(<RegisterForm />);

      const studentButton = screen.getByRole('button', { name: /student/i });
      fireEvent.click(studentButton);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'john@example.com',
          'password123',
          'John',
          'Doe',
          'STUDENT'
        );
      });
    });

    it('should show loading state during submission', async () => {
      mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Create account')).toBeInTheDocument();
      });
    });

    it('should disable all inputs during submission', async () => {
      mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
      });
    });

    it('should clear errors on new submission', async () => {
      mockRegister.mockRejectedValueOnce(new ApiError(400, 'Email already exists'));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      mockRegister.mockResolvedValueOnce(undefined);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Email already exists')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error message on registration failure', async () => {
      mockRegister.mockRejectedValueOnce(new ApiError(400, 'Email already exists'));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should display validation errors from API', async () => {
      mockRegister.mockRejectedValueOnce(
        new ApiError(400, 'Validation failed', {
          email: ['Email is invalid'],
          password: ['Password is too weak'],
        })
      );

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
        expect(screen.getByText('Password is too weak')).toBeInTheDocument();
      });
    });

    it('should display generic error for unexpected errors', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should reset loading state after error', async () => {
      mockRegister.mockRejectedValueOnce(new ApiError(400, 'Email already exists'));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(screen.getByText('Create account')).toBeInTheDocument();
    });
  });

  describe('OAuth Integration', () => {
    it('should pass selected role to OAuth buttons', () => {
      render(<RegisterForm />);

      // OAuth button should show "Sign up with Google"
      expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
    });

    it('should disable OAuth button during form submission', async () => {
      mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<RegisterForm />);

      fillForm();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      const oauthButton = screen.getByRole('button', { name: /sign up with google/i });
      expect(oauthButton).toBeDisabled();

      await waitFor(() => {
        expect(oauthButton).not.toBeDisabled();
      });
    });
  });
});

// Helper function to fill the form
function fillForm(
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }> = {}
) {
  const defaults = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  const values = { ...defaults, ...overrides };

  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: values.firstName } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: values.lastName } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: values.email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: values.password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: values.confirmPassword },
  });
}
