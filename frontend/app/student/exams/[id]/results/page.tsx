/**
 * Exam Results Page
 *
 * Page for students to view their graded exam results
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TokenManager } from '@/features/auth/services/api.service';
import { ExamResults } from '@/features/student-exams/components/ExamResults';

export default function ExamResultsPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [token, setToken] = useState<string | null>(null);

  const assignmentId = params.id as string;

  useEffect(() => {
    // Get token on client side
    const accessToken = TokenManager.getAccessToken();
    setToken(accessToken);
  }, []);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleBack = useCallback(() => {
    router.push('/student/exams');
  }, [router]);

  if (isLoading || !token) {
    return (
      <DashboardLayout>
        <div className="px-8 py-8">
          <div className="animate-pulse max-w-3xl mx-auto">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <ExamResults assignmentId={assignmentId} token={token} onBack={handleBack} />
      </div>
    </DashboardLayout>
  );
}
