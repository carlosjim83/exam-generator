/**
 * Student Routes
 * API endpoints for student exam management
 */

import { FastifyInstance } from 'fastify';
import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { authorizeRoles } from '@middleware/role.middleware.js';

export async function studentRoutes(fastify: FastifyInstance) {
  // POST /students/assignments - Assign exam to student (teacher only)
  fastify.post(
    '/students/assignments',
    {
      preHandler: [authenticateUser, authorizeRoles(['TEACHER'])],
      schema: {
        tags: ['students'],
        summary: 'Assign exam to student (teacher only)',
        description: 'Teachers can assign exams to students with optional due dates',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            examId: {
              type: 'string',
              description: 'ID of the exam to assign',
            },
            studentId: {
              type: 'string',
              description: 'ID of the student to assign the exam to',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Optional due date for the exam',
            },
          },
          required: ['examId', 'studentId'],
        },
        response: {
          201: {
            description: 'Assignment created successfully',
            type: 'object',
            properties: {
              assignment: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  examId: { type: 'string' },
                  studentId: { type: 'string' },
                  status: { type: 'string' },
                  dueDate: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
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
            description: 'Exam or student not found',
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
          examId: string;
          studentId: string;
          dueDate?: string;
        };

        const result = await container.assignExamToStudentUseCase.execute({
          teacherId: (request as any).user.userId,
          examId: body.examId,
          studentId: body.studentId,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        });

        return reply.status(201).send({ assignment: result });
      } catch (error: any) {
        fastify.log.error('Assign exam error:', error);

        if (error.message.includes('Exam not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Exam not found',
          });
        }

        if (error.message.includes('Student not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Student not found',
          });
        }

        if (error.message.includes('not own') || error.message.includes('Unauthorized')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this exam',
          });
        }

        if (error.message.includes('already assigned') || error.message.includes('duplicate')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to assign exam',
        });
      }
    }
  );

  // GET /students/assignments - Get assigned exams (student only)
  fastify.get(
    '/students/assignments',
    {
      preHandler: [authenticateUser, authorizeRoles(['STUDENT'])],
      schema: {
        tags: ['students'],
        summary: 'Get assigned exams (student only)',
        description: 'Students can view all exams assigned to them',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'],
              description: 'Filter assignments by status',
            },
          },
        },
        response: {
          200: {
            description: 'List of assigned exams',
            type: 'object',
            properties: {
              assignments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    examId: { type: 'string' },
                    status: { type: 'string' },
                    dueDate: { type: 'string' },
                    startedAt: { type: 'string' },
                    submittedAt: { type: 'string' },
                    score: { type: 'number' },
                    createdAt: { type: 'string' },
                  },
                },
              },
              total: { type: 'integer' },
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
        const query = request.query as { status?: string };

        const result = await container.getAssignedExamsUseCase.execute({
          studentId: (request as any).user.userId,
          status: query.status as any,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Get assigned exams error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get assigned exams',
        });
      }
    }
  );

  // POST /students/assignments/:id/start - Start exam (student only)
  fastify.post(
    '/students/assignments/:id/start',
    {
      preHandler: [authenticateUser, authorizeRoles(['STUDENT'])],
      schema: {
        tags: ['students'],
        summary: 'Start exam (student only)',
        description: 'Students can start a pending exam assignment',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Assignment ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Exam started successfully',
            type: 'object',
            properties: {
              assignment: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  startedAt: { type: 'string' },
                },
              },
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
            description: 'Assignment not found',
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

        const result = await container.startExamUseCase.execute({
          assignmentId: id,
          studentId: (request as any).user.userId,
        });

        return reply.status(200).send({ assignment: result });
      } catch (error: any) {
        fastify.log.error('Start exam error:', error);

        if (error.message.includes('Assignment not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Assignment not found',
          });
        }

        if (
          error.message.includes('only view your own') ||
          error.message.includes('only start your own') ||
          error.message.includes('belong to')
        ) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (error.message.includes('status') || error.message.includes('already')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to start exam',
        });
      }
    }
  );

  // POST /students/assignments/:id/submit - Submit exam answers (student only)
  fastify.post(
    '/students/assignments/:id/submit',
    {
      preHandler: [authenticateUser, authorizeRoles(['STUDENT'])],
      schema: {
        tags: ['students'],
        summary: 'Submit exam answers (student only)',
        description: 'Students can submit answers for an in-progress exam',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Assignment ID' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  answerText: { type: 'string' },
                },
                required: ['questionId', 'answerText'],
              },
              description: 'Array of answers',
            },
          },
          required: ['answers'],
        },
        response: {
          200: {
            description: 'Exam submitted successfully',
            type: 'object',
            properties: {
              assignment: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  submittedAt: { type: 'string' },
                  score: { type: 'number' },
                },
              },
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
            description: 'Assignment not found',
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
        const body = request.body as {
          answers: Array<{ questionId: string; answerText: string }>;
        };

        const result = await container.submitExamAnswersUseCase.execute({
          assignmentId: id,
          studentId: (request as any).user.userId,
          answers: body.answers,
        });

        return reply.status(200).send({ assignment: result });
      } catch (error: any) {
        fastify.log.error('Submit exam error:', error);

        if (error.message.includes('Assignment not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Assignment not found',
          });
        }

        if (error.message.includes('only view your own') || error.message.includes('belong to')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (
          error.message.includes('status') ||
          error.message.includes('not in progress') ||
          error.message.includes('question')
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
          message: error.message || 'Failed to submit exam',
        });
      }
    }
  );

  // GET /students/assignments/:id/results - Get exam results (student only)
  fastify.get(
    '/students/assignments/:id/results',
    {
      preHandler: [authenticateUser, authorizeRoles(['STUDENT'])],
      schema: {
        tags: ['students'],
        summary: 'Get exam results (student only)',
        description: 'Students can view results for graded exams',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Assignment ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Exam results',
            type: 'object',
            properties: {
              assignment: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  score: { type: 'number' },
                  submittedAt: { type: 'string' },
                },
              },
              exam: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                },
              },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'object' },
                    studentAnswer: { type: 'object' },
                    isCorrect: { type: 'boolean' },
                    correctAnswer: { type: 'string' },
                    explanation: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Exam not graded yet',
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
            description: 'Assignment not found',
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

        const result = await container.getExamResultsUseCase.execute({
          assignmentId: id,
          studentId: (request as any).user.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Get exam results error:', error);

        if (error.message.includes('Assignment not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Assignment not found',
          });
        }

        if (error.message.includes('only view your own') || error.message.includes('belong to')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (error.message.includes('not been graded')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message || 'Failed to get exam results',
        });
      }
    }
  );
}
