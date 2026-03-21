import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckSubscriptionLimits } from '../../src/application/use-cases/subscriptions/CheckSubscriptionLimits.js';
import { ISubscriptionRepository } from '../../src/domain/repositories/ISubscriptionRepository.js';
import { Subscription } from '../../src/domain/entities/Subscription.js';

describe('CheckSubscriptionLimits Use Case', () => {
  let mockRepository: ISubscriptionRepository;
  let useCase: CheckSubscriptionLimits;

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      findByStripeCustomerId: vi.fn(),
      findByStripeSubscriptionId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getUsageRecord: vi.fn(),
      upsertUsageRecord: vi.fn(),
      incrementExamCount: vi.fn(),
    };
    useCase = new CheckSubscriptionLimits(mockRepository);
  });

  describe('execute', () => {
    it('should create FREE subscription for new users', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue({} as any);
      
      const result = await useCase.execute('user-123');
      
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.canCreateExam).toBe(true);
      expect(result.currentUsage).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.planName).toBe('Free');
    });

    it('should return correct limits for existing FREE user with no usage', async () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue(null);
      
      const result = await useCase.execute('user-123');
      
      expect(result.canCreateExam).toBe(true);
      expect(result.currentUsage).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.isUnlimited).toBe(false);
    });

    it('should return correct limits for FREE user at limit', async () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 5 });
      
      const result = await useCase.execute('user-123');
      
      expect(result.canCreateExam).toBe(false);
      expect(result.currentUsage).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it('should return unlimited for PRO users', async () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 100 });
      
      const result = await useCase.execute('user-123');
      
      expect(result.canCreateExam).toBe(true);
      expect(result.limit).toBeNull();
      expect(result.remaining).toBeNull();
      expect(result.isUnlimited).toBe(true);
      expect(result.planName).toBe('Pro');
    });

    it('should return correct limits for TEAM users', async () => {
      const subscription = Subscription.createNew('user-123', 'TEAM');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 50 });
      
      const result = await useCase.execute('user-123');
      
      expect(result.canCreateExam).toBe(true);
      expect(result.planName).toBe('Team');
      expect(result.isUnlimited).toBe(true);
    });

    it('should return correct limits for ENTERPRISE users', async () => {
      const subscription = Subscription.createNew('user-123', 'ENTERPRISE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 1000 });
      
      const result = await useCase.execute('user-123');
      
      expect(result.canCreateExam).toBe(true);
      expect(result.planName).toBe('Enterprise');
      expect(result.isUnlimited).toBe(true);
    });
  });
});