/**
 * Subscription Routes
 * API endpoints for subscription management and pricing
 */

import type { FastifyInstance } from 'fastify';
import { container } from '@config/container.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  const getSubscriptionUseCase = container.getSubscriptionUseCase;

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
              limits: {
                type: 'object',
                additionalProperties: true,
              },
              usage: {
                type: 'object',
                additionalProperties: true,
              },
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
        const userId = (request as unknown as { user: { userId: string } }).user.userId;

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
      } catch (error: unknown) {
        const message = 'Failed to get subscription';
        fastify.log.error(error, 'Get subscription error');

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message,
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
                    limits: {
                      type: 'object',
                      properties: {
                        maxClasses: { type: ['number', 'null'] },
                        maxStudents: { type: ['number', 'null'] },
                        maxExamsPerMonth: { type: ['number', 'null'] },
                        maxQuestionsPerExam: { type: ['number', 'null'] },
                        aiModel: { type: 'string' },
                        analyticsLevel: { type: 'string' },
                        supportLevel: { type: 'string' },
                      },
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
            priceYearly: 0,
            currency: 'USD',
            limits: {
              maxClasses: 1,
              maxStudents: 30,
              maxExamsPerMonth: 10,
              maxQuestionsPerExam: 50,
              aiModel: 'GPT_4O_MINI',
              analyticsLevel: 'BASIC',
              supportLevel: 'EMAIL',
            },
          },
          {
            tier: 'PRO',
            price: 9,
            priceYearly: 90,
            currency: 'USD',
            limits: {
              maxClasses: null,
              maxStudents: null,
              maxExamsPerMonth: null,
              maxQuestionsPerExam: null,
              aiModel: 'GPT_4O',
              analyticsLevel: 'ADVANCED',
              supportLevel: 'PRIORITY',
            },
          },
        ],
      });
    }
  );
}
