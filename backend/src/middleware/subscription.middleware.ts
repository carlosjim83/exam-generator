/**
 * Subscription Limit Middleware
 *
 * Middleware to enforce subscription limits on protected routes.
 * Must be used after authenticateUser middleware.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { container } from '@config/container.js';
import { CheckSubscriptionLimitUseCase } from '@application/use-cases/subscription/CheckSubscriptionLimitUseCase.js';
import { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import { UserId } from '@domain/value-objects/UserId.js';

type LimitType = 'CLASSES' | 'STUDENTS' | 'EXAMS' | 'QUESTIONS';

const checkLimitUseCase = new CheckSubscriptionLimitUseCase();

/**
 * Middleware factory to check subscription limits
 * @param limitType - The type of limit to check
 * @returns Middleware function
 */
export function checkSubscriptionLimit(limitType: LimitType) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Get user's subscription
      const subscription = await container.subscriptionRepository.findByTeacherId(
        UserId.create(userId)
      );

      if (!subscription) {
        return reply.status(403).send({ error: 'No subscription found' });
      }

      // Get subscription limits based on tier
      const limits = SubscriptionLimits.getForTier(subscription.tier);

      // Get current usage metrics
      const metrics = await container.usageMetricsRepository.findCurrentByTeacherId(
        UserId.create(userId)
      );

      if (!metrics) {
        return reply.status(403).send({ error: 'No usage metrics found' });
      }

      let result;

      switch (limitType) {
        case 'CLASSES':
          result = checkLimitUseCase.checkClassLimit(limits, metrics);
          break;
        case 'STUDENTS':
          result = checkLimitUseCase.checkStudentLimit(limits, metrics);
          break;
        case 'EXAMS':
          result = checkLimitUseCase.checkExamLimit(limits, metrics);
          break;
        case 'QUESTIONS':
          // For questions, we need the current question count from the request
          // This is handled separately in the exam generation use case
          return; // Skip middleware for questions
        default:
          return reply.status(500).send({ error: 'Unknown limit type' });
      }

      if (!result.allowed) {
        return reply.status(429).send({
          error: 'Subscription limit reached',
          code: `${limitType}_LIMIT_REACHED`,
          message: result.message,
          limit: result.limit,
          remaining: result.remaining,
        });
      }
    } catch (error) {
      request.log.error({ err: error }, 'Error checking subscription limit');
      return reply.status(500).send({ error: 'Failed to check subscription limits' });
    }
  };
}

/**
 * Middleware to check if user has an active subscription
 */
export async function requireActiveSubscription(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user?.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const subscription = await container.subscriptionRepository.findByTeacherId(
      UserId.create(userId)
    );

    if (!subscription) {
      return reply.status(403).send({ error: 'No subscription found' });
    }

    if (!subscription.isActive()) {
      return reply.status(403).send({
        error: 'Subscription inactive',
        message: subscription.isPastDue()
          ? 'Your subscription is past due. Please update your payment method.'
          : 'Your subscription is not active.',
      });
    }
  } catch (error) {
    request.log.error({ err: error }, 'Error checking subscription status');
    return reply.status(500).send({ error: 'Failed to check subscription status' });
  }
}
