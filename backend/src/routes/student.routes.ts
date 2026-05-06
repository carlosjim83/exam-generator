/**
 * Student Routes
 * API endpoints for student exam management
 */

import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { authorizeRoles } from '@middleware/role.middleware.js';
import {
  BadRequestResponseSchema,
  ErrorResponseSchema,
  ForbiddenResponseSchema,
  NotFoundResponseSchema,
} from '@schemas/common.js';
import {
  AssignedExamsResponseSchema,
  CreateAssignmentResponseSchema,
  ExamResultsResponseSchema,
  SaveAnswerResponseSchema,
  StartExamResponseSchema,
  SubmitExamResponseSchema,
} from '@schemas/student.js';

function serializeAssignment(assignment: ExamAssignment) {
  return {
    id: assignment.id.value,
    examId: assignment.examId,
    studentId: assignment.studentId.value,
    teacherId: assignment.teacherId.value,
    status: assignment.status,
    dueDate: assignment.dueDate?.toISOString() || null,
    startedAt: assignment.startedAt?.toISOString() || null,
    submittedAt: assignment.submittedAt?.toISOString() || null,
    score: assignment.score,
    feedback: assignment.feedback,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

export async function studentRoutes(fastify: FastifyInstance) {
  // POST /api/students/assignments - Assign exam to student (teacher only)
  fastify.post(
    '/api/students/assignments',
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
          201: CreateAssignmentResponseSchema,
          400: BadRequestResponseSchema,
          403: ForbiddenResponseSchema,
          404: NotFoundResponseSchema,
          500: ErrorResponseSchema,
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
          teacherId: request.user!.userId,
          examId: body.examId,
          studentId: body.studentId,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        });

        return reply.status(201).send({ assignment: serializeAssignment(result) });
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
          message: 'Failed to assign exam',
        });
      }
    }
  );

  // GET /api/students/assignments - Get assigned exams (student only)
  fastify.get(
    '/api/students/assignments',
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
          200: AssignedExamsResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as { status?: string };

        const result = await container.getAssignedExamsUseCase.execute({
          studentId: request.user!.userId,
          status: query.status as any,
        });

        // Convert to plain objects for serialization
        const assignments = result.assignments.map((item) => ({
          id: item.assignment.id.value,
          examId: item.examId,
          examTitle: item.examTitle,
          examDescription: item.examDescription,
          status: item.assignment.status,
          questionCount: item.questionCount,
          maxScore: item.maxScore,
          score: item.assignment.score,
          startedAt: item.assignment.startedAt?.toISOString() || null,
          submittedAt: item.assignment.submittedAt?.toISOString() || null,
          createdAt: item.assignment.createdAt.toISOString(),
        }));

        return reply.status(200).send({
          assignments,
          total: result.total,
        });
      } catch (error: any) {
        fastify.log.error('Get assigned exams error:', error);

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get assigned exams',
        });
      }
    }
  );

  // POST /api/students/assignments/:id/start - Start exam (student only)
  fastify.post(
    '/api/students/assignments/:id/start',
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
          200: StartExamResponseSchema,
          400: BadRequestResponseSchema,
          403: ForbiddenResponseSchema,
          404: NotFoundResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await container.startExamUseCase.execute({
          assignmentId: id,
          studentId: request.user!.userId,
        });

        // Serialize entities for JSON response
        return reply.status(200).send({
          assignment: serializeAssignment(result.assignment),
          exam: result.exam,
        });
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
          error.message.includes('only access your own') ||
          error.message.includes('only start your own') ||
          error.message.includes('belong to')
        ) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (error.message.includes('already been completed')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
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
          message: 'Failed to start exam',
        });
      }
    }
  );

  // POST /api/students/assignments/:id/submit - Submit exam answers (student only)
  fastify.post(
    '/api/students/assignments/:id/submit',
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
          200: SubmitExamResponseSchema,
          400: BadRequestResponseSchema,
          403: ForbiddenResponseSchema,
          404: NotFoundResponseSchema,
          500: ErrorResponseSchema,
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
          studentId: request.user!.userId,
          answers: body.answers,
        });

        return reply.status(200).send({ assignment: serializeAssignment(result) });
      } catch (error: any) {
        fastify.log.error('Submit exam error:', error);

        if (error.message.includes('Assignment not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Assignment not found',
          });
        }

        if (error.message.includes('does not belong')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (error.message.includes('Cannot submit')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to submit exam',
        });
      }
    }
  );

  // POST /api/students/assignments/:id/answers - Save a single answer (student only)
  fastify.post(
    '/api/students/assignments/:id/answers',
    {
      preHandler: [authenticateUser, authorizeRoles(['STUDENT'])],
      schema: {
        tags: ['students'],
        summary: 'Save answer for a question (student only)',
        description: 'Students can save answers as they progress without submitting',
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
            questionId: { type: 'string', description: 'Question ID' },
            answerText: { type: 'string', description: 'Answer text' },
          },
          required: ['questionId', 'answerText'],
        },
        response: {
          200: SaveAnswerResponseSchema,
          400: BadRequestResponseSchema,
          403: ForbiddenResponseSchema,
          404: NotFoundResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          questionId: string;
          answerText: string;
        };

        const result = await container.saveAnswerUseCase.execute({
          assignmentId: id,
          questionId: body.questionId,
          answerText: body.answerText,
          studentId: request.user!.userId,
        });

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error('Save answer error:', error);

        if (error.message.includes('Assignment not found')) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Assignment not found',
          });
        }

        if (error.message.includes('does not belong')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You do not have access to this assignment',
          });
        }

        if (error.message.includes('must be in progress')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Exam must be started before saving answers',
          });
        }

        if (error.message.includes('does not belong to this exam')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid question for this exam',
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to save answer',
        });
      }
    }
  );

  // GET /api/students/assignments/:id/results - Get exam results (student only)
  fastify.get(
    '/api/students/assignments/:id/results',
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
          200: ExamResultsResponseSchema,
          400: BadRequestResponseSchema,
          403: ForbiddenResponseSchema,
          404: NotFoundResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await container.getExamResultsUseCase.execute({
          assignmentId: id,
          studentId: request.user!.userId,
        });

        // Transform the use case result to match frontend expectations
        // Map QuestionResult[] to StudentAnswer[] format
        const answers = result.results.map((r) => ({
          id: r.studentAnswer?.id || `${r.question.id}-answer`,
          questionId: r.question.id,
          answer: r.studentAnswer?.answerText || '',
          isCorrect: r.isCorrect,
          createdAt: r.studentAnswer?.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: r.studentAnswer?.updatedAt?.toISOString() || new Date().toISOString(),
        }));

        // Map questions for frontend
        const mappedQuestions =
          result.exam.questions?.map((q) => ({
            id: q.id,
            text: q.questionText,
            order: q.orderIndex,
            type: q.type,
            options: q.options,
          })) || [];

        // Score and percentage are calculated by the use case
        const { score, maxScore, percentage } = result;

        return reply.status(200).send({
          assignment: serializeAssignment(result.assignment),
          exam: {
            id: result.exam.id,
            title: result.exam.title,
            description: result.exam.description || null,
            documentId: result.exam.generatedFrom[0] || '',
            createdBy: result.exam.userId,
            createdAt: result.exam.createdAt.toISOString(),
            questions: mappedQuestions,
          },
          answers,
          score,
          maxScore,
          percentage,
        });
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

        if (error.message.includes('not been submitted')) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message,
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get exam results',
        });
      }
    }
  );
}
