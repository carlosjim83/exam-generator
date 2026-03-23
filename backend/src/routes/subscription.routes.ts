/**
 * Subscription Routes
 * API endpoints for subscription management and pricing
 */

import type { FastifyInstance } from 'fastify';
import { GetSubscriptionUseCase } from '@application/use-cases/subscription/index.js';
import { SubscriptionRepository } from '@infrastructure/persistence/repositories/SubscriptionRepository.js';
import { UsageMetricsRepository } from '@infrastructure/persistence/repositories/UsageMetricsRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  const subscriptionRepo = new SubscriptionRepository();
  const usageMetricsRepo = new UsageMetricsRepository();
  const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepo, usageMetricsRepo);

  // GET /api/subscription/current - Get current subscription with limits and usage
  fastify.get(
    '/api/subscription/current',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['subscription'],
        summary: 'Get current subscription',
        description: 'Returns current subscription status, limits, and usage metrics',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              tier: {
                type: 'string',
                enum: ['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'],
              },
              status: {
                type: 'string',
                enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
              },
              currentPeriodEnd: { type: 'string', format: 'date-time' },
              limits: { type: 'object' },
              usage: { type: 'object' },
              limitsReached: {
                type: 'object',
                properties: {
                  students: { type: 'boolean' },
                  classes: { type: 'boolean' },
                  exams: { type: 'boolean' },
                },
              },
              upgradeNeeded: { type: 'boolean' },
            },
          },
          500: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = (request as { user: { userId: string } }).user.userId;

        const result = await getSubscriptionUseCase.execute(UserId.create(userId));

        return reply.send({
          tier: result.subscription.tier,
          status: result.subscription.status,
          currentPeriodEnd: result.subscription.currentPeriodEnd.toISOString(),
          limits: result.limits.toObject(),
          usage: result.usage.toObject(),
          limitsReached: result.limitsReached,
          upgradeNeeded: result.upgradeNeeded,
        });
      } catch (error: { message?: string }) {
        fastify.log.error('Get subscription error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get subscription',
        });
      }
    }
  );

  // GET /api/subscription/plans - Get all available subscription plans
  fastify.get(
    '/api/subscription/plans',
    {
      schema: {
        tags: ['subscription'],
        summary: 'Get subscription plans',
        description: 'Returns all available subscription plans and their features',
        querystring: {
          type: 'object',
          properties: {
            billingCycle: {
              type: 'string',
              enum: ['monthly', 'yearly'],
              default: 'monthly',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              plans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tier: { type: 'string' },
                    price: { type: 'number' },
                    priceYearly: { type: 'number' },
                    currency: { type: 'string' },
                    features: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // For now, just return Free and Pro plans
      // Pro Plus and Enterprise will be added later
      return reply.send({
        plans: [
          {
            tier: 'FREE',
            price: 0,
            currency: 'USD',
            features: [
              '1 active class',
              '30 students maximum',
              '10 exams per month',
              '50 questions per exam',
              'Basic analytics',
              'Email support',
              'Standard AI (GPT-4o mini)',
            ],
          },
          {
            tier: 'PRO',
            price: 9,
            priceYearly: 90,
            currency: 'USD',
            features: [
              'Unlimited classes',
              'Unlimited students',
              'Unlimited exams',
              'Unlimited questions per exam',
              'Advanced analytics',
              'Priority support (24-48hr)',
              'Remove Formydable branding',
              'Advanced AI (GPT-4o)',
              'Export results (CSV, Excel, PDF)',
              'Exam templates',
            ],
          },
        ],
      });
    }
  );
}
