import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import { authenticateUser } from '@middleware/auth.middleware.js';
import { PrismaSubscriptionRepository } from '@infrastructure/persistence/PrismaSubscriptionRepository.js';
import { CheckSubscriptionLimits } from '@application/use-cases/subscriptions/CheckSubscriptionLimits.js';
import { RecordExamUsage } from '@application/use-cases/subscriptions/RecordExamUsage.js';
import { GetSubscription } from '@application/use-cases/subscriptions/GetSubscription.js';
import { SubscriptionLimit } from '@domain/value-objects/SubscriptionLimit.js';

const prisma = new PrismaClient();
const subscriptionRepo = PrismaSubscriptionRepository.create(prisma);
const checkLimitsUseCase = new CheckSubscriptionLimits(subscriptionRepo);
const recordUsageUseCase = new RecordExamUsage(subscriptionRepo);
const getSubscriptionUseCase = new GetSubscription(subscriptionRepo);

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // GET /api/subscription - Get current subscription and usage
  fastify.get(
    '/api/subscription',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['subscription'],
        summary: 'Get subscription and usage',
        description: 'Get current subscription plan and usage statistics',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Subscription and usage info',
            type: 'object',
            properties: {
              subscription: {
                type: ['object', 'null'],
                properties: {
                  plan: { type: 'string' },
                  status: { type: 'string' },
                  isActive: { type: 'boolean' },
                  limits: {
                    type: 'object',
                    properties: {
                      examsPerMonth: { type: ['number', 'null'] },
                      maxStudents: { type: ['number', 'null'] },
                      maxActiveClasses: { type: ['number', 'null'] },
                      maxTeachers: { type: ['number', 'null'] },
                      hasAdvancedAnalytics: { type: 'boolean' },
                      hasPrioritySupport: { type: 'boolean' },
                      hasSSO: { type: 'boolean' },
                      hasCustomAI: { type: 'boolean' },
                      hasSLA: { type: 'boolean' },
                      supportType: { type: 'string' },
                    },
                  },
                  currentPeriod: {
                    type: ['object', 'null'],
                    properties: {
                      start: { type: 'string' },
                      end: { type: 'string' },
                    },
                  },
                  billing: {
                    type: 'object',
                    properties: {
                      cycle: { type: 'string' },
                      cancelAtPeriodEnd: { type: 'boolean' },
                      cancelledAt: { type: ['string', 'null'] },
                    },
                  },
                },
              },
              usage: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  examsCreated: { type: 'number' },
                  remaining: { type: ['number', 'null'] },
                  isUnlimited: { type: 'boolean' },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
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
        const userId = (request as any).user.userId;
        const result = await getSubscriptionUseCase.execute(userId);
        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Get subscription error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get subscription',
        });
      }
    }
  );

  // GET /api/subscription/limits - Check if user can create exam
  fastify.get(
    '/api/subscription/limits',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['subscription'],
        summary: 'Check subscription limits',
        description: 'Check if user can create a new exam based on their subscription limits',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Subscription limits check',
            type: 'object',
            properties: {
              canCreateExam: { type: 'boolean' },
              currentUsage: { type: 'number' },
              limit: { type: ['number', 'null'] },
              remaining: { type: ['number', 'null'] },
              isUnlimited: { type: 'boolean' },
              planName: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
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
        const userId = (request as any).user.userId;
        const result = await checkLimitsUseCase.execute(userId);
        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Check limits error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to check limits',
        });
      }
    }
  );

  // POST /api/subscription/usage/exam - Record exam creation
  fastify.post(
    '/api/subscription/usage/exam',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['subscription'],
        summary: 'Record exam usage',
        description: 'Record that an exam was created and check if more can be created',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Usage recorded',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              newCount: { type: 'number' },
              canCreateMore: { type: 'boolean' },
              remaining: { type: ['number', 'null'] },
            },
          },
          403: {
            description: 'Limit exceeded',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
              remaining: { type: ['number', 'null'] },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
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
        const userId = (request as any).user.userId;
        const result = await recordUsageUseCase.execute(userId);
        
        if (!result.success) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Limit Exceeded',
            message: 'You have reached your monthly exam limit. Please upgrade your plan to create more exams.',
            remaining: result.remaining,
          });
        }
        
        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Record usage error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to record usage',
        });
      }
    }
  );

  // GET /api/subscription/plans - Get available plans
  fastify.get(
    '/api/subscription/plans',
    {
      schema: {
        tags: ['subscription'],
        summary: 'Get available subscription plans',
        description: 'Get list of available subscription plans with their pricing and limits',
        response: {
          200: {
            description: 'Available plans',
            type: 'object',
            properties: {
              plans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: ['number', 'null'] },
                    billingCycle: { type: 'string' },
                    limits: {
                      type: 'object',
                      properties: {
                        examsPerMonth: { type: ['number', 'null'] },
                        maxStudents: { type: ['number', 'null'] },
                        maxActiveClasses: { type: ['number', 'null'] },
                        maxTeachers: { type: ['number', 'null'] },
                        hasAdvancedAnalytics: { type: 'boolean' },
                        hasPrioritySupport: { type: 'boolean' },
                        hasSSO: { type: 'boolean' },
                        hasCustomAI: { type: 'boolean' },
                        hasSLA: { type: 'boolean' },
                        supportType: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
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
        const plans = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'].map((plan) => ({
          id: plan.toLowerCase(),
          name: SubscriptionLimit.getPlanName(plan as any),
          description: getPlanDescription(plan as any),
          price: SubscriptionLimit.getPlanPrice(plan as any),
          billingCycle: plan === 'FREE' ? null : 'monthly',
          limits: SubscriptionLimit.getLimits(plan as any),
        }));

        return reply.status(200).send({ plans });
      } catch (error: any) {
        fastify.log.error('Get plans error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get plans',
        });
      }
    }
  );
}

function getPlanDescription(plan: string): string {
  switch (plan) {
    case 'FREE':
      return 'Perfect for getting started. Includes basic features for individual teachers.';
    case 'PRO':
      return 'For teachers who need more. Unlimited exams and advanced features.';
    case 'TEAM':
      return 'For schools and departments. Multiple teachers and enhanced collaboration.';
    case 'ENTERPRISE':
      return 'For large institutions. Custom solutions with dedicated support.';
    default:
      return '';
  }
}