'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { DocumentLibrary } from '@/features/documents/components/DocumentLibrary';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('documents:title')}
          subtitle={t('documents:subtitle')}
          name={user?.firstName}
          action={
            <Link href="/dashboard/upload">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('documents:uploadNew')}
              </Button>
            </Link>
          }
        />
        <DocumentLibrary />
      </div>
    </DashboardLayout>
  );
}
