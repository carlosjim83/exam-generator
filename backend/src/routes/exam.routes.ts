/**
 * Exam Routes
 * API endpoints for exam generation and management
 */

import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { checkSubscriptionLimit } from '@middleware/subscription.middleware.js';

export async function examRoutes(fastify: FastifyInstance) {
  // POST /api/exams/generate - Generate exam from documents
  fastify.post(
    '/api/exams/generate',
    {
      preHandler: [authenticateUser, checkSubscriptionLimit('EXAMS')],
      schema: {
        tags: ['exams'],
        summary: 'Generate exam from one or more documents using AI',
        description:
          'Generate exam questions from 1-10 documents using RAG + GPT-4o. All documents must be processed (status: COMPLETED).',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            documentIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              minItems: 1,
              maxItems: 10,
              description: 'IDs of documents to generate exam from (1-10 documents)',
            },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Title of the exam',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Optional description of the exam',
            },
            numQuestions: {
              type: 'integer',
              minimum: 5,
              maximum: 50,
              default: 10,
              description: 'Number of questions to generate (5-50)',
            },
            difficulty: {
              type: 'string',
              enum: ['EASY', 'MEDIUM', 'HARD', 'MIXED'],
              default: 'MIXED',
              description: 'Difficulty level of questions',
            },
            questionTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'],
              },
              minItems: 1,
              default: ['MULTIPLE_CHOICE'],
              description: 'Types of questions to generate',
            },
          },
          required: ['documentIds', 'title'],
        },
        response: {
          200: {
            description: 'Exam generated successfully',
            type: 'object',
            properties: {
              exam: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  questionCount: { type: 'integer' },
                  documentCount: { type: 'integer' },
                  createdAt: { type: 'string' },
                },
              },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    difficulty: { type: 'string' },
                    questionText: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctAnswer: { type: 'string' },
                    explanation: { type: 'string' },
                    points: { type: 'integer' },
                  },
                },
              },
              generationTimeMs: { type: 'integer' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
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
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Document not found',
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
        const body = request.body as {
          documentIds: string[];
          title: string;
          description?: string;
          numQuestions?: number;
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
          questionTypes?: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[];
        };

        const result = await container.generateExamUseCase.execute({
          userId: request.user!.userId,
          documentIds: body.documentIds,
          title: body.title,
          description: body.description,
          numQuestions: body.numQuestions || 10,
          difficulty: body.difficulty || 'MIXED',
          questionTypes: body.questionTypes || ['MULTIPLE_CHOICE'],
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Exam generation error:', error);

        if (error.message === 'Document not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Document not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this document',
          });
        }

        if (error.message.includes('not ready') || error.message.includes('Status:')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        if (
          error.message.includes('title') ||
          error.message.includes('questions') ||
          error.message.includes('difficulty') ||
          error.message.includes('question type')
        ) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Exam generation failed',
        });
      }
    }
  );

  // GET /api/exams - List all exams
  fastify.get(
    '/api/exams',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['exams'],
        summary: 'List all exams',
        description: 'Get all exams created by the authenticated user',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'List of exams',
            type: 'object',
            properties: {
              exams: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    questionCount: { type: 'integer' },
                    documentCount: { type: 'integer' },
                    createdAt: { type: 'string' },
                  },
                },
              },
              total: { type: 'integer' },
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
        const result = await container.listExamsUseCase.execute({
          userId: request.user!.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('List exams error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to list exams',
        });
      }
    }
  );

  // GET /api/exams/:id - Get exam details
  fastify.get(
    '/api/exams/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['exams'],
        summary: 'Get exam details',
        description: 'Get a specific exam with all its questions',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Exam ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Exam details',
            type: 'object',
            properties: {
              exam: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  questionCount: { type: 'integer' },
                  documentCount: { type: 'integer' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    difficulty: { type: 'string' },
                    questionText: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctAnswer: { type: 'string' },
                    explanation: { type: 'string' },
                    points: { type: 'integer' },
                    orderIndex: { type: 'integer' },
                  },
                },
              },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Exam not found',
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
        const { id } = request.params as { id: string };

        const result = await container.getExamUseCase.execute({
          examId: id,
          userId: request.user!.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Get exam error:', error);

        if (error.message === 'Exam not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Exam not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this exam',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get exam',
        });
      }
    }
  );

  // DELETE /api/exams/:id - Delete exam
  fastify.delete(
    '/api/exams/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['exams'],
        summary: 'Delete exam',
        description: 'Delete a specific exam and all its questions',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Exam ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Exam deleted successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Exam not found',
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
        const { id } = request.params as { id: string };

        const result = await container.deleteExamUseCase.execute({
          examId: id,
          userId: request.user!.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Delete exam error:', error);

        if (error.message === 'Exam not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Exam not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this exam',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to delete exam',
        });
      }
    }
  );
}
