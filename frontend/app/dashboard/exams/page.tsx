'use client';

import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamList } from '@/features/exams/components/ExamList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ExamsPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('exams:title')}</h1>
            <p className="text-muted-foreground">{t('exams:subtitle')}</p>
          </div>
          <Link href="/dashboard/exams/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('exams:generateNew')}
            </Button>
          </Link>
        </div>
        <ExamList />
      </div>
    </DashboardLayout>
  );
}
