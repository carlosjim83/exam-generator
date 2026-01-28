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
  useDashboardExams,
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

  // Exams
  exams: ReturnType<typeof useDashboardExams>['exams'];
  examsLoading: boolean;
  examsError: Error | null;
  refreshExams: () => Promise<void>;

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
    exams,
    loading: examsLoading,
    error: examsError,
    refetch: refreshExams,
  } = useDashboardExams(5);

  const refreshAll = async () => {
    await Promise.all([refreshStats(), refreshDocuments(), refreshExams()]);
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
        exams,
        examsLoading,
        examsError,
        refreshExams,
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
