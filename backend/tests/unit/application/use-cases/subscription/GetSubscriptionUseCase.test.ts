import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSubscriptionUseCase } from '@application/use-cases/subscription/GetSubscriptionUseCase.js';
import { SubscriptionTier, SubscriptionStatus } from '@domain/entities/Subscription.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { Subscription } from '@domain/entities/Subscription.js';
import type { UsageMetrics } from '@domain/entities/UsageMetrics.js';

// Mock factories
function createMockSubscription(tier: SubscriptionTier = SubscriptionTier.FREE): Subscription {
  const id = '123e4567-e89b-42d3-a456-426614174000';
  const teacherId = '123e4567-e89b-42d3-a456-426614174001';

  return {
    id: SubscriptionId.create(id),
    teacherId: UserId.create(teacherId),
    tier,
    status: SubscriptionStatus.ACTIVE,
    isActive: () => true,
    isFreeTier: () => tier === SubscriptionTier.FREE,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    toObject: () => ({
      id,
      teacherId,
      tier,
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: tier === SubscriptionTier.FREE ? undefined : 'stripe-sub-123',
      stripeCustomerId: tier === SubscriptionTier.FREE ? undefined : 'stripe-cust-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  } as any;
}

function createMockUsageMetrics(
  overrides: {
    currentClasses?: number;
    currentStudents?: number;
    examsCreatedThisMonth?: number;
  } = {}
): UsageMetrics {
  const id = '123e4567-e89b-42d3-a456-426614174002';
  const teacherId = '123e4567-e89b-42d3-a456-426614174001';
  const subscriptionId = '123e4567-e89b-42d3-a456-426614174000';

  return {
    id,
    teacherId: UserId.create(teacherId),
    subscriptionId: SubscriptionId.create(subscriptionId),
    period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    currentClasses: overrides.currentClasses ?? 0,
    currentStudents: overrides.currentStudents ?? 0,
    examsCreatedThisMonth: overrides.examsCreatedThisMonth ?? 0,
    examsCreatedTotal: 0,
    peakConcurrentStudents: 0,
    avgExamsPerMonth: 0,
    updateClassCount: (count: number) =>
      createMockUsageMetrics({ ...overrides, currentClasses: count }),
    updateStudentCount: (count: number) =>
      createMockUsageMetrics({ ...overrides, currentStudents: count }),
    incrementExamCount: () =>
      createMockUsageMetrics({
        ...overrides,
        examsCreatedThisMonth: (overrides.examsCreatedThisMonth ?? 0) + 1,
      }),
    toObject: () => ({
      id,
      teacherId,
      subscriptionId,
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: overrides.currentClasses ?? 0,
      currentStudents: overrides.currentStudents ?? 0,
      examsCreatedThisMonth: overrides.examsCreatedThisMonth ?? 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 0,
      avgExamsPerMonth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  } as any;
}

// Mock repositories
const mockSubscriptionRepository = {
  findByTeacherId: vi.fn(),
  create: vi.fn(),
} satisfies Partial<ISubscriptionRepository> as ISubscriptionRepository;

const mockUsageMetricsRepository = {
  findCurrentByTeacherId: vi.fn(),
  getOrCreateCurrent: vi.fn(),
  update: vi.fn(),
} satisfies Partial<IUsageMetricsRepository> as IUsageMetricsRepository;

const mockClassRepository = {
  countByTeacherId: vi.fn(),
  countTotalStudentsByTeacherId: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

describe('GetSubscriptionUseCase', () => {
  let useCase: GetSubscriptionUseCase;
  const teacherId = '123e4567-e89b-42d3-a456-426614174001';

  beforeEach(() => {
    useCase = new GetSubscriptionUseCase(
      mockSubscriptionRepository,
      mockUsageMetricsRepository,
      mockClassRepository
    );
    vi.clearAllMocks();
  });

  describe('execute', () => {
    describe('Free tier (no subscription)', () => {
      it('should create free subscription for new users', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics()
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(0);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.subscription.tier).toBe(SubscriptionTier.FREE);
        expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
        expect(mockSubscriptionRepository.create).toHaveBeenCalled();
      });

      it('should return free tier limits', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics()
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(0);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.limits.maxClasses).toBe(1);
        expect(result.limits.maxStudents).toBe(30);
        expect(result.limits.maxExamsPerMonth).toBe(10);
        expect(result.limits.maxQuestionsPerExam).toBe(50);
        expect(result.limits.maxDocumentsPerExam).toBe(10);
      });

      it('should detect when limits are reached', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics({
            currentClasses: 1,
            currentStudents: 30,
            examsCreatedThisMonth: 10,
          })
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(1);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(30);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.limitsReached.classes).toBe(true);
        expect(result.limitsReached.students).toBe(true);
        expect(result.limitsReached.exams).toBe(true);
        expect(result.upgradeNeeded).toBe(true);
      });

      it('should detect when not all limits are reached', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics({
            currentClasses: 1,
            currentStudents: 15,
            examsCreatedThisMonth: 5,
          })
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(1);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(15);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.limitsReached.classes).toBe(true);
        expect(result.limitsReached.students).toBe(false);
        expect(result.limitsReached.exams).toBe(false);
        expect(result.upgradeNeeded).toBe(true);
      });

      it('should calculate actual usage from database', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics({ currentClasses: 0, currentStudents: 0 })
        );
        vi.mocked(mockUsageMetricsRepository.update).mockResolvedValue(undefined);
        // Database has 1 class and 1 student
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(1);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(1);

        const result = await useCase.execute(UserId.create(teacherId));

        // Should reflect actual counts from database
        expect(result.usage.currentClasses).toBe(1);
        expect(result.usage.currentStudents).toBe(1);
      });
    });

    describe('Pro tier', () => {
      it('should return pro tier limits when subscribed', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(
          createMockSubscription(SubscriptionTier.PRO)
        );
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics()
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(0);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.subscription.tier).toBe(SubscriptionTier.PRO);
        expect(result.limits.maxClasses).toBeNull();
        expect(result.limits.maxStudents).toBeNull();
        expect(result.limits.maxExamsPerMonth).toBeNull();
        expect(result.limits.maxQuestionsPerExam).toBeNull();
        expect(result.limits.maxDocumentsPerExam).toBeNull();
      });

      it('should not report limits reached for unlimited tiers', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(
          createMockSubscription(SubscriptionTier.PRO)
        );
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics({
            currentClasses: 100,
            currentStudents: 1000,
            examsCreatedThisMonth: 500,
          })
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(100);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(1000);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.limitsReached.classes).toBe(false);
        expect(result.limitsReached.students).toBe(false);
        expect(result.limitsReached.exams).toBe(false);
        expect(result.upgradeNeeded).toBe(false);
      });
    });

    describe('Usage metrics', () => {
      it('should return current usage metrics', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics({
            currentClasses: 1,
            currentStudents: 25,
            examsCreatedThisMonth: 7,
          })
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(1);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(25);

        const result = await useCase.execute(UserId.create(teacherId));

        expect(result.usage.currentClasses).toBe(1);
        expect(result.usage.currentStudents).toBe(25);
        expect(result.usage.examsCreatedThisMonth).toBe(7);
      });
    });

    describe('Subscription limits object', () => {
      it('should return correct limits for Free tier', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
        vi.mocked(mockSubscriptionRepository.create).mockImplementation(async (sub) => sub);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics()
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(0);

        const result = await useCase.execute(UserId.create(teacherId));
        const limitsObj = result.limits.toObject();

        expect(limitsObj.tier).toBe('FREE');
        expect(limitsObj.maxClasses).toBe(1);
        expect(limitsObj.maxStudents).toBe(30);
        expect(limitsObj.maxExamsPerMonth).toBe(10);
        expect(limitsObj.maxQuestionsPerExam).toBe(50);
        expect(limitsObj.maxDocumentsPerExam).toBe(10);
        expect(limitsObj.aiModel).toBe('GPT_4O_MINI');
        expect(limitsObj.customBranding).toBe(false);
        expect(limitsObj.exportFeatures).toBe(false);
        expect(limitsObj.analyticsLevel).toBe('BASIC');
      });

      it('should return correct limits for Pro tier', async () => {
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(
          createMockSubscription(SubscriptionTier.PRO)
        );
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          createMockUsageMetrics()
        );
        vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);
        vi.mocked(mockClassRepository.countTotalStudentsByTeacherId).mockResolvedValue(0);

        const result = await useCase.execute(UserId.create(teacherId));
        const limitsObj = result.limits.toObject();

        expect(limitsObj.tier).toBe('PRO');
        expect(limitsObj.maxClasses).toBeNull();
        expect(limitsObj.maxStudents).toBeNull();
        expect(limitsObj.maxExamsPerMonth).toBeNull();
        expect(limitsObj.maxQuestionsPerExam).toBeNull();
        expect(limitsObj.maxDocumentsPerExam).toBeNull();
        expect(limitsObj.aiModel).toBe('GPT_4O');
        expect(limitsObj.customBranding).toBe(true);
        expect(limitsObj.exportFeatures).toBe(true);
        expect(limitsObj.analyticsLevel).toBe('ADVANCED');
      });
    });
  });
});
