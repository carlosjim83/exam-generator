import { SubscriptionTier } from './Subscription.js';

/**
 * Analytics Level Enum
 */
export enum AnalyticsLevel {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  TEAM = 'TEAM',
}

/**
 * Support Level Enum
 */
export enum SupportLevel {
  EMAIL = 'EMAIL',
  PRIORITY = 'PRIORITY',
  DEDICATED = 'DEDICATED',
}

/**
 * AI Model Enum
 */
export enum AIModel {
  GPT_4O_MINI = 'GPT_4O_MINI',
  GPT_4O = 'GPT_4O',
}

export interface SubscriptionLimitsProps {
  tier: SubscriptionTier;
  maxClasses: number | null;
  maxStudents: number | null;
  maxExamsPerMonth: number | null;
  maxQuestionsPerExam: number | null;
  maxTeamMembers: number | null;
  analyticsLevel: AnalyticsLevel;
  supportLevel: SupportLevel;
  aiModel: AIModel;
  customBranding: boolean;
  exportFeatures: boolean;
  lmsIntegrations: string[];
  apiAccess: boolean;
  sso: boolean;
  complianceFeatures: string[];
}

/**
 * SubscriptionLimits Entity
 * Defines the limits for each subscription tier
 */
export class SubscriptionLimits {
  private constructor(private props: SubscriptionLimitsProps) {}

  static create(props: SubscriptionLimitsProps): SubscriptionLimits {
    // Validation: null means unlimited
    if (props.maxClasses !== null && props.maxClasses < 0) {
      throw new Error('maxClasses must be null (unlimited) or >= 0');
    }
    if (props.maxStudents !== null && props.maxStudents < 0) {
      throw new Error('maxStudents must be null (unlimited) or >= 0');
    }
    if (props.maxExamsPerMonth !== null && props.maxExamsPerMonth < 0) {
      throw new Error('maxExamsPerMonth must be null (unlimited) or >= 0');
    }
    if (props.maxQuestionsPerExam !== null && props.maxQuestionsPerExam < 0) {
      throw new Error('maxQuestionsPerExam must be null (unlimited) or >= 0');
    }
    if (props.maxTeamMembers !== null && props.maxTeamMembers < 0) {
      throw new Error('maxTeamMembers must be null (unlimited) or >= 0');
    }

    return new SubscriptionLimits(props);
  }

  /**
   * Get limits for a specific tier
   */
  static getForTier(tier: SubscriptionTier): SubscriptionLimits {
    switch (tier) {
      case SubscriptionTier.FREE:
        return SubscriptionLimits.create({
          tier: SubscriptionTier.FREE,
          maxClasses: 1,
          maxStudents: 30,
          maxExamsPerMonth: 10,
          maxQuestionsPerExam: 50,
          maxTeamMembers: 1,
          analyticsLevel: AnalyticsLevel.BASIC,
          supportLevel: SupportLevel.EMAIL,
          aiModel: AIModel.GPT_4O_MINI,
          customBranding: false,
          exportFeatures: false,
          lmsIntegrations: [],
          apiAccess: false,
          sso: false,
          complianceFeatures: [],
        });

      case SubscriptionTier.PRO:
        return SubscriptionLimits.create({
          tier: SubscriptionTier.PRO,
          maxClasses: null,
          maxStudents: null,
          maxExamsPerMonth: null,
          maxQuestionsPerExam: null,
          maxTeamMembers: 1,
          analyticsLevel: AnalyticsLevel.ADVANCED,
          supportLevel: SupportLevel.PRIORITY,
          aiModel: AIModel.GPT_4O,
          customBranding: true,
          exportFeatures: true,
          lmsIntegrations: [],
          apiAccess: false,
          sso: false,
          complianceFeatures: [],
        });

      case SubscriptionTier.PRO_PLUS:
        return SubscriptionLimits.create({
          tier: SubscriptionTier.PRO_PLUS,
          maxClasses: null,
          maxStudents: null,
          maxExamsPerMonth: null,
          maxQuestionsPerExam: null,
          maxTeamMembers: 5,
          analyticsLevel: AnalyticsLevel.TEAM,
          supportLevel: SupportLevel.PRIORITY,
          aiModel: AIModel.GPT_4O,
          customBranding: true,
          exportFeatures: true,
          lmsIntegrations: ['google_classroom', 'microsoft_teams', 'canvas'],
          apiAccess: true,
          sso: false,
          complianceFeatures: [],
        });

      case SubscriptionTier.ENTERPRISE:
        return SubscriptionLimits.create({
          tier: SubscriptionTier.ENTERPRISE,
          maxClasses: null,
          maxStudents: null,
          maxExamsPerMonth: null,
          maxQuestionsPerExam: null,
          maxTeamMembers: null,
          analyticsLevel: AnalyticsLevel.TEAM,
          supportLevel: SupportLevel.DEDICATED,
          aiModel: AIModel.GPT_4O,
          customBranding: true,
          exportFeatures: true,
          lmsIntegrations: ['google_classroom', 'microsoft_teams', 'canvas'],
          apiAccess: true,
          sso: true,
          complianceFeatures: ['FERPA', 'GDPR', 'COPPA'],
        });

      default:
        throw new Error(`Unknown tier: ${tier}`);
    }
  }

  // Getters
  get tier(): SubscriptionTier {
    return this.props.tier;
  }

  get maxClasses(): number | null {
    return this.props.maxClasses;
  }

  get maxStudents(): number | null {
    return this.props.maxStudents;
  }

  get maxExamsPerMonth(): number | null {
    return this.props.maxExamsPerMonth;
  }

  get maxQuestionsPerExam(): number | null {
    return this.props.maxQuestionsPerExam;
  }

  get maxTeamMembers(): number | null {
    return this.props.maxTeamMembers;
  }

  get analyticsLevel(): AnalyticsLevel {
    return this.props.analyticsLevel;
  }

  get supportLevel(): SupportLevel {
    return this.props.supportLevel;
  }

  get aiModel(): AIModel {
    return this.props.aiModel;
  }

  get customBranding(): boolean {
    return this.props.customBranding;
  }

  get exportFeatures(): boolean {
    return this.props.exportFeatures;
  }

  get lmsIntegrations(): string[] {
    return this.props.lmsIntegrations;
  }

  get apiAccess(): boolean {
    return this.props.apiAccess;
  }

  get sso(): boolean {
    return this.props.sso;
  }

  get complianceFeatures(): string[] {
    return this.props.complianceFeatures;
  }

  // Business logic methods
  hasClassLimit(): boolean {
    return this.props.maxClasses !== null;
  }

  hasStudentLimit(): boolean {
    return this.props.maxStudents !== null;
  }

  hasExamLimit(): boolean {
    return this.props.maxExamsPerMonth !== null;
  }

  hasQuestionLimit(): boolean {
    return this.props.maxQuestionsPerExam !== null;
  }

  hasTeamMemberLimit(): boolean {
    return this.props.maxTeamMembers !== null;
  }

  canAddClass(currentClasses: number): boolean {
    return this.props.maxClasses === null || currentClasses < this.props.maxClasses;
  }

  canAddStudent(currentStudents: number): boolean {
    return this.props.maxStudents === null || currentStudents < this.props.maxStudents;
  }

  canCreateExam(examsThisMonth: number): boolean {
    return this.props.maxExamsPerMonth === null || examsThisMonth < this.props.maxExamsPerMonth;
  }

  canAddQuestions(currentQuestions: number): boolean {
    return (
      this.props.maxQuestionsPerExam === null || currentQuestions < this.props.maxQuestionsPerExam
    );
  }

  canAddTeamMember(currentMembers: number): boolean {
    return this.props.maxTeamMembers === null || currentMembers < this.props.maxTeamMembers;
  }

  getRemainingClasses(currentClasses: number): number | 'unlimited' {
    if (this.props.maxClasses === null) {
      return 'unlimited';
    }
    return Math.max(0, this.props.maxClasses - currentClasses);
  }

  getRemainingStudents(currentStudents: number): number | 'unlimited' {
    if (this.props.maxStudents === null) {
      return 'unlimited';
    }
    return Math.max(0, this.props.maxStudents - currentStudents);
  }

  getRemainingExams(examsThisMonth: number): number | 'unlimited' {
    if (this.props.maxExamsPerMonth === null) {
      return 'unlimited';
    }
    return Math.max(0, this.props.maxExamsPerMonth - examsThisMonth);
  }

  getRemainingQuestions(currentQuestions: number): number | 'unlimited' {
    if (this.props.maxQuestionsPerExam === null) {
      return 'unlimited';
    }
    return Math.max(0, this.props.maxQuestionsPerExam - currentQuestions);
  }

  getRemainingTeamMembers(currentMembers: number): number | 'unlimited' {
    if (this.props.maxTeamMembers === null) {
      return 'unlimited';
    }
    return Math.max(0, this.props.maxTeamMembers - currentMembers);
  }

  toObject() {
    return {
      tier: this.props.tier,
      maxClasses: this.props.maxClasses,
      maxStudents: this.props.maxStudents,
      maxExamsPerMonth: this.props.maxExamsPerMonth,
      maxQuestionsPerExam: this.props.maxQuestionsPerExam,
      maxTeamMembers: this.props.maxTeamMembers,
      analyticsLevel: this.props.analyticsLevel,
      supportLevel: this.props.supportLevel,
      aiModel: this.props.aiModel,
      customBranding: this.props.customBranding,
      exportFeatures: this.props.exportFeatures,
      lmsIntegrations: this.props.lmsIntegrations,
      apiAccess: this.props.apiAccess,
      sso: this.props.sso,
      complianceFeatures: this.props.complianceFeatures,
    };
  }
}
