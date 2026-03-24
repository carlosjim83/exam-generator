/**
 * Class Exam Results Page
 *
 * Page for teachers to view all student submissions for a class exam
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClassExamResults } from '@/features/classes/components/ClassExamResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ClassExamResultsPageProps {
  params: Promise<{
    id: string;
    classExamId: string;
  }>;
}

export default function ClassExamResultsPage({ params }: ClassExamResultsPageProps) {
  const { id: classId, classExamId } = use(params);
  const router = useRouter();
  const { t } = useTranslation('classes');

  const handleBack = () => {
    router.push(`/dashboard/classes/${classId}`);
  };

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('classExamResults.backToClass')}
            </Button>
          </div>

          <ClassExamResults classId={classId} classExamId={classExamId} />
        </div>
      </div>
    </DashboardLayout>
  );
}
