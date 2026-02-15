/**
 * Student Exams List Page
 *
 * Displays all exams assigned to the current student
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TokenManager } from '@/features/auth/services/api.service';
import { StudentExamList } from '@/features/student-exams/components/StudentExamList';
import type { StudentExamListItem } from '@/features/student-exams/types';

export default function StudentExamsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token on client side
    const accessToken = TokenManager.getAccessToken();
    setToken(accessToken);
  }, []);

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleExamSelect = useCallback(
    (exam: StudentExamListItem) => {
      if (exam.status === 'GRADED') {
        router.push(`/student/exams/${exam.id}/results`);
      } else {
        router.push(`/student/exams/${exam.id}`);
      }
    },
    [router]
  );

  if (isLoading || !token) {
    return (
      <DashboardLayout>
        <div className="px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Exams</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.firstName}! Here are your assigned exams.
          </p>
        </div>
        <StudentExamList token={token} onExamSelect={handleExamSelect} />
      </div>
    </DashboardLayout>
  );
}
