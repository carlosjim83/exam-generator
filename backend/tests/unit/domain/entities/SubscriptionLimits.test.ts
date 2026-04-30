import { describe, it, expect } from 'vitest';
import {
  SubscriptionLimits,
  AnalyticsLevel,
  SupportLevel,
  AIModel,
} from '@domain/entities/SubscriptionLimits.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { FREE_TIER_LIMITS, EXAM_LIMITS } from '@config/subscription-limits.js';
import { SubscriptionLimitsMother } from '../../../helpers/factories/SubscriptionLimitsMother.js';

describe('SubscriptionLimits', () => {
  describe('getForTier', () => {
    describe('FREE tier', () => {
      it('should return correct Free tier limits', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.FREE);

        expect(limits.maxClasses).toBe(FREE_TIER_LIMITS.MAX_CLASSES);
        expect(limits.maxStudents).toBe(FREE_TIER_LIMITS.MAX_STUDENTS);
        expect(limits.maxExamsPerMonth).toBe(FREE_TIER_LIMITS.MAX_EXAMS_PER_MONTH);
        expect(limits.maxQuestionsPerExam).toBe(FREE_TIER_LIMITS.MAX_QUESTIONS_PER_EXAM);
        expect(limits.maxDocumentsPerExam).toBe(EXAM_LIMITS.MAX_DOCUMENTS_PER_EXAM);
        expect(limits.maxTeamMembers).toBe(1);
        expect(limits.analyticsLevel).toBe(AnalyticsLevel.BASIC);
        expect(limits.supportLevel).toBe(SupportLevel.EMAIL);
        expect(limits.aiModel).toBe(AIModel.GPT_4O_MINI);
        expect(limits.customBranding).toBe(false);
        expect(limits.exportFeatures).toBe(false);
      });

      it('should return correct limits object via toObject()', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.FREE);
        const obj = limits.toObject();

        expect(obj.tier).toBe('FREE');
        expect(obj.maxClasses).toBe(1);
        expect(obj.maxStudents).toBe(30);
        expect(obj.maxExamsPerMonth).toBe(10);
        expect(obj.maxQuestionsPerExam).toBe(50);
        expect(obj.maxDocumentsPerExam).toBe(10);
        expect(obj.maxTeamMembers).toBe(1);
        expect(obj.analyticsLevel).toBe('BASIC');
        expect(obj.supportLevel).toBe('EMAIL');
        expect(obj.aiModel).toBe('GPT_4O_MINI');
        expect(obj.customBranding).toBe(false);
        expect(obj.exportFeatures).toBe(false);
        expect(obj.lmsIntegrations).toEqual([]);
        expect(obj.apiAccess).toBe(false);
        expect(obj.sso).toBe(false);
        expect(obj.complianceFeatures).toEqual([]);
      });
    });

    describe('PRO tier', () => {
      it('should return unlimited limits for Pro tier', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.PRO);

        expect(limits.maxClasses).toBeNull();
        expect(limits.maxStudents).toBeNull();
        expect(limits.maxExamsPerMonth).toBeNull();
        expect(limits.maxQuestionsPerExam).toBeNull();
        expect(limits.maxDocumentsPerExam).toBeNull();
      });

      it('should return correct Pro tier features', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.PRO);

        expect(limits.analyticsLevel).toBe(AnalyticsLevel.ADVANCED);
        expect(limits.supportLevel).toBe(SupportLevel.PRIORITY);
        expect(limits.aiModel).toBe(AIModel.GPT_4O);
        expect(limits.customBranding).toBe(true);
        expect(limits.exportFeatures).toBe(true);
      });
    });

    describe('PRO_PLUS tier', () => {
      it('should return unlimited limits for Pro Plus tier', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.PRO_PLUS);

        expect(limits.maxClasses).toBeNull();
        expect(limits.maxStudents).toBeNull();
        expect(limits.maxExamsPerMonth).toBeNull();
        expect(limits.maxQuestionsPerExam).toBeNull();
        expect(limits.maxDocumentsPerExam).toBeNull();
      });

      it('should return correct Pro Plus tier features', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.PRO_PLUS);

        expect(limits.analyticsLevel).toBe(AnalyticsLevel.TEAM);
        expect(limits.supportLevel).toBe(SupportLevel.PRIORITY);
        expect(limits.aiModel).toBe(AIModel.GPT_4O);
        expect(limits.customBranding).toBe(true);
        expect(limits.exportFeatures).toBe(true);
        expect(limits.maxTeamMembers).toBe(5);
        expect(limits.apiAccess).toBe(true);
      });
    });

    describe('ENTERPRISE tier', () => {
      it('should return unlimited limits for Enterprise tier', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.ENTERPRISE);

        expect(limits.maxClasses).toBeNull();
        expect(limits.maxStudents).toBeNull();
        expect(limits.maxExamsPerMonth).toBeNull();
        expect(limits.maxQuestionsPerExam).toBeNull();
        expect(limits.maxDocumentsPerExam).toBeNull();
        expect(limits.maxTeamMembers).toBeNull();
      });

      it('should return correct Enterprise tier features', () => {
        const limits = SubscriptionLimits.getForTier(SubscriptionTier.ENTERPRISE);

        expect(limits.analyticsLevel).toBe(AnalyticsLevel.TEAM);
        expect(limits.supportLevel).toBe(SupportLevel.DEDICATED);
        expect(limits.aiModel).toBe(AIModel.GPT_4O);
        expect(limits.customBranding).toBe(true);
        expect(limits.exportFeatures).toBe(true);
        expect(limits.apiAccess).toBe(true);
        expect(limits.sso).toBe(true);
      });
    });
  });

  describe('business logic methods', () => {
    describe('Free tier limits', () => {
      const freeLimits = SubscriptionLimits.getForTier(SubscriptionTier.FREE);

      it('should correctly check class limit', () => {
        expect(freeLimits.canAddClass(0)).toBe(true);
        expect(freeLimits.canAddClass(1)).toBe(false); // At limit
        expect(freeLimits.hasClassLimit()).toBe(true);
      });

      it('should correctly check student limit', () => {
        expect(freeLimits.canAddStudent(29)).toBe(true);
        expect(freeLimits.canAddStudent(30)).toBe(false); // At limit
        expect(freeLimits.hasStudentLimit()).toBe(true);
      });

      it('should correctly check exam limit', () => {
        expect(freeLimits.canCreateExam(9)).toBe(true);
        expect(freeLimits.canCreateExam(10)).toBe(false); // At limit
        expect(freeLimits.hasExamLimit()).toBe(true);
      });

      it('should correctly check question limit', () => {
        expect(freeLimits.canAddQuestions(49)).toBe(true);
        expect(freeLimits.canAddQuestions(50)).toBe(false); // At limit
        expect(freeLimits.hasQuestionLimit()).toBe(true);
      });

      it('should return remaining counts', () => {
        expect(freeLimits.getRemainingClasses(0)).toBe(1);
        expect(freeLimits.getRemainingClasses(1)).toBe(0);
        expect(freeLimits.getRemainingStudents(20)).toBe(10);
        expect(freeLimits.getRemainingStudents(30)).toBe(0);
        expect(freeLimits.getRemainingExams(5)).toBe(5);
        expect(freeLimits.getRemainingExams(10)).toBe(0);
      });
    });

    describe('Pro tier limits (unlimited)', () => {
      const proLimits = SubscriptionLimits.getForTier(SubscriptionTier.PRO);

      it('should always allow adding classes', () => {
        expect(proLimits.canAddClass(0)).toBe(true);
        expect(proLimits.canAddClass(1000)).toBe(true);
        expect(proLimits.hasClassLimit()).toBe(false);
        expect(proLimits.getRemainingClasses(1000)).toBe('unlimited');
      });

      it('should always allow adding students', () => {
        expect(proLimits.canAddStudent(0)).toBe(true);
        expect(proLimits.canAddStudent(10000)).toBe(true);
        expect(proLimits.hasStudentLimit()).toBe(false);
        expect(proLimits.getRemainingStudents(10000)).toBe('unlimited');
      });

      it('should always allow creating exams', () => {
        expect(proLimits.canCreateExam(0)).toBe(true);
        expect(proLimits.canCreateExam(1000)).toBe(true);
        expect(proLimits.hasExamLimit()).toBe(false);
        expect(proLimits.getRemainingExams(1000)).toBe('unlimited');
      });

      it('should always allow adding questions', () => {
        expect(proLimits.canAddQuestions(0)).toBe(true);
        expect(proLimits.canAddQuestions(1000)).toBe(true);
        expect(proLimits.hasQuestionLimit()).toBe(false);
        expect(proLimits.getRemainingQuestions(1000)).toBe('unlimited');
      });
    });
  });

  describe('create validation', () => {
    it('should throw error for negative maxClasses', () => {
      expect(() =>
        SubscriptionLimits.create({
          tier: SubscriptionTier.FREE,
          maxClasses: -1,
          maxStudents: 30,
          maxExamsPerMonth: 10,
          maxQuestionsPerExam: 50,
          maxDocumentsPerExam: 10,
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
        })
      ).toThrow('maxClasses must be null (unlimited) or >= 0');
    });

    it('should allow null for unlimited', () => {
      const limits = SubscriptionLimitsMother.pro();

      expect(limits.maxClasses).toBeNull();
      expect(limits.maxStudents).toBeNull();
    });
  });
});
