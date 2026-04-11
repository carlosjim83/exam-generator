'use client';

/**
 * Student Submission Detail Page
 *
 * Teachers can view detailed submission results for a specific student,
 * including question-by-question breakdown with answers and grading.
 */

import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentSubmissionDetail } from '@/features/classes/components/StudentSubmissionDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui-custom/PageHeader';

export default function StudentSubmissionDetailPage() {
  const { t } = useTranslation('classes');
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const params = useParams();

  const id = params.id as string;
  const classExamId = params.classExamId as string;
  const studentId = params.studentId as string;

  // Show loading while checking auth
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only teachers can access this page
  if (!user || user.role !== 'TEACHER') {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Back to Results Link */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/classes/${id}/exams/${classExamId}/results`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('studentSubmissionDetail.backToResults')}
          </Button>
        </div>

        <PageHeader
          title={t('studentSubmissionDetail.title')}
          subtitle={t('studentSubmissionDetail.subtitle')}
        />

        {/* Client Component with Data */}
        <StudentSubmissionDetail classId={id} classExamId={classExamId} studentId={studentId} />
      </div>
    </DashboardLayout>
  );
}
