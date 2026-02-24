/**
 * Student Exams List Page
 *
 * Displays all exams assigned to the current student
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { useAuth } from '@/features/auth/context/AuthContext';
import { StudentExamList } from '@/features/student-exams/components/StudentExamList';
import type { StudentExamListItem } from '@/features/student-exams/types';

export default function StudentExamsPage() {
  const { t } = useTranslation('student');
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleExamSelect = useCallback(
    (exam: StudentExamListItem) => {
      if (exam.status === 'GRADED') {
        router.push(`/student/exams/${exam.id}/results`);
      } else {
        router.push(`/student/exams/${exam.id}`);
      }
    },
    [router]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <PageHeader
            title={t('exams.title')}
            subtitle={t('exams.welcome')}
            name={user?.firstName}
          />
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader title={t('exams.title')} subtitle={t('exams.welcome')} name={user?.firstName} />
        <StudentExamList onExamSelect={handleExamSelect} />
      </div>
    </DashboardLayout>
  );
}
