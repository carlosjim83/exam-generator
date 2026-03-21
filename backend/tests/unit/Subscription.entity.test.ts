import { describe, it, expect, beforeEach } from 'vitest';
import { Subscription } from '../../src/domain/entities/Subscription.js';

describe('Subscription Entity', () => {
  describe('createNew', () => {
    it('should create a FREE subscription with default values', () => {
      const subscription = Subscription.createNew('user-123');
      
      expect(subscription.id).toBeDefined();
      expect(subscription.userId.value).toBe('user-123');
      expect(subscription.plan).toBe('FREE');
      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.isActive).toBe(true);
      expect(subscription.isFree).toBe(true);
    });

    it('should create a subscription with specified plan', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      expect(subscription.plan).toBe('PRO');
      expect(subscription.isFree).toBe(false);
    });

    it('should set billing cycle to MONTHLY by default', () => {
      const subscription = Subscription.createNew('user-123');
      expect(subscription.props.billingCycle).toBe('MONTHLY');
    });
  });

  describe('upgrade', () => {
    it('should upgrade from FREE to PRO', () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      
      subscription.upgrade('PRO');
      
      expect(subscription.plan).toBe('PRO');
      expect(subscription.status).toBe('ACTIVE');
    });

    it('should upgrade from FREE to TEAM', () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      
      subscription.upgrade('TEAM');
      
      expect(subscription.plan).toBe('TEAM');
    });

    it('should throw error when trying to upgrade to FREE', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      expect(() => subscription.upgrade('FREE')).toThrow('Cannot upgrade to FREE plan');
    });

    it('should preserve PRO limits after upgrade', () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      subscription.upgrade('PRO');
      
      expect(subscription.limits.examsPerMonth).toBeNull(); // unlimited
      expect(subscription.limits.maxStudents).toBe(500);
    });
  });

  describe('cancel', () => {
    it('should set cancelAtPeriodEnd to true', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      subscription.cancel();
      
      expect(subscription.props.cancelAtPeriodEnd).toBe(true);
      expect(subscription.props.cancelledAt).toBeDefined();
    });
  });

  describe('reactivate', () => {
    it('should clear cancellation flags', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      subscription.cancel();
      
      subscription.reactivate();
      
      expect(subscription.props.cancelAtPeriodEnd).toBe(false);
      expect(subscription.props.cancelledAt).toBeNull();
      expect(subscription.status).toBe('ACTIVE');
    });

    it('should do nothing if not cancelled', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      subscription.reactivate();
      
      expect(subscription.status).toBe('ACTIVE');
    });
  });

  describe('suspend', () => {
    it('should set status to SUSPENDED', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      subscription.suspend();
      
      expect(subscription.status).toBe('SUSPENDED');
      expect(subscription.isActive).toBe(false);
    });
  });

  describe('markPastDue', () => {
    it('should set status to PAST_DUE', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      subscription.markPastDue();
      
      expect(subscription.status).toBe('PAST_DUE');
    });
  });

  describe('updatePeriod', () => {
    it('should update billing period dates', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      
      subscription.updatePeriod(startDate, endDate);
      
      expect(subscription.currentPeriodStart).toEqual(startDate);
      expect(subscription.currentPeriodEnd).toEqual(endDate);
    });
  });

  describe('setStripeInfo', () => {
    it('should set Stripe integration fields', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      subscription.setStripeInfo('cus_123', 'sub_456', 'price_789');
      
      expect(subscription.props.stripeCustomerId).toBe('cus_123');
      expect(subscription.props.stripeSubscriptionId).toBe('sub_456');
      expect(subscription.props.stripePriceId).toBe('price_789');
    });
  });

  describe('limits', () => {
    it('should return FREE limits for FREE plan', () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      
      expect(subscription.limits.examsPerMonth).toBe(5);
      expect(subscription.limits.maxStudents).toBe(30);
      expect(subscription.limits.maxActiveClasses).toBe(3);
    });

    it('should return PRO limits for PRO plan', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      
      expect(subscription.limits.examsPerMonth).toBeNull(); // unlimited
      expect(subscription.limits.hasPrioritySupport).toBe(true);
    });

    it('should return TEAM limits for TEAM plan', () => {
      const subscription = Subscription.createNew('user-123', 'TEAM');
      
      expect(subscription.limits.maxStudents).toBe(5000);
      expect(subscription.limits.maxTeachers).toBe(10);
      expect(subscription.limits.hasSSO).toBe(true);
    });

    it('should return ENTERPRISE limits for ENTERPRISE plan', () => {
      const subscription = Subscription.createNew('user-123', 'ENTERPRISE');
      
      expect(subscription.limits.maxStudents).toBeNull(); // unlimited
      expect(subscription.limits.hasSLA).toBe(true);
      expect(subscription.limits.hasCustomAI).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should return all subscription properties', () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      subscription.setStripeInfo('cus_123', 'sub_456', 'price_789');
      
      const json = subscription.toJSON();
      
      expect(json.userId).toBe('user-123');
      expect(json.plan).toBe('PRO');
      expect(json.status).toBe('ACTIVE');
      expect(json.stripeCustomerId).toBe('cus_123');
    });
  });
});