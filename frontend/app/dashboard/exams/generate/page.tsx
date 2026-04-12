'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExamGenerationWizard } from '@/features/exams/components/ExamGenerationWizard';
import { SubscriptionBanner } from '@/features/subscription/components/SubscriptionBanner';
import { useTranslation } from 'react-i18next';

export default function GenerateExamPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <SubscriptionBanner limitType="exams" />

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('generate:title')}</h1>
          <p className="text-muted-foreground">{t('generate:subtitle')}</p>
        </div>
        <div className="mx-auto max-w-5xl">
          <ExamGenerationWizard />
        </div>
      </div>
    </DashboardLayout>
  );
}
