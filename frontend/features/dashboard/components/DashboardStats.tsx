'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, ClipboardCheck, Zap, TrendingUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mb-2 text-3xl font-bold tracking-tight">{value}</h3>
            {change && change !== 'N/A' && (
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-600">{change}</span>
              </div>
            )}
          </div>
          <div className={`rounded-lg p-3 ${iconBgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { stats, statsLoading: loading, statsError: error } = useDashboardContext();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load stats</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const minutesAgo = Math.floor(
    (Date.now() - stats.lastActivity.timestamp.getTime()) / (1000 * 60)
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Documents"
        value={stats.totalDocuments}
        change={stats.documentsChange}
        icon={FileText}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
      <StatCard
        title="Total Exams"
        value={stats.totalExams}
        change={stats.examsChange}
        icon={ClipboardCheck}
        iconColor="text-indigo-600"
        iconBgColor="bg-indigo-100"
      />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Recent Activity</p>
              <h3 className="mb-2 text-3xl font-bold tracking-tight">Active Now</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span>
                  {minutesAgo === 0
                    ? 'Just now'
                    : `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
