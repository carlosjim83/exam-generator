import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteStudentsDialog } from '../components/InviteStudentsDialog';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('InviteStudentsDialog', () => {
  const mockOnInvite = vi.fn().mockResolvedValue({ success: true });
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with correct title and description', () => {
    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    expect(screen.getByText('Invite Students')).toBeInTheDocument();
    expect(screen.getByText(/Send email invitations to students/)).toBeInTheDocument();
  });

  it('shows validation error when no email is entered', async () => {
    const user = userEvent.setup();
    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    // Enter a newline to enable the button, but result in no valid emails
    const textarea = screen.getByPlaceholderText(/student1@example.com/);
    await user.type(textarea, '\n');

    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    await user.click(sendButton);

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter at least one email address');
    });
  });

  it('shows validation error when more than 50 emails', async () => {
    const user = userEvent.setup();
    const manyEmails = Array.from({ length: 51 }, (_, i) => `test${i}@example.com`).join('\n');

    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    const textarea = screen.getByPlaceholderText(/student1@example.com/);
    await user.type(textarea, manyEmails);

    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    await user.click(sendButton);

    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Maximum 50 email addresses at a time');
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();

    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    const textarea = screen.getByPlaceholderText(/student1@example.com/);
    await user.type(textarea, 'invalid-email\ntest@example.com');

    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    await user.click(sendButton);

    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalled();
  });

  it('calls onInvite with valid emails', async () => {
    const user = userEvent.setup();

    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    const textarea = screen.getByPlaceholderText(/student1@example.com/);
    await user.type(textarea, 'test1@example.com\ntest2@example.com');

    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith(['test1@example.com', 'test2@example.com']);
    });
  });

  it('closes dialog after successful invitation', async () => {
    const user = userEvent.setup();

    render(
      <InviteStudentsDialog open={true} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    const textarea = screen.getByPlaceholderText(/student1@example.com/);
    await user.type(textarea, 'test@example.com');

    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('does not render when open is false', () => {
    render(
      <InviteStudentsDialog open={false} onOpenChange={mockOnOpenChange} onInvite={mockOnInvite} />
    );

    expect(screen.queryByText('Invite Students')).not.toBeInTheDocument();
  });
});
