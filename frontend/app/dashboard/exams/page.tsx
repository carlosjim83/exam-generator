'use client';

import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { ExamList } from '@/features/exams/components/ExamList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import Link from 'next/link';

export default function ExamsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('exams:title')}
          subtitle={t('exams:subtitle')}
          name={user?.firstName}
          action={
            <Link href="/dashboard/exams/generate">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('exams:generateNew')}
              </Button>
            </Link>
          }
        />
        <ExamList />
      </div>
    </DashboardLayout>
  );
}
