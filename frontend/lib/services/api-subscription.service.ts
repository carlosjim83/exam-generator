/**
 * Subscription API Service
 *
 * Handles all API calls for subscription management
 */

import { apiClient, TokenManager } from '@/lib/api-client';
import { configManager } from '@/lib/config/config-manager';

export type SubscriptionTier = 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface SubscriptionLimits {
  maxClasses: number | null;
  maxStudents: number | null;
  maxExamsPerMonth: number | null;
  maxQuestionsPerExam: number | null;
  maxDocumentsPerExam: number | null;
  maxTeamMembers: number | null;
  aiModel: string;
  customBranding: boolean;
  exportFeatures: boolean;
  analyticsLevel: string;
  supportLevel: string;
}

export interface SubscriptionUsage {
  currentClasses: number;
  currentStudents: number;
  examsCreatedThisMonth: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface LimitsReached {
  students: boolean;
  classes: boolean;
  exams: boolean;
}

export interface SubscriptionResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  limitsReached: LimitsReached;
  upgradeNeeded: boolean;
}

export interface PlanLimits {
  maxClasses: number | null;
  maxStudents: number | null;
  maxExamsPerMonth: number | null;
  maxQuestionsPerExam: number | null;
  aiModel: string;
  analyticsLevel: string;
  supportLevel: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  price: number;
  priceYearly: number;
  currency: string;
  limits: PlanLimits;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

/**
 * Get current subscription with limits and usage
 */
export async function getCurrentSubscription(): Promise<SubscriptionResponse> {
  return apiClient.get<SubscriptionResponse>('/api/subscription/current');
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<SubscriptionPlansResponse> {
  const queryParams = new URLSearchParams({ billingCycle });
  return apiClient.get<SubscriptionPlansResponse>(
    `/api/subscription/plans?${queryParams.toString()}`
  );
}

/**
 * Export exam results as CSV or JSON
 */
export async function exportExamResults(
  classId: string,
  classExamId: string,
  format: 'CSV' | 'JSON' = 'CSV'
): Promise<Blob> {
  const token = TokenManager.getAccessToken();
  const baseUrl = configManager.getApiUrl();
  const queryParams = new URLSearchParams({ format });

  const response = await fetch(
    `${baseUrl}/api/classes/${classId}/exams/${classExamId}/export?${queryParams.toString()}`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Check if user can perform action based on limit type
 */
export function canPerformAction(
  limitType: 'classes' | 'students' | 'exams',
  subscription: SubscriptionResponse
): { allowed: boolean; remaining: number | 'unlimited'; message?: string } {
  const { limits, usage, limitsReached } = subscription;

  switch (limitType) {
    case 'classes':
      if (limitsReached.classes) {
        return {
          allowed: false,
          remaining: 0,
          message: `You've reached your class limit (${limits.maxClasses}). Upgrade to Pro for unlimited classes.`,
        };
      }
      if (limits.maxClasses === null) {
        return { allowed: true, remaining: 'unlimited' };
      }
      return {
        allowed: true,
        remaining: limits.maxClasses - usage.currentClasses,
      };

    case 'students':
      if (limitsReached.students) {
        return {
          allowed: false,
          remaining: 0,
          message: `You've reached your student limit (${limits.maxStudents}). Upgrade to Pro for unlimited students.`,
        };
      }
      if (limits.maxStudents === null) {
        return { allowed: true, remaining: 'unlimited' };
      }
      return {
        allowed: true,
        remaining: limits.maxStudents - usage.currentStudents,
      };

    case 'exams':
      if (limitsReached.exams) {
        return {
          allowed: false,
          remaining: 0,
          message: `You've used your monthly exam limit (${limits.maxExamsPerMonth}). Upgrade to Pro for unlimited exams.`,
        };
      }
      if (limits.maxExamsPerMonth === null) {
        return { allowed: true, remaining: 'unlimited' };
      }
      return {
        allowed: true,
        remaining: limits.maxExamsPerMonth - usage.examsCreatedThisMonth,
      };

    default:
      return { allowed: true, remaining: 'unlimited' };
  }
}

/**
 * Get warning message if approaching limit
 */
export function getLimitWarning(
  limitType: 'classes' | 'students' | 'exams',
  subscription: SubscriptionResponse
): string | null {
  const { limits, usage } = subscription;

  if (subscription.tier !== 'FREE') return null;

  switch (limitType) {
    case 'classes':
      if (limits.maxClasses !== null && usage.currentClasses >= limits.maxClasses - 1) {
        return `${limits.maxClasses - usage.currentClasses} class remaining. Upgrade for unlimited classes.`;
      }
      break;

    case 'students':
      if (limits.maxStudents !== null && usage.currentStudents >= limits.maxStudents - 5) {
        return `${limits.maxStudents - usage.currentStudents} students remaining. Upgrade for unlimited students.`;
      }
      break;

    case 'exams':
      if (
        limits.maxExamsPerMonth !== null &&
        usage.examsCreatedThisMonth >= limits.maxExamsPerMonth - 2
      ) {
        return `${limits.maxExamsPerMonth - usage.examsCreatedThisMonth} exams remaining this month. Upgrade for unlimited exams.`;
      }
      break;
  }

  return null;
}
