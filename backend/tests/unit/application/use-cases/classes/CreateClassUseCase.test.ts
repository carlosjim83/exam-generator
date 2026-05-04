import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CreateClassCommand,
  CreateClassUseCase,
} from '@application/use-cases/classes/CreateClassUseCase.js';
import { Class } from '@domain/entities/Class.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import { LIMIT_ERRORS } from '@config/subscription-limits.js';

// Mock repositories
const mockClassRepository = {
  existsByCode: vi.fn(),
  save: vi.fn(),
  countByTeacherId: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

const mockSubscriptionRepository = {
  findByTeacherId: vi.fn(),
} satisfies Partial<ISubscriptionRepository> as ISubscriptionRepository;

const mockUsageMetricsRepository = {
  findCurrentByTeacherId: vi.fn(),
  getOrCreateCurrent: vi.fn(),
  incrementClassCount: vi.fn(),
} satisfies Partial<IUsageMetricsRepository> as IUsageMetricsRepository;

const subscriptionEnforcementService = new SubscriptionEnforcementService();

describe('CreateClassUseCase', () => {
  let useCase: CreateClassUseCase;
  let teacherId: string;

  beforeEach(() => {
    useCase = new CreateClassUseCase(
      mockClassRepository,
      mockSubscriptionRepository,
      mockUsageMetricsRepository,
      subscriptionEnforcementService
    );
    teacherId = '123e4567-e89b-42d3-a456-426614174000';
    vi.clearAllMocks();

    // Default: no subscription (Free tier)
    vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
    vi.mocked(mockUsageMetricsRepository.findCurrentByTeacherId).mockResolvedValue(null);
  });

  describe('execute', () => {
    it('should create a class with valid data', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(
        teacherId,
        'Mathematics 101',
        'Intro to Algebra',
        '#FF5733'
      );

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.name).toBe('Mathematics 101');
      expect(result.description).toBe('Intro to Algebra');
      expect(result.color).toBe('#FF5733');
      expect(result.code.length).toBe(6);
      expect(mockClassRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a class with minimal data', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(teacherId, 'Physics Class');

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.name).toBe('Physics Class');
      expect(result.description).toBeNull();
      expect(result.color).toBeNull();
    });

    it('should generate unique class code', async () => {
      vi.mocked(mockClassRepository.existsByCode)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.code.length).toBe(6);
    });

    it('should throw error if unique code cannot be generated', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(true);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      await expect(useCase.execute(command)).rejects.toThrow(
        'Failed to generate unique class code'
      );
    });

    describe('subscription limits', () => {
      it('should enforce FREE tier class limit (1 class)', async () => {
        vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
        vi.mocked(mockUsageMetricsRepository.findCurrentByTeacherId).mockResolvedValue({
          currentClasses: 1,
        } as any);

        const command = new CreateClassCommand(teacherId, 'New Class');

        await expect(useCase.execute(command)).rejects.toThrow(LIMIT_ERRORS.CLASS_LIMIT.FREE);
      });

      it('should allow creating first class for FREE tier user', async () => {
        vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
        vi.mocked(mockUsageMetricsRepository.findCurrentByTeacherId).mockResolvedValue(null);

        const command = new CreateClassCommand(teacherId, 'First Class');

        const result = await useCase.execute(command);

        expect(result).toBeInstanceOf(Class);
        expect(mockClassRepository.save).toHaveBeenCalled();
      });

      it('should allow PRO tier user to create unlimited classes', async () => {
        // Create a PRO subscription using createFreeSubscription pattern but with PRO tier
        // Note: PRO tier needs stripeCustomerId, but for the limit check we can mock it
        const mockSubscription = {
          id: SubscriptionId.generate(),
          teacherId: UserId.create(teacherId),
          tier: SubscriptionTier.PRO,
          status: 'ACTIVE',
          isActive: () => true,
          isFreeTier: () => false,
          toObject: () => ({
            id: 'sub-123',
            teacherId,
            tier: 'PRO',
            billingCycle: 'MONTHLY',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: 'stripe-sub-123',
            stripeCustomerId: 'stripe-cust-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        } as any;
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(mockSubscription);
        vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
        vi.mocked(mockUsageMetricsRepository.findCurrentByTeacherId).mockResolvedValue({
          currentClasses: 5,
        } as any); // Already has 5 classes

        const command = new CreateClassCommand(teacherId, 'Sixth Class');

        const result = await useCase.execute(command);

        expect(result).toBeInstanceOf(Class);
        expect(mockClassRepository.save).toHaveBeenCalled();
      });
    });

    it('should validate class code uniqueness before saving', async () => {
      vi.mocked(mockClassRepository.existsByCode)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      await useCase.execute(command);

      expect(mockClassRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should generate 6-character codes with valid characters', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);
      vi.mocked(mockClassRepository.countByTeacherId).mockResolvedValue(0);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      const result = await useCase.execute(command);

      expect(result.code.length).toBe(6);
      expect(result.code).toMatch(/^[A-Z2-9]{6}$/);
    });
  });

  describe('generateClassCode', () => {
    it('should generate 6-character random codes', () => {
      const useCase = new CreateClassUseCase(
        mockClassRepository,
        mockSubscriptionRepository,
        mockUsageMetricsRepository,
        subscriptionEnforcementService
      );
      const code = (useCase as any).generateClassCode();

      expect(code.length).toBe(6);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('should not use confusing characters', () => {
      const useCase = new CreateClassUseCase(
        mockClassRepository,
        mockSubscriptionRepository,
        mockUsageMetricsRepository,
        subscriptionEnforcementService
      );
      const code = (useCase as any).generateClassCode();

      // Should not contain O, 0, I, 1
      expect(code).not.toMatch(/[O0I1]/);
    });

    it('should generate different codes on each call', () => {
      const useCase = new CreateClassUseCase(
        mockClassRepository,
        mockSubscriptionRepository,
        mockUsageMetricsRepository,
        subscriptionEnforcementService
      );
      const codes = new Set([
        (useCase as any).generateClassCode(),
        (useCase as any).generateClassCode(),
        (useCase as any).generateClassCode(),
      ]);

      // With high probability, all 3 should be different
      expect(codes.size).toBe(3);
    });
  });
});
