import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OAuthButtons } from '../OAuthButtons';

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('OAuthButtons', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset location mock
    window.location.href = '';

    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'true';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render "Sign in with Google" button in login mode', () => {
      render(<OAuthButtons mode="login" />);

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should render "Sign up with Google" button in register mode', () => {
      render(<OAuthButtons mode="register" />);

      expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
    });

    it('should show "(Mock)" label when mock OAuth is enabled', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'true';

      render(<OAuthButtons mode="login" />);

      expect(screen.getByText('(Mock)')).toBeInTheDocument();
    });

    it('should not show "(Mock)" label when mock OAuth is disabled', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'false';

      render(<OAuthButtons mode="login" />);

      expect(screen.queryByText('(Mock)')).not.toBeInTheDocument();
    });

    it('should render divider with "Or continue with" text', () => {
      render(<OAuthButtons mode="login" />);

      expect(screen.getByText('Or continue with')).toBeInTheDocument();
    });

    it('should render Chrome icon', () => {
      const { container } = render(<OAuthButtons mode="login" />);

      // Chrome icon is rendered by lucide-react
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should disable button when disabled prop is true', () => {
      render(<OAuthButtons mode="login" disabled={true} />);

      const button = screen.getByRole('button', { name: /sign in with google/i });
      expect(button).toBeDisabled();
    });

    it('should enable button when disabled prop is false', () => {
      render(<OAuthButtons mode="login" disabled={false} />);

      const button = screen.getByRole('button', { name: /sign in with google/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Login Mode Behavior', () => {
    it('should open modal when button is clicked in login mode', () => {
      render(<OAuthButtons mode="login" />);

      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);

      // Modal should appear with role selection
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    });

    it('should not redirect immediately in login mode', () => {
      render(<OAuthButtons mode="login" />);

      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);

      // Should not redirect yet (modal opens first)
      expect(window.location.href).toBe('');
    });

    it('should redirect after selecting role from modal', () => {
      render(<OAuthButtons mode="login" />);

      // Click OAuth button to open modal
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);

      // Select Teacher role
      const teacherCard = screen.getByText('Teacher').closest('button');
      fireEvent.click(teacherCard!);

      // Should redirect with role parameter
      expect(window.location.href).toContain('/auth/google/mock?role=TEACHER');
    });
  });

  describe('Register Mode Behavior', () => {
    it('should redirect immediately when role is provided', () => {
      render(<OAuthButtons mode="register" role="TEACHER" />);

      const button = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(button);

      // Should redirect immediately without modal
      expect(window.location.href).toContain('/auth/google/mock?role=TEACHER');
    });

    it('should redirect with STUDENT role when provided', () => {
      render(<OAuthButtons mode="register" role="STUDENT" />);

      const button = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(button);

      expect(window.location.href).toContain('/auth/google/mock?role=STUDENT');
    });

    it('should open modal if no role is provided in register mode', () => {
      render(<OAuthButtons mode="register" />);

      const button = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(button);

      // Should open modal since no role was provided
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    });
  });

  describe('OAuth Endpoint Selection', () => {
    it('should use mock endpoint when NEXT_PUBLIC_USE_MOCK_OAUTH is true', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'true';

      render(<OAuthButtons mode="register" role="TEACHER" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(window.location.href).toContain('/auth/google/mock');
    });

    it('should use real OAuth endpoint when NEXT_PUBLIC_USE_MOCK_OAUTH is false', () => {
      process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'false';

      render(<OAuthButtons mode="register" role="TEACHER" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(window.location.href).toContain('/auth/google?');
      expect(window.location.href).not.toContain('/mock');
    });

    it('should use custom API URL from environment', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com';

      render(<OAuthButtons mode="register" role="TEACHER" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(window.location.href).toContain('https://custom-api.com');
    });

    it('should default to localhost:3001 if API_URL not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL;

      render(<OAuthButtons mode="register" role="TEACHER" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(window.location.href).toContain('http://localhost:3001');
    });
  });

  describe('Modal Integration', () => {
    it('should close modal when role is selected', () => {
      render(<OAuthButtons mode="login" />);

      // Open modal
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);

      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();

      // Select role
      const teacherCard = screen.getByText('Teacher').closest('button');
      fireEvent.click(teacherCard!);

      // Modal should close (component unmounts)
      expect(screen.queryByText('Choose Your Role')).not.toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', () => {
      render(<OAuthButtons mode="login" />);

      // Open modal
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);

      // Click Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Modal should close
      expect(screen.queryByText('Choose Your Role')).not.toBeInTheDocument();
    });

    it('should not show modal initially', () => {
      render(<OAuthButtons mode="login" />);

      expect(screen.queryByText('Choose Your Role')).not.toBeInTheDocument();
    });
  });
});
