import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordExamUsage } from '../../src/application/use-cases/subscriptions/RecordExamUsage.js';
import { ISubscriptionRepository } from '../../src/domain/repositories/ISubscriptionRepository.js';
import { Subscription } from '../../src/domain/entities/Subscription.js';

describe('RecordExamUsage Use Case', () => {
  let mockRepository: ISubscriptionRepository;
  let useCase: RecordExamUsage;

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
    useCase = new RecordExamUsage(mockRepository);
  });

  describe('execute', () => {
    it('should create FREE subscription and record usage for new users', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue({} as any);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue(null);
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(1);
      
      const result = await useCase.execute('user-123');
      
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.incrementExamCount).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.newCount).toBe(1);
      expect(result.canCreateMore).toBe(true);
    });

    it('should increment usage for FREE user', async () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 2 });
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(3);
      
      const result = await useCase.execute('user-123');
      
      expect(result.success).toBe(true);
      expect(result.newCount).toBe(3);
      expect(result.remaining).toBe(2); // 5 - 3 = 2
    });

    it('should fail when FREE user reaches limit', async () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 5 });
      
      const result = await useCase.execute('user-123');
      
      expect(result.success).toBe(false);
      expect(result.newCount).toBe(5);
      expect(result.canCreateMore).toBe(false);
      expect(result.remaining).toBe(0);
      expect(mockRepository.incrementExamCount).not.toHaveBeenCalled();
    });

    it('should allow PRO users to create unlimited exams', async () => {
      const subscription = Subscription.createNew('user-123', 'PRO');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 100 });
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(101);
      
      const result = await useCase.execute('user-123');
      
      expect(result.success).toBe(true);
      expect(result.canCreateMore).toBe(true);
      expect(result.remaining).toBeNull(); // unlimited
    });

    it('should allow TEAM users to create unlimited exams', async () => {
      const subscription = Subscription.createNew('user-123', 'TEAM');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 500 });
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(501);
      
      const result = await useCase.execute('user-123');
      
      expect(result.success).toBe(true);
      expect(result.canCreateMore).toBe(true);
    });

    it('should allow ENTERPRISE users to create unlimited exams', async () => {
      const subscription = Subscription.createNew('user-123', 'ENTERPRISE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 10000 });
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(10001);
      
      const result = await useCase.execute('user-123');
      
      expect(result.success).toBe(true);
      expect(result.canCreateMore).toBe(true);
      expect(result.remaining).toBeNull();
    });

    it('should correctly calculate remaining after increment', async () => {
      const subscription = Subscription.createNew('user-123', 'FREE');
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription);
      vi.mocked(mockRepository.getUsageRecord).mockResolvedValue({ examsCreated: 3 });
      vi.mocked(mockRepository.incrementExamCount).mockResolvedValue(4);
      
      const result = await useCase.execute('user-123');
      
      expect(result.remaining).toBe(1); // 5 - 4 = 1
      expect(result.canCreateMore).toBe(true);
    });
  });
});