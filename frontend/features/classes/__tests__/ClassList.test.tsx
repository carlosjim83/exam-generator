/**
 * ClassList Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassList } from '../components/ClassList';
import type { ClassSummary } from '../types';

describe('ClassList', () => {
  const mockClasses: ClassSummary[] = [
    {
      id: '123e4567-e89b-42d3-a456-426614174000',
      name: 'Mathematics 101',
      code: 'MATH101',
      description: 'Introductory Algebra',
      studentCount: 25,
      color: '#FF5733',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '223e4567-e89b-42d3-a456-426614174001',
      name: 'Physics 101',
      code: 'PHYS101',
      description: 'Basic Physics',
      studentCount: 30,
      color: '#33C1FF',
      createdAt: new Date('2024-01-20'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.doMock('../components/ClassCard', () => ({
      ClassCard: () => <div data-testid="mock-class-card">Class</div>,
    }));

    render(<ClassList />);
  });

  it('should render empty state when no classes', () => {
    render(<ClassList classes={[]} loading={false} />);
  });

  it('should render class cards', () => {
    render(<ClassList classes={mockClasses} loading={false} />);

    expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
    expect(screen.getByText('Physics 101')).toBeInTheDocument();
  });

  it('should render student counts', () => {
    render(<ClassList classes={mockClasses} loading={false} />);

    expect(screen.getByText('25 students')).toBeInTheDocument();
    expect(screen.getByText('30 students')).toBeInTheDocument();
  });

  it('should display empty state message', () => {
    render(<ClassList classes={[]} loading={false} />);

    expect(screen.getByText(/createFirstClassDescription/i)).toBeInTheDocument();
  });
});
