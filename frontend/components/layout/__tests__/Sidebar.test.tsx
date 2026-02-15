import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: mockPush }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard:navigation.dashboard': 'Dashboard',
        'dashboard:navigation.myLibrary': 'My Library',
        'dashboard:navigation.myExams': 'My Exams',
        'dashboard:navigation.uploadDocument': 'Upload Document',
        'dashboard:navigation.settings': 'Settings',
        'common:logout': 'Logout',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useAuth - will be configured per test
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default auth state - logged in user
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
      },
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
    });
  });

  describe('User Profile Section', () => {
    it('should display the logged in user name', () => {
      render(<Sidebar />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display the logged in user email', () => {
      render(<Sidebar />);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should display user initials in avatar', () => {
      render(<Sidebar />);

      // JD = John Doe initials
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display different user info when user changes', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-456',
          email: 'maria.garcia@school.edu',
          firstName: 'Maria',
          lastName: 'Garcia',
          role: 'STUDENT',
        },
        isAuthenticated: true,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Sidebar />);

      expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
      expect(screen.getByText('maria.garcia@school.edu')).toBeInTheDocument();
      expect(screen.getByText('MG')).toBeInTheDocument();
    });
  });

  describe('Logout Button', () => {
    it('should have a logout button with correct aria-label', () => {
      render(<Sidebar />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });

    it('should call logout function when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should not call logout if button is not clicked', () => {
      render(<Sidebar />);

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Links', () => {
    it('should render all primary navigation links', () => {
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my library/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my exams/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /upload document/i })).toBeInTheDocument();
    });

    it('should render settings link', () => {
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle null user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        logout: mockLogout,
      });

      // Should not throw
      expect(() => render(<Sidebar />)).not.toThrow();
    });
  });
});
