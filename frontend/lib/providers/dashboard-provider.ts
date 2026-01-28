/**
 * Dashboard Service Provider
 *
 * Factory that returns the dashboard service implementation.
 * - Production/Development: Uses real API (with graceful fallbacks for missing endpoints)
 * - Fixtures available but not used by default
 *
 * Toggle with NEXT_PUBLIC_USE_FIXTURES env variable (for testing/demos only).
 */

import type { IDashboardService } from '../services/dashboard.service';
import { ApiDashboardService } from './api-dashboard.service';
import { FixtureDashboardService } from './fixture-dashboard.service';

// Only use fixtures if explicitly requested (for testing/demos)
const USE_FIXTURES = process.env.NEXT_PUBLIC_USE_FIXTURES === 'true';

/**
 * Get dashboard service instance
 * Singleton pattern - reuses the same instance
 */
let dashboardServiceInstance: IDashboardService | null = null;

export function getDashboardService(): IDashboardService {
  if (!dashboardServiceInstance) {
    if (USE_FIXTURES) {
      console.warn(
        '🎭 [Dashboard] Using FIXTURE service (mock data) - set NEXT_PUBLIC_USE_FIXTURES=false for real API'
      );
      dashboardServiceInstance = new FixtureDashboardService();
    } else {
      console.log('🌐 [Dashboard] Using API service (real backend with graceful fallbacks)');
      dashboardServiceInstance = new ApiDashboardService();
    }
  }

  return dashboardServiceInstance;
}

/**
 * Reset service instance (useful for testing)
 */
export function resetDashboardService(): void {
  dashboardServiceInstance = null;
}
