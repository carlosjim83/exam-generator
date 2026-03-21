import { describe, it, expect } from 'vitest';
import { SubscriptionLimit } from '../../src/domain/value-objects/SubscriptionLimit.js';

describe('SubscriptionLimit', () => {
  describe('getLimits', () => {
    it('should return correct limits for FREE plan', () => {
      const limits = SubscriptionLimit.getLimits('FREE');
      
      expect(limits.examsPerMonth).toBe(5);
      expect(limits.maxStudents).toBe(30);
      expect(limits.maxActiveClasses).toBe(3);
      expect(limits.hasAdvancedAnalytics).toBe(false);
      expect(limits.hasPrioritySupport).toBe(false);
      expect(limits.hasSSO).toBe(false);
      expect(limits.supportType).toBe('community');
    });

    it('should return correct limits for PRO plan', () => {
      const limits = SubscriptionLimit.getLimits('PRO');
      
      expect(limits.examsPerMonth).toBeNull(); // unlimited
      expect(limits.maxStudents).toBe(500);
      expect(limits.maxActiveClasses).toBeNull(); // unlimited
      expect(limits.hasAdvancedAnalytics).toBe(true);
      expect(limits.hasPrioritySupport).toBe(true);
      expect(limits.hasSSO).toBe(false);
    });

    it('should return correct limits for TEAM plan', () => {
      const limits = SubscriptionLimit.getLimits('TEAM');
      
      expect(limits.examsPerMonth).toBeNull(); // unlimited
      expect(limits.maxStudents).toBe(5000);
      expect(limits.maxTeachers).toBe(10);
      expect(limits.hasSSO).toBe(true);
      expect(limits.supportType).toBe('priority');
    });

    it('should return correct limits for ENTERPRISE plan', () => {
      const limits = SubscriptionLimit.getLimits('ENTERPRISE');
      
      expect(limits.examsPerMonth).toBeNull(); // unlimited
      expect(limits.maxStudents).toBeNull(); // unlimited
      expect(limits.maxTeachers).toBeNull(); // unlimited
      expect(limits.hasSSO).toBe(true);
      expect(limits.hasCustomAI).toBe(true);
      expect(limits.hasSLA).toBe(true);
      expect(limits.supportType).toBe('dedicated');
    });
  });

  describe('canCreateExam', () => {
    it('should return false when FREE user has used all exams', () => {
      const canCreate = SubscriptionLimit.canCreateExam('FREE', 5);
      expect(canCreate).toBe(false);
    });

    it('should return true when FREE user has not used all exams', () => {
      const canCreate = SubscriptionLimit.canCreateExam('FREE', 3);
      expect(canCreate).toBe(true);
    });

    it('should return true for PRO users regardless of usage', () => {
      const canCreate = SubscriptionLimit.canCreateExam('PRO', 100);
      expect(canCreate).toBe(true);
    });
  });

  describe('getRemainingExams', () => {
    it('should return null for unlimited plans', () => {
      const remaining = SubscriptionLimit.getRemainingExams('PRO', 50);
      expect(remaining).toBeNull();
    });

    it('should return correct remaining for FREE plan', () => {
      const remaining = SubscriptionLimit.getRemainingExams('FREE', 2);
      expect(remaining).toBe(3);
    });

    it('should return 0 when limit reached', () => {
      const remaining = SubscriptionLimit.getRemainingExams('FREE', 6);
      expect(remaining).toBe(0);
    });
  });

  describe('getPlanName', () => {
    it('should return correct names for each plan', () => {
      expect(SubscriptionLimit.getPlanName('FREE')).toBe('Free');
      expect(SubscriptionLimit.getPlanName('PRO')).toBe('Pro');
      expect(SubscriptionLimit.getPlanName('TEAM')).toBe('Team');
      expect(SubscriptionLimit.getPlanName('ENTERPRISE')).toBe('Enterprise');
    });
  });

  describe('getPlanPrice', () => {
    it('should return 0 for FREE plan', () => {
      const price = SubscriptionLimit.getPlanPrice('FREE');
      expect(price).toBe(0);
    });

    it('should return correct price for PRO plan ($9.99 = 999 cents)', () => {
      const price = SubscriptionLimit.getPlanPrice('PRO');
      expect(price).toBe(999);
    });

    it('should return correct price for TEAM plan ($149 = 14900 cents)', () => {
      const price = SubscriptionLimit.getPlanPrice('TEAM');
      expect(price).toBe(14900);
    });

    it('should return null for ENTERPRISE plan (custom pricing)', () => {
      const price = SubscriptionLimit.getPlanPrice('ENTERPRISE');
      expect(price).toBeNull();
    });
  });
});