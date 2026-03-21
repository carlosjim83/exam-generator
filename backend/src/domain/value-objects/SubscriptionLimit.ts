import { SubscriptionPlan } from '@prisma/client';

/**
 * Plan Limits Value Object
 * Defines the limits for each subscription plan
 */
export interface PlanLimits {
  // Exam limits
  examsPerMonth: number | null; // null = unlimited
  
  // Student limits
  maxStudents: number | null; // null = unlimited
  
  // Class limits
  maxActiveClasses: number | null; // null = unlimited
  
  // Teacher limits (for Team/Enterprise)
  maxTeachers: number | null; // null = unlimited
  
  // Features
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasSSO: boolean;
  hasCustomAI: boolean;
  hasSLA: boolean;
  
  // Support
  supportType: 'community' | 'email' | 'priority' | 'dedicated';
}

const FREE_LIMITS: PlanLimits = {
  examsPerMonth: 5,
  maxStudents: 30,
  maxActiveClasses: 3,
  maxTeachers: 1,
  hasAdvancedAnalytics: false,
  hasPrioritySupport: false,
  hasSSO: false,
  hasCustomAI: false,
  hasSLA: false,
  supportType: 'community',
};

const PRO_LIMITS: PlanLimits = {
  examsPerMonth: null, // unlimited
  maxStudents: 500,
  maxActiveClasses: null, // unlimited
  maxTeachers: 1,
  hasAdvancedAnalytics: true,
  hasPrioritySupport: true,
  hasSSO: false,
  hasCustomAI: false,
  hasSLA: false,
  supportType: 'priority',
};

const TEAM_LIMITS: PlanLimits = {
  examsPerMonth: null, // unlimited
  maxStudents: 5000,
  maxActiveClasses: null, // unlimited
  maxTeachers: 10,
  hasAdvancedAnalytics: true,
  hasPrioritySupport: true,
  hasSSO: true, // Google, Microsoft
  hasCustomAI: false,
  hasSLA: false,
  supportType: 'priority',
};

const ENTERPRISE_LIMITS: PlanLimits = {
  examsPerMonth: null, // unlimited
  maxStudents: null, // unlimited
  maxActiveClasses: null, // unlimited
  maxTeachers: null, // unlimited
  hasAdvancedAnalytics: true,
  hasPrioritySupport: true,
  hasSSO: true, // SAML/LDAP
  hasCustomAI: true,
  hasSLA: true,
  supportType: 'dedicated',
};

export class SubscriptionLimit {
  private constructor() {}

  /**
   * Get the limits for a specific subscription plan
   */
  static getLimits(plan: SubscriptionPlan): PlanLimits {
    switch (plan) {
      case 'FREE':
        return FREE_LIMITS;
      case 'PRO':
        return PRO_LIMITS;
      case 'TEAM':
        return TEAM_LIMITS;
      case 'ENTERPRISE':
        return ENTERPRISE_LIMITS;
      default:
        return FREE_LIMITS;
    }
  }

  /**
   * Check if a user can create another exam this month
   */
  static canCreateExam(plan: SubscriptionPlan, currentUsage: number): boolean {
    const limits = this.getLimits(plan);
    
    if (limits.examsPerMonth === null) {
      return true; // Unlimited
    }
    
    return currentUsage < limits.examsPerMonth;
  }

  /**
   * Get remaining exams for the current month
   */
  static getRemainingExams(plan: SubscriptionPlan, currentUsage: number): number | null {
    const limits = this.getLimits(plan);
    
    if (limits.examsPerMonth === null) {
      return null; // Unlimited
    }
    
    return Math.max(0, limits.examsPerMonth - currentUsage);
  }

  /**
   * Check if a plan supports SSO
   */
  static hasSSO(plan: SubscriptionPlan): boolean {
    return this.getLimits(plan).hasSSO;
  }

  /**
   * Get plan display name
   */
  static getPlanName(plan: SubscriptionPlan): string {
    switch (plan) {
      case 'FREE':
        return 'Free';
      case 'PRO':
        return 'Pro';
      case 'TEAM':
        return 'Team';
      case 'ENTERPRISE':
        return 'Enterprise';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get plan monthly price (in cents for Stripe)
   */
  static getPlanPrice(plan: SubscriptionPlan): number | null {
    switch (plan) {
      case 'FREE':
        return 0;
      case 'PRO':
        return 999; // $9.99
      case 'TEAM':
        return 14900; // $149.00
      case 'ENTERPRISE':
        return null; // Custom pricing
      default:
        return null;
    }
  }
}