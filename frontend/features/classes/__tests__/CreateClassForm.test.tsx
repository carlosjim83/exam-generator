import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateClassForm } from '../components/CreateClassForm';

// Mock the API service
const { mockCreateClass } = vi.hoisted(() => ({
  mockCreateClass: vi.fn(),
}));

vi.mock('../services/classes-api', () => ({
  createClass: mockCreateClass,
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'createClassForm.nameLabel': 'Class Name',
        'createClassForm.namePlaceholder': 'e.g., Math 101 - Group A',
        'createClassForm.nameRequired': 'Class name is required',
        'createClassForm.nameMinLength': 'Class name must be at least 2 characters',
        'createClassForm.nameMaxLength': 'Class name must be less than 100 characters',
        'createClassForm.descriptionLabel': 'Description',
        'createClassForm.descriptionPlaceholder': 'Optional description...',
        'createClassForm.cancel': 'Cancel',
        'createClassForm.createButton': 'Create Class',
        'createClassForm.creating': 'Creating...',
        'createClassForm.error': 'Failed to create class',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CreateClassForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with name and description fields', () => {
    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/class name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create class/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class name is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when name is too short', async () => {
    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when name is too long', async () => {
    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'A'.repeat(101) } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class name must be less than 100 characters/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data', async () => {
    mockCreateClass.mockResolvedValueOnce({
      id: 'class-123',
      name: 'Math 101',
      code: 'MATH10',
      teacherId: 'teacher-123',
      createdAt: new Date().toISOString(),
    });

    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    const descInput = screen.getByLabelText(/description/i);

    fireEvent.change(nameInput, { target: { value: 'Math 101' } });
    fireEvent.change(descInput, { target: { value: 'Introduction to Mathematics' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    // Wait for both the API call and the onSuccess callback
    await waitFor(() => {
      expect(mockCreateClass).toHaveBeenCalledWith({
        name: 'Math 101',
        description: 'Introduction to Mathematics',
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: 'class-123',
        name: 'Math 101',
        code: 'MATH10',
        teacherId: 'teacher-123',
        createdAt: expect.any(String),
      });
    });
  });

  it('shows loading state during submission', async () => {
    mockCreateClass.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'Math 101' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    mockCreateClass.mockRejectedValueOnce(new Error('Failed to create class'));

    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'Math 101' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create class/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('clears error when user starts typing again', async () => {
    mockCreateClass.mockRejectedValueOnce(new Error('Failed to create class'));

    render(<CreateClassForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/class name/i);
    fireEvent.change(nameInput, { target: { value: 'Math 101' } });

    const submitButton = screen.getByRole('button', { name: /create class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create class/i)).toBeInTheDocument();
    });

    fireEvent.change(nameInput, { target: { value: 'Math 102' } });

    expect(screen.queryByText(/failed to create class/i)).not.toBeInTheDocument();
  });
});
