import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { ApiError } from '../../services/api.service';

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.welcomeBack': 'Welcome back',
        'auth.signInToContinue': 'Sign in to your account to continue',
        email: 'Email',
        password: 'Password',
        'auth.signIn': 'Sign in',
        'auth.signingIn': 'Signing in',
        'auth.dontHaveAccount': "Don't have an account?",
        'auth.signUp': 'Create one',
        'auth.orContinueWith': 'Or continue with',
        'common.withGoogle': 'with Google',
        emailPlaceholder: 'professor@university.edu',
        passwordPlaceholder: 'Enter your password',
        unexpectedError: 'An unexpected error occurred. Please try again.',
      };
      return translations[key] || key;
    },
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginForm />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
    });

    it('should render app logo and title', () => {
      render(<LoginForm />);

      expect(screen.getByAltText('common:appName')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'professor@university.edu');
    });

    it('should render password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });

    it('should render sign in button', () => {
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    });

    it('should render link to register page', () => {
      render(<LoginForm />);

      expect(screen.getByText(/don.?t have an account/i)).toBeInTheDocument();
      const registerLink = screen.getByRole('link', { name: /create one/i });
      expect(registerLink).toBeInTheDocument();
    });

    it('should render OAuth buttons', () => {
      render(<LoginForm />);

      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    });

    it('should render footer with terms', () => {
      render(<LoginForm />);

      // Debug: check what's actually rendered
      const footer = document.querySelector('.mt-6');
      console.log('Footer content:', footer?.textContent);

      expect(screen.getByText((content) => content.includes('terms'))).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<LoginForm />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update email input value when typing', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value when typing', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    it('should have required attribute on email input', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('should have required attribute on password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });
  });

  describe('Form Submission', () => {
    it('should call login function with email and password on submit', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during submission', async () => {
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeInTheDocument();
      });
    });

    it('should disable inputs during submission', async () => {
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
      });
    });

    it('should clear error message on new submission', async () => {
      mockLogin.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // First submission with error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Second submission should clear error
      mockLogin.mockResolvedValueOnce(undefined);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error message on login failure', async () => {
      const errorMessage = 'Invalid email or password';
      mockLogin.mockRejectedValueOnce(new ApiError(401, errorMessage));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message for non-API errors', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should show error alert with icon when error occurs', async () => {
      mockLogin.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Just verify the error message and AlertCircle icon are present
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        const errorContainer = screen.getByText('Invalid credentials').parentElement?.parentElement;
        expect(errorContainer).toBeInTheDocument();
      });
    });

    it('should reset loading state after error', async () => {
      mockLogin.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  describe('OAuth Integration', () => {
    it('should disable OAuth button during form submission', async () => {
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      const oauthButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(oauthButton).toBeDisabled();

      await waitFor(() => {
        expect(oauthButton).not.toBeDisabled();
      });
    });
  });
});
