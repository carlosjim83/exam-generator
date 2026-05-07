'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { UploadDocumentForm } from '@/features/documents/components/UploadDocumentForm';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function UploadDocumentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleUploadSuccess = () => {
    // Redirect back to dashboard after successful upload
    router.push('/dashboard');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('upload:title')}
          subtitle={t('upload:subtitle')}
          name={user?.firstName}
        />
        <div className="mx-auto max-w-3xl">
          <UploadDocumentForm onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
    </DashboardLayout>
  );
}
