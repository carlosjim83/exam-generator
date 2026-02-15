'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardStats } from '@/features/dashboard/components/DashboardStats';
import { RecentDocuments } from '@/features/dashboard/components/RecentDocuments';
import { RecentExams } from '@/features/dashboard/components/RecentExams';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardProvider } from '@/features/dashboard/context/DashboardContext';
import { StudentDashboardContent } from '@/features/student-dashboard/components/StudentDashboardContent';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect students to student dashboard
  useEffect(() => {
    if (!isLoading && user && user.role === 'STUDENT') {
      // Student stays on /dashboard but sees student content
      // This is optional - we could also redirect to /student/exams
    }
  }, [user, isLoading, router]);

  // Show student dashboard for students
  if (user?.role === 'STUDENT') {
    return (
      <ProtectedRoute>
        <DashboardProvider>
          <DashboardLayout>
            <div className="overflow-x-hidden px-8 py-8">
              <StudentDashboardContent />
            </div>
          </DashboardLayout>
        </DashboardProvider>
      </ProtectedRoute>
    );
  }

  // Teacher dashboard (existing)
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <DashboardLayout>
          <div className="overflow-x-hidden px-8 py-8">
            {/* Hero Section */}
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold tracking-tight">
                {t('dashboard:greeting')},{' '}
                {user ? `${user.firstName} ${user.lastName}` : 'Professor'}
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
    </ProtectedRoute>
  );
}
