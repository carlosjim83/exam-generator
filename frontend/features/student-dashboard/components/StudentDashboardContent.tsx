'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api-client';
import type { StudentExamListItem } from '@/features/student-exams/types';
import { Button } from '@/components/ui/button';
import { Play, FileText, TrendingUp, ArrowRight } from 'lucide-react';

export function StudentDashboardContent() {
  const { t, i18n } = useTranslation('student');
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function fetchExams() {
      try {
        setIsLoadingExams(true);
        // Use the centralized apiClient so cookies (httpOnly) and token
        // refresh are handled correctly, matching the rest of the app.
        const data = await apiClient.get<{ assignments: StudentExamListItem[] }>(
          '/api/students/assignments'
        );
        if (!cancelled) {
          setExams(data.assignments || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load exams');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExams(false);
        }
      }
    }

    fetchExams();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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

  if (isLoading) {
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Start Pending Exam */}
          {pendingExams.length > 0 && (
            <Button
              onClick={() => handleExamClick(pendingExams[0])}
              className="h-auto py-4 justify-start flex-col items-start gap-2"
              variant="default"
            >
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                <span className="font-semibold">{t('dashboard.quickActions.startExam')}</span>
              </div>
              <span className="text-sm opacity-90">{pendingExams[0].examTitle}</span>
            </Button>
          )}

          {/* Continue In Progress */}
          {inProgressExams.length > 0 && (
            <Button
              onClick={() => handleExamClick(inProgressExams[0])}
              className="h-auto py-4 justify-start flex-col items-start gap-2"
              variant="secondary"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">{t('dashboard.quickActions.continueExam')}</span>
              </div>
              <span className="text-sm text-muted-foreground">{inProgressExams[0].examTitle}</span>
            </Button>
          )}

          {/* View Results */}
          {completedExams.length > 0 && (
            <Button
              onClick={() => handleExamClick(completedExams[0])}
              className="h-auto py-4 justify-start flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">{t('dashboard.quickActions.viewResults')}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {completedExams[0].score}/{completedExams[0].maxScore}
              </span>
            </Button>
          )}

          {/* View All Exams */}
          <Button
            onClick={() => router.push('/student/exams')}
            className="h-auto py-4 justify-start flex-col items-start gap-2"
            variant="ghost"
          >
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              <span className="font-semibold">{t('dashboard.quickActions.viewAll')}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {exams.length} {t('examList.title').toLowerCase()}
            </span>
          </Button>
        </div>
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
                    {exam.startedAt
                      ? new Date(exam.startedAt).toLocaleDateString(i18n.language)
                      : '-'}
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
