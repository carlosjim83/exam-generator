import { describe, expect, it } from 'vitest';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { LIMIT_ERRORS } from '@config/subscription-limits.js';

describe('SubscriptionEnforcementService', () => {
  const service = new SubscriptionEnforcementService();

  describe('enforceClassLimit', () => {
    it('should not throw when under FREE tier class limit', () => {
      expect(() => service.enforceClassLimit(0, SubscriptionTier.FREE)).not.toThrow();
    });

    it('should throw when at FREE tier class limit', () => {
      expect(() => service.enforceClassLimit(1, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.CLASS_LIMIT.FREE
      );
    });

    it('should throw when over FREE tier class limit', () => {
      expect(() => service.enforceClassLimit(5, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.CLASS_LIMIT.FREE
      );
    });

    it('should not throw for PRO tier regardless of class count', () => {
      expect(() => service.enforceClassLimit(999, SubscriptionTier.PRO)).not.toThrow();
    });

    it('should not throw for PRO_PLUS tier regardless of class count', () => {
      expect(() => service.enforceClassLimit(999, SubscriptionTier.PRO_PLUS)).not.toThrow();
    });

    it('should not throw for ENTERPRISE tier regardless of class count', () => {
      expect(() => service.enforceClassLimit(999, SubscriptionTier.ENTERPRISE)).not.toThrow();
    });
  });

  describe('enforceStudentLimit', () => {
    it('should not throw when under FREE tier student limit', () => {
      expect(() => service.enforceStudentLimit(29, SubscriptionTier.FREE)).not.toThrow();
    });

    it('should throw when at FREE tier student limit', () => {
      expect(() => service.enforceStudentLimit(30, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.STUDENT_LIMIT.FREE
      );
    });

    it('should throw when over FREE tier student limit', () => {
      expect(() => service.enforceStudentLimit(35, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.STUDENT_LIMIT.FREE
      );
    });

    it('should not throw for PRO tier regardless of student count', () => {
      expect(() => service.enforceStudentLimit(999, SubscriptionTier.PRO)).not.toThrow();
    });
  });

  describe('enforceExamLimit', () => {
    it('should not throw when under FREE tier exam limit', () => {
      expect(() => service.enforceExamLimit(9, SubscriptionTier.FREE)).not.toThrow();
    });

    it('should throw when at FREE tier exam limit', () => {
      expect(() => service.enforceExamLimit(10, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.EXAM_LIMIT.FREE
      );
    });

    it('should throw when over FREE tier exam limit', () => {
      expect(() => service.enforceExamLimit(15, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.EXAM_LIMIT.FREE
      );
    });

    it('should not throw for PRO tier regardless of exam count', () => {
      expect(() => service.enforceExamLimit(999, SubscriptionTier.PRO)).not.toThrow();
    });
  });

  describe('enforceQuestionLimit', () => {
    it('should not throw when under FREE tier question limit', () => {
      expect(() => service.enforceQuestionLimit(49, SubscriptionTier.FREE)).not.toThrow();
    });

    it('should throw when at FREE tier question limit', () => {
      expect(() => service.enforceQuestionLimit(50, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.QUESTION_LIMIT.FREE
      );
    });

    it('should throw when over FREE tier question limit', () => {
      expect(() => service.enforceQuestionLimit(55, SubscriptionTier.FREE)).toThrow(
        LIMIT_ERRORS.QUESTION_LIMIT.FREE
      );
    });

    it('should not throw for PRO tier regardless of question count', () => {
      expect(() => service.enforceQuestionLimit(999, SubscriptionTier.PRO)).not.toThrow();
    });
  });
});
