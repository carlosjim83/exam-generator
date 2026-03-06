'use client';

import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamDetails } from '@/features/exams/components/ExamDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExamDetailPage({ params }: PageProps) {
  const { t } = useTranslation('exams');
  const { id } = use(params);

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard/exams">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToMyExams')}
            </Button>
          </Link>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            {t('examDetails.title') || 'Exam Details'}
          </h1>
          <p className="text-muted-foreground">
            {t('examDetails.review') || 'Review your generated exam'}
          </p>
        </div>
        <ExamDetails examId={id} />
      </div>
    </DashboardLayout>
  );
}
