/**
 * ClassCard Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassCard } from '../components/ClassCard';
import type { ClassSummary } from '../types';

describe('ClassCard', () => {
  const mockClassData: ClassSummary = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'Mathematics 101',
    code: 'MATH101',
    description: 'Introductory Algebra and Calculus',
    studentCount: 25,
    color: '#FF5733',
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render class name', () => {
    render(<ClassCard classData={mockClassData} />);

    expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
  });

  it('should render class description', () => {
    render(<ClassCard classData={mockClassData} />);

    expect(screen.getByText('Introductory Algebra and Calculus')).toBeInTheDocument();
  });

  it('should render class code', () => {
    render(<ClassCard classData={mockClassData} />);

    expect(screen.getByText('MATH101')).toBeInTheDocument();
  });

  it('should render student count', () => {
    render(<ClassCard classData={mockClassData} />);

    expect(screen.getByText('25 students')).toBeInTheDocument();
  });

  it('should render color indicator', () => {
    render(<ClassCard classData={mockClassData} />);

    // The color indicator should be visible
    const colorIndicator = document.querySelector('[style*="background-color: rgb(255, 87, 51)"]');
    expect(colorIndicator).toBeInTheDocument();
  });

  it('should handle missing description', () => {
    const classWithoutDescription: ClassSummary = {
      ...mockClassData,
      description: null,
    };

    render(<ClassCard classData={classWithoutDescription} />);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('should show Manage link', () => {
    render(<ClassCard classData={mockClassData} />);

    expect(screen.getByRole('link', { name: /manage/i })).toBeInTheDocument();
  });
});
