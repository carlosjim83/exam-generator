/**
 * DashboardContext
 *
 * Provides dashboard data and refresh functions to all child components.
 * This allows components like UploadDialog to trigger refreshes after mutations.
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  useDashboardStats,
  useDashboardDocuments,
  useDashboardClassExams,
} from '@/lib/hooks/useDashboard';

interface DashboardContextValue {
  // Stats
  stats: ReturnType<typeof useDashboardStats>['stats'];
  statsLoading: boolean;
  statsError: Error | null;
  refreshStats: () => Promise<void>;

  // Documents
  documents: ReturnType<typeof useDashboardDocuments>['documents'];
  documentsLoading: boolean;
  documentsError: Error | null;
  refreshDocuments: () => Promise<void>;

  // Class Exams (was: Exams)
  classExams: ReturnType<typeof useDashboardClassExams>['classExams'];
  classExamsLoading: boolean;
  classExamsError: Error | null;
  refreshClassExams: () => Promise<void>;

  // Refresh all data
  refreshAll: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refreshStats,
  } = useDashboardStats();

  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    refetch: refreshDocuments,
  } = useDashboardDocuments(5);

  const {
    classExams,
    loading: classExamsLoading,
    error: classExamsError,
    refetch: refreshClassExams,
  } = useDashboardClassExams(5);

  const refreshAll = async () => {
    await Promise.all([refreshStats(), refreshDocuments(), refreshClassExams()]);
  };

  return (
    <DashboardContext.Provider
      value={{
        stats,
        statsLoading,
        statsError,
        refreshStats,
        documents,
        documentsLoading,
        documentsError,
        refreshDocuments,
        classExams,
        classExamsLoading,
        classExamsError,
        refreshClassExams,
        refreshAll,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
