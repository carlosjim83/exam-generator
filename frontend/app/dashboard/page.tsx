'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardStats } from '@/features/dashboard/components/DashboardStats';
import { RecentDocuments } from '@/features/dashboard/components/RecentDocuments';
import { RecentExams } from '@/features/dashboard/components/RecentExams';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardProvider } from '@/features/dashboard/context/DashboardContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardProvider>
        <DashboardLayout>
          <div className="px-8 py-8">
            {/* Hero Section */}
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold tracking-tight">
                Good morning, {user ? `${user.firstName} ${user.lastName}` : 'Professor'}
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to create some assessment materials today?
              </p>
            </div>

            {/* Stats Cards */}
            <div className="mb-8">
              <DashboardStats />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              {/* Left Column - Documents & Exams */}
              <div className="space-y-8">
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
