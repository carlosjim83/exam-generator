/**
 * Dashboard Service Interface
 *
 * Abstraction for dashboard data access.
 * Implementations: ApiDashboardService (real API), FixtureDashboardService (mocks)
 */

import type { Document, Exam, DashboardStats } from '../types/dashboard.types';

export interface IDashboardService {
  /**
   * Get dashboard statistics
   */
  getStats(): Promise<DashboardStats>;

  /**
   * Get recent documents for the authenticated user
   * @param limit - Maximum number of documents to return (default: 5)
   */
  getRecentDocuments(limit?: number): Promise<Document[]>;

  /**
   * Get recent exams for the authenticated user
   * @param limit - Maximum number of exams to return (default: 5)
   */
  getRecentExams(limit?: number): Promise<Exam[]>;
}
