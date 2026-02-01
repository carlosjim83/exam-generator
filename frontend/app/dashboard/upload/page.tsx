'use client';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UploadDocumentForm } from '@/features/documents/components/UploadDocumentForm';
import { useRouter } from 'next/navigation';

export default function UploadDocumentPage() {
  const router = useRouter();

  const handleUploadSuccess = () => {
    // Redirect back to dashboard after successful upload
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Upload Document</h1>
            <p className="text-muted-foreground">
              Upload a PDF or DOCX file to generate exams. Maximum file size: 10 MB.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <UploadDocumentForm onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
