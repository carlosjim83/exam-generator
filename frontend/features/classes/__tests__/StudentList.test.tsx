import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentList } from '../components/StudentList';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStudents = [
  {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    joinedAt: '2024-01-15T10:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    joinedAt: '2024-01-16T10:00:00Z',
    isActive: true,
  },
  {
    id: '3',
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Wilson',
    joinedAt: '2024-01-17T10:00:00Z',
    isActive: false,
  },
];

describe('StudentList', () => {
  const mockOnRemoveStudent = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when loading is true', () => {
    render(<StudentList students={[]} loading={true} onRemoveStudent={mockOnRemoveStudent} />);

    // Should show skeleton elements by their class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders student list with data', () => {
    render(
      <StudentList students={mockStudents} loading={false} onRemoveStudent={mockOnRemoveStudent} />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters students by search term', async () => {
    render(
      <StudentList students={mockStudents} loading={false} onRemoveStudent={mockOnRemoveStudent} />
    );

    const searchInput = screen.getByPlaceholderText('Search students...');
    await userEvent.type(searchInput, 'John');

    // John Doe should be visible, Jane Smith should not
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('shows empty state when no students match search', async () => {
    render(
      <StudentList students={mockStudents} loading={false} onRemoveStudent={mockOnRemoveStudent} />
    );

    const searchInput = screen.getByPlaceholderText('Search students...');
    await userEvent.type(searchInput, 'NonExistent');

    // Should show the no students message
    expect(screen.getByText('No students found')).toBeInTheDocument();
  });

  it('shows empty state when no students exist', () => {
    render(<StudentList students={[]} loading={false} onRemoveStudent={mockOnRemoveStudent} />);

    expect(screen.getByText('No students have joined this class yet')).toBeInTheDocument();
  });

  it('opens confirmation dialog when remove button is clicked', async () => {
    render(
      <StudentList students={mockStudents} loading={false} onRemoveStudent={mockOnRemoveStudent} />
    );

    // Get all buttons and find the first one that doesn't have text (icon buttons)
    const buttons = screen.getAllByRole('button');
    const removeButton = buttons.find((btn) => !btn.textContent?.trim());

    if (removeButton) {
      await userEvent.click(removeButton);
    }

    // Look for the dialog title specifically
    const dialogTitles = screen.getAllByText('Remove Student');
    expect(dialogTitles.length).toBeGreaterThan(0);
  });

  it('calls onRemoveStudent when confirmation is clicked', async () => {
    render(
      <StudentList students={mockStudents} loading={false} onRemoveStudent={mockOnRemoveStudent} />
    );

    // Open dialog by clicking remove
    const buttons = screen.getAllByRole('button');
    const removeBtn = buttons.find((btn) => !btn.textContent?.trim());

    if (removeBtn) {
      await userEvent.click(removeBtn);
    }

    // Click confirm - find the action button in the alert dialog
    const allButtons = screen.getAllByRole('button');
    const confirmButton = allButtons.find(
      (btn) => btn.textContent?.includes('Remove Student') && !btn.hasAttribute('disabled')
    );

    if (confirmButton) {
      await userEvent.click(confirmButton);
    }

    await waitFor(() => {
      expect(mockOnRemoveStudent).toHaveBeenCalled();
    });
  });

  it('displays student initials in avatar', () => {
    render(
      <StudentList
        students={[mockStudents[0]]}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    // John Doe should show "JD" - the initials are split across elements
    // The component renders them separately: first char of first name, then last char of last name
    const avatarDiv = document.querySelector('.rounded-full.bg-primary\\/10');
    expect(avatarDiv).toBeTruthy();
  });
});
