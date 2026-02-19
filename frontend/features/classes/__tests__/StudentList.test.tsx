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
    render(
      <StudentList
        students={[]}
        loading={true}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    // Should show skeleton elements
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders student list with data', () => {
    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters students by search term', () => {
    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search students/i);
    userEvent.type(searchInput, 'John');

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('shows empty state when no students match search', () => {
    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search students/i);
    userEvent.type(searchInput, 'NonExistent');

    expect(screen.getByText(/No students found/i)).toBeInTheDocument();
  });

  it('shows empty state when no students exist', () => {
    render(
      <StudentList
        students={[]}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    expect(screen.getByText(/No students have joined this class yet/i)).toBeInTheDocument();
  });

  it('opens confirmation dialog when remove button is clicked', () => {
    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: '' });
    // Find the remove button (has trash icon)
    const removeButton = removeButtons.find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-testid') === 'trash-2'
    );

    if (removeButton) {
      userEvent.click(removeButton);
    }

    expect(screen.getByText(/Remove Student/i)).toBeInTheDocument();
  });

  it('calls onRemoveStudent when confirmation is clicked', async () => {
    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onRemoveStudent={mockOnRemoveStudent}
      />
    );

    // Open dialog by clicking remove
    const removeButtons = screen.getAllByRole('button');
    const removeBtn = removeButtons.find(
      (btn) => btn.getAttribute('aria-label') === undefined
    );

    if (removeBtn) {
      userEvent.click(removeBtn);
    }

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /Remove Student$/i });
    userEvent.click(confirmButton);

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

    // John Doe should show "JD"
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
