/**
 * SubscriptionLimits Mother
 * Provides pre-configured SubscriptionLimits domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize SubscriptionLimits entity creation for unit tests (no DB calls)
 */

import {
  SubscriptionLimits,
  SubscriptionLimitsProps,
  AnalyticsLevel,
  SupportLevel,
  AIModel,
} from '@domain/entities/SubscriptionLimits.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { FREE_TIER_LIMITS, AI_MODELS, EXAM_LIMITS } from '@config/subscription-limits.js';

export interface SubscriptionLimitsMotherOptions extends Partial<SubscriptionLimitsProps> {}

export class SubscriptionLimitsMother {
  /**
   * Creates FREE tier subscription limits
   */
  static free(overrides: SubscriptionLimitsMotherOptions = {}): SubscriptionLimits {
    return SubscriptionLimits.create({
      tier: SubscriptionTier.FREE,
      maxClasses: FREE_TIER_LIMITS.MAX_CLASSES,
      maxStudents: FREE_TIER_LIMITS.MAX_STUDENTS,
      maxExamsPerMonth: FREE_TIER_LIMITS.MAX_EXAMS_PER_MONTH,
      maxQuestionsPerExam: FREE_TIER_LIMITS.MAX_QUESTIONS_PER_EXAM,
      maxDocumentsPerExam: EXAM_LIMITS.MAX_DOCUMENTS_PER_EXAM,
      maxTeamMembers: 1,
      analyticsLevel: AnalyticsLevel.BASIC,
      supportLevel: SupportLevel.EMAIL,
      aiModel: AIModel[AI_MODELS.FREE],
      customBranding: false,
      exportFeatures: false,
      lmsIntegrations: [],
      apiAccess: false,
      sso: false,
      complianceFeatures: [],
      ...overrides,
    });
  }

  /**
   * Creates PRO tier subscription limits (unlimited)
   */
  static pro(overrides: SubscriptionLimitsMotherOptions = {}): SubscriptionLimits {
    return SubscriptionLimits.create({
      tier: SubscriptionTier.PRO,
      maxClasses: null,
      maxStudents: null,
      maxExamsPerMonth: null,
      maxQuestionsPerExam: null,
      maxDocumentsPerExam: null,
      maxTeamMembers: 1,
      analyticsLevel: AnalyticsLevel.ADVANCED,
      supportLevel: SupportLevel.PRIORITY,
      aiModel: AIModel[AI_MODELS.PRO],
      customBranding: true,
      exportFeatures: true,
      lmsIntegrations: [],
      apiAccess: false,
      sso: false,
      complianceFeatures: [],
      ...overrides,
    });
  }

  /**
   * Creates PRO_PLUS tier subscription limits
   */
  static proPlus(overrides: SubscriptionLimitsMotherOptions = {}): SubscriptionLimits {
    return SubscriptionLimits.create({
      tier: SubscriptionTier.PRO_PLUS,
      maxClasses: null,
      maxStudents: null,
      maxExamsPerMonth: null,
      maxQuestionsPerExam: null,
      maxDocumentsPerExam: null,
      maxTeamMembers: 5,
      analyticsLevel: AnalyticsLevel.TEAM,
      supportLevel: SupportLevel.PRIORITY,
      aiModel: AIModel[AI_MODELS.PRO_PLUS],
      customBranding: true,
      exportFeatures: true,
      lmsIntegrations: ['google_classroom', 'microsoft_teams', 'canvas'],
      apiAccess: true,
      sso: false,
      complianceFeatures: [],
      ...overrides,
    });
  }

  /**
   * Creates ENTERPRISE tier subscription limits
   */
  static enterprise(overrides: SubscriptionLimitsMotherOptions = {}): SubscriptionLimits {
    return SubscriptionLimits.create({
      tier: SubscriptionTier.ENTERPRISE,
      maxClasses: null,
      maxStudents: null,
      maxExamsPerMonth: null,
      maxQuestionsPerExam: null,
      maxDocumentsPerExam: null,
      maxTeamMembers: null,
      analyticsLevel: AnalyticsLevel.TEAM,
      supportLevel: SupportLevel.DEDICATED,
      aiModel: AIModel[AI_MODELS.ENTERPRISE],
      customBranding: true,
      exportFeatures: true,
      lmsIntegrations: ['google_classroom', 'microsoft_teams', 'canvas'],
      apiAccess: true,
      sso: true,
      complianceFeatures: ['FERPA', 'GDPR', 'COPPA'],
      ...overrides,
    });
  }

  /**
   * Base factory method - creates SubscriptionLimits with custom props
   */
  static create(overrides: SubscriptionLimitsMotherOptions = {}): SubscriptionLimits {
    return this.free(overrides);
  }
}
