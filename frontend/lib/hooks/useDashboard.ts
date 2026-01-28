/**
 * useDashboard Hook
 *
 * React hook for accessing dashboard data with automatic loading/error states.
 * Makes direct API calls to backend.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiDashboardService } from '../providers/api-dashboard.service';
import type { Document, Exam, DashboardStats } from '../types/dashboard.types';

// Singleton instance
const dashboardService = new ApiDashboardService();

interface UseDashboardStatsResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseDashboardDocumentsResult {
  documents: Document[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseDashboardExamsResult {
  exams: Exam[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Get dashboard stats
 */
export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Get recent documents
 */
export function useDashboardDocuments(limit: number = 5): UseDashboardDocumentsResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getRecentDocuments(limit);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments };
}

/**
 * Get recent exams
 */
export function useDashboardExams(limit: number = 5): UseDashboardExamsResult {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getRecentExams(limit);
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch exams'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return { exams, loading, error, refetch: fetchExams };
}
