import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JoinClassForm } from '../JoinClassForm';
import * as classesApi from '../../services/classes-api';

vi.mock('../../services/classes-api');

describe('JoinClassForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with code input field', () => {
    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/class code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join class/i })).toBeInTheDocument();
  });

  it('shows validation error when code is empty', async () => {
    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/class code is required/i)).toBeInTheDocument();
    });
  });

  it('converts code to uppercase on input', () => {
    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const codeInput = screen.getByLabelText(/class code/i);
    fireEvent.change(codeInput, { target: { value: 'math10' } });

    expect(codeInput).toHaveValue('MATH10');
  });

  it('removes invalid characters from code', () => {
    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const codeInput = screen.getByLabelText(/class code/i);
    fireEvent.change(codeInput, { target: { value: 'MATH-10!@#' } });

    expect(codeInput).toHaveValue('MATH10');
  });

  it('submits form with valid code', async () => {
    const mockJoinClass = vi.mocked(classesApi.joinClass);
    mockJoinClass.mockResolvedValueOnce({
      classId: 'class-123',
      joinedAt: new Date().toISOString(),
    });

    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const codeInput = screen.getByLabelText(/class code/i);
    fireEvent.change(codeInput, { target: { value: 'MATH10' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinClass).toHaveBeenCalledWith({ code: 'MATH10' });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith({
      classId: 'class-123',
      joinedAt: expect.any(String),
    });
  });

  it('shows error when class code is invalid', async () => {
    const mockJoinClass = vi.mocked(classesApi.joinClass);
    mockJoinClass.mockRejectedValueOnce(new Error('Invalid class code'));

    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const codeInput = screen.getByLabelText(/class code/i);
    fireEvent.change(codeInput, { target: { value: 'INVALID' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid class code/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const mockJoinClass = vi.mocked(classesApi.joinClass);
    mockJoinClass.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<JoinClassForm onSuccess={mockOnSuccess} />);

    const codeInput = screen.getByLabelText(/class code/i);
    fireEvent.change(codeInput, { target: { value: 'MATH10' } });

    const submitButton = screen.getByRole('button', { name: /join class/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/joining/i)).toBeInTheDocument();
  });
});
