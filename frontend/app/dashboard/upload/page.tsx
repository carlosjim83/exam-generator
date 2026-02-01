'use client';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { UploadDocumentForm } from '@/features/documents/components/UploadDocumentForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { useRouter } from 'next/navigation';

export default function UploadDocumentPage() {
  const router = useRouter();

  const handleUploadSuccess = () => {
    // Redirect back to dashboard after successful upload
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Upload Document"
          description="Upload a PDF or DOCX file to generate exams. Maximum file size: 10 MB."
        />
        <PageContainer maxWidth="3xl">
          <UploadDocumentForm onUploadSuccess={handleUploadSuccess} />
        </PageContainer>
      </div>
    </ProtectedRoute>
  );
}
