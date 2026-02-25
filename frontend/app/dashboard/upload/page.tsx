'use client';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { UploadDocumentForm } from '@/features/documents/components/UploadDocumentForm';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function UploadDocumentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleUploadSuccess = () => {
    // Redirect back to dashboard after successful upload
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}
