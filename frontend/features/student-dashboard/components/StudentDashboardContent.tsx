'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TokenManager } from '@/features/auth/services/api.service';
import type { StudentExamListItem } from '@/features/student-exams/types';

export function StudentDashboardContent() {
  const { t } = useTranslation('student');
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = TokenManager.getAccessToken();
    setToken(accessToken);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchExams() {
      if (!token) return;

      try {
        setIsLoadingExams(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/students/assignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch exams');
        }

        const data = await response.json();
        setExams(data.assignments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exams');
      } finally {
        setIsLoadingExams(false);
      }
    }

    fetchExams();
  }, [token]);

  const pendingExams = exams.filter((e) => e.status === 'PENDING');
  const inProgressExams = exams.filter((e) => e.status === 'IN_PROGRESS');
  const completedExams = exams.filter((e) => e.status === 'SUBMITTED' || e.status === 'GRADED');

  const handleExamClick = (exam: StudentExamListItem) => {
    if (exam.status === 'GRADED') {
      router.push(`/student/exams/${exam.id}/results`);
    } else {
      router.push(`/student/exams/${exam.id}`);
    }
  };

  const getStatusBadge = (exam: StudentExamListItem) => {
    switch (exam.status) {
      case 'PENDING':
        return (
          <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            {t('examList.status.PENDING')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            {t('examList.status.IN_PROGRESS')}
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800">
            {t('examList.status.SUBMITTED')}
          </span>
        );
      case 'GRADED':
        return (
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">
            {t('examList.status.GRADED')}: {exam.score}/{exam.maxScore}
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading || !token) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcome.greeting')}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">{t('welcome.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{pendingExams.length}</div>
          <div className="text-sm text-muted-foreground">{t('dashboard.stats.pending')}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{inProgressExams.length}</div>
          <div className="text-sm text-muted-foreground">{t('dashboard.stats.inProgress')}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{completedExams.length}</div>
          <div className="text-sm text-muted-foreground">{t('dashboard.stats.completed')}</div>
        </div>
      </div>

      {/* Pending Exams */}
      {pendingExams.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.sections.pendingExams')}</h2>
          <div className="space-y-2">
            {pendingExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => handleExamClick(exam)}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium">{exam.examTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {exam.questionCount} {t('examList.questions')} • {t('examList.maxScore')}:{' '}
                    {exam.maxScore}
                  </div>
                </div>
                {getStatusBadge(exam)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Exams */}
      {inProgressExams.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.sections.inProgressExams')}</h2>
          <div className="space-y-2">
            {inProgressExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => handleExamClick(exam)}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium">{exam.examTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {exam.startedAt ? new Date(exam.startedAt).toLocaleDateString() : '-'}
                  </div>
                </div>
                {getStatusBadge(exam)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Exams */}
      {exams.length === 0 && !isLoadingExams && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('dashboard.noExams')}</p>
        </div>
      )}

      {/* View All Link */}
      {exams.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/student/exams')}
            className="text-sm text-primary hover:underline"
          >
            {t('dashboard.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
}
