/**
 * useDashboard Hook
 *
 * React hook for accessing dashboard data with automatic loading/error states.
 * Uses the configured dashboard service (API or fixtures).
 */

'use client';

import { useState, useEffect } from 'react';
import { getDashboardService } from '../providers/dashboard-provider';
import type { Document, Exam, DashboardStats } from '../types/dashboard.types';

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

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const service = getDashboardService();
      const data = await service.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Get recent documents
 */
export function useDashboardDocuments(limit: number = 5): UseDashboardDocumentsResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const service = getDashboardService();
      const data = await service.getRecentDocuments(limit);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [limit]);

  return { documents, loading, error, refetch: fetchDocuments };
}

/**
 * Get recent exams
 */
export function useDashboardExams(limit: number = 5): UseDashboardExamsResult {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const service = getDashboardService();
      const data = await service.getRecentExams(limit);
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch exams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [limit]);

  return { exams, loading, error, refetch: fetchExams };
}
