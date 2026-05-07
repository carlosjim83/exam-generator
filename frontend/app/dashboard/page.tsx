'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardStats } from '@/features/dashboard/components/DashboardStats';
import { RecentDocuments } from '@/features/dashboard/components/RecentDocuments';
import { RecentExams } from '@/features/dashboard/components/RecentExams';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardProvider } from '@/features/dashboard/context/DashboardContext';
import { StudentDashboardContent } from '@/features/student-dashboard/components/StudentDashboardContent';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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

  // Show student dashboard for students
  if (user?.role === 'STUDENT') {
    return (
      <DashboardProvider>
        <DashboardLayout>
          <div className="overflow-x-hidden px-8 py-8">
            <StudentDashboardContent />
          </div>
        </DashboardLayout>
      </DashboardProvider>
    );
  }

  // Teacher dashboard (existing)
  return (
    <DashboardProvider>
      <DashboardLayout>
        <div className="overflow-x-hidden px-8 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('dashboard:greeting')}, {user ? `${user.firstName} ${user.lastName}` : 'Professor'}
            </h1>
            <p className="text-lg text-muted-foreground">{t('dashboard:subtitle')}</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Left Column - Documents & Exams */}
            <div className="min-w-0 space-y-8 overflow-hidden">
              <RecentDocuments />
              <RecentExams />
            </div>

            {/* Right Column - Quick Actions */}
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </DashboardProvider>
  );
}
