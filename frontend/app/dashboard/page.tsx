'use client';

import { TopNavigation } from "@/features/dashboard/components/TopNavigation";
import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { RecentDocuments } from "@/features/dashboard/components/RecentDocuments";
import { RecentExams } from "@/features/dashboard/components/RecentExams";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/50">
        <TopNavigation />
        
        <main className="container px-4 py-8 md:px-6">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
