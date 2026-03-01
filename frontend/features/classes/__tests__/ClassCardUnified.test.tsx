/**
 * ClassCard Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClassCard, type ClassCardData } from '../components/ClassCardUnified';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'classCard.students': 'student',
        'classCard.documents': 'document',
        'classCard.exams': 'exam',
        'classCard.manage': 'Manage',
        'classCard.viewClass': 'View Class',
      };
      let result = translations[key] || key;
      if (options?.count !== undefined && options.count !== 1) {
        result += 's';
      }
      return result;
    },
  }),
}));

describe('ClassCard', () => {
  const mockClassData: ClassCardData = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'Mathematics 101',
    code: 'MATH101',
    description: 'Introductory Algebra and Calculus',
    studentCount: 25,
    documentCount: 5,
    examCount: 3,
    color: '#6366f1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render class name', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
  });

  it('should render class code', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('MATH101')).toBeInTheDocument();
  });

  it('should render class description', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('Introductory Algebra and Calculus')).toBeInTheDocument();
  });

  it('should render student count', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should render document count', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render exam count', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render action button with correct label', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('should have correct link href', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    const link = screen.getByRole('link', { name: /manage/i });
    expect(link).toHaveAttribute('href', '/dashboard/classes/123');
  });

  it('should render initials in avatar', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    // "Mathematics 101" -> split by space -> ["Mathematics", "101"] -> ["M", "1"] -> "M1"
    expect(screen.getByText('M1')).toBeInTheDocument();
  });

  it('should handle missing description gracefully', () => {
    const classWithoutDescription: ClassCardData = {
      ...mockClassData,
      description: null,
    };

    render(
      <ClassCard
        classData={classWithoutDescription}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    // Should render fine without description
    expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
  });

  it('should work for student role', () => {
    render(
      <ClassCard
        classData={mockClassData}
        href="/student/classes/123"
        actionLabel="View Class"
        role="student"
      />
    );

    expect(screen.getByText('View Class')).toBeInTheDocument();
  });

  it('should default counts to 0 when not provided', () => {
    const classWithoutCounts: ClassCardData = {
      ...mockClassData,
      documentCount: undefined,
      examCount: undefined,
    };

    render(
      <ClassCard
        classData={classWithoutCounts}
        href="/dashboard/classes/123"
        actionLabel="Manage"
        role="teacher"
      />
    );

    // 0 for documents and exams (two instances of "0")
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(2);
  });
});
