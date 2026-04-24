/**
 * Class Exam Routes
 * API endpoints for managing exam assignments to classes
 */

import type { FastifyInstance } from 'fastify';

import type { GetClassExamsInput } from '@application/use-cases/classes/GetClassExamsUseCase.js';
import type { GetStudentExamsInput } from '@application/use-cases/classes/GetStudentExamsUseCase.js';
import type { GetStudentClassExamsInput } from '@application/use-cases/classes/GetStudentClassExamsUseCase.js';
import type { PublishClassExamInput } from '@application/use-cases/classes/PublishClassExamUseCase.js';
import type { UpdateClassExamSettingsInput } from '@application/use-cases/classes/UpdateClassExamSettingsUseCase.js';
import type { GetStudentSubmissionDetailInput } from '@application/use-cases/classes/GetStudentSubmissionDetailUseCase.js';
import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

export async function classExamRoutes(fastify: FastifyInstance) {
  // POST /api/classes/:classId/exams - Assign exam to class
  fastify.post(
    '/api/classes/:classId/exams',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Assign exam to class',
        description: 'Assign an existing exam to a class with availability settings',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['classId'],
        },
        body: {
          type: 'object',
          required: ['examId'],
          properties: {
            examId: { type: 'string', format: 'uuid' },
            availableAt: { type: 'string', format: 'date-time', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            timeLimit: {
              type: 'number',
              nullable: true,
              description: 'Minutes (null = unlimited)',
            },
            maxAttempts: { type: 'number', default: 1 },
            showResultsImmediately: { type: 'boolean', default: false },
            excludeStudentIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              description: 'Student IDs to exclude from assignment',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              classExamId: { type: 'string', format: 'uuid' },
              classId: { type: 'string', format: 'uuid' },
              examId: { type: 'string', format: 'uuid' },
              assignedStudents: { type: 'number' },
              alreadyAssigned: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId } = request.params as { classId: string };
      const body = request.body as {
        examId: string;
        availableAt?: string;
        dueDate?: string;
        timeLimit?: number;
        maxAttempts?: number;
        showResultsImmediately?: boolean;
        excludeStudentIds?: string[];
      };

      const input = {
        classId,
        examId: body.examId,
        teacherId: userId,
        availableAt: body.availableAt ? new Date(body.availableAt) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        timeLimit: body.timeLimit ?? null,
        maxAttempts: body.maxAttempts ?? 1,
        showResultsImmediately: body.showResultsImmediately ?? false,
        excludeStudentIds: body.excludeStudentIds,
      };

      const result = await container.assignExamToClassUseCase.execute(input);

      reply.status(201).send({
        classExamId: result.classExamId,
        classId: result.classId,
        examId: result.examId,
        assignedStudents: result.assignedStudents,
        alreadyAssigned: result.alreadyAssigned,
      });
    }
  );

  // GET /api/classes/:classId/exams - Get exams for class (teacher view)
  fastify.get(
    '/api/classes/:classId/exams',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Get exams for class',
        description: 'Get all exams assigned to a class with statistics (teacher view)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['classId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              exams: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    classId: { type: 'string', format: 'uuid' },
                    examId: { type: 'string', format: 'uuid' },
                    examTitle: { type: 'string' },
                    questionCount: { type: 'number' },
                    availableAt: { type: 'string', format: 'date-time', nullable: true },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                    timeLimit: { type: 'number', nullable: true },
                    isPublished: { type: 'boolean' },
                    maxAttempts: { type: 'number' },
                    showResultsImmediately: { type: 'boolean' },
                    startedCount: { type: 'number' },
                    submittedCount: { type: 'number' },
                    gradedCount: { type: 'number' },
                    assignedCount: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId } = request.params as { classId: string };

      const input: GetClassExamsInput = {
        classId,
        teacherId: userId,
      };

      const result = await container.getClassExamsUseCase.execute(input);

      reply.status(200).send({
        exams: result.exams.map((exam) => ({
          id: exam.id,
          classId: exam.classId,
          examId: exam.examId,
          examTitle: exam.examTitle,
          questionCount: exam.questionCount,
          availableAt: exam.availableAt?.toISOString() ?? null,
          dueDate: exam.dueDate?.toISOString() ?? null,
          timeLimit: exam.timeLimit,
          isPublished: exam.isPublished,
          maxAttempts: exam.maxAttempts,
          showResultsImmediately: exam.showResultsImmediately,
          startedCount: exam.startedCount,
          submittedCount: exam.submittedCount,
          gradedCount: exam.gradedCount,
          assignedCount: exam.assignedCount,
          createdAt: exam.createdAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/classes/:classId/exams/available - Get available exams for student (student view)
  fastify.get(
    '/api/classes/:classId/exams/available',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Get available exams for a class',
        description:
          'Get all published exams available to the current student for a specific class',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['classId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              exams: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    classId: { type: 'string', format: 'uuid' },
                    examId: { type: 'string', format: 'uuid' },
                    examTitle: { type: 'string' },
                    questionCount: { type: 'number' },
                    availableAt: { type: 'string', format: 'date-time', nullable: true },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                    timeLimit: { type: 'number', nullable: true },
                    maxAttempts: { type: 'number' },
                    status: {
                      type: 'string',
                      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'],
                    },
                    score: { type: 'number', nullable: true },
                    attemptNumber: { type: 'number' },
                    remainingAttempts: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId } = request.params as { classId: string };

      const input: GetStudentClassExamsInput = {
        studentId: userId,
        classId,
      };

      const result = await container.getStudentClassExamsUseCase.execute(input);

      reply.status(200).send({
        exams: result.exams.map((exam) => ({
          id: exam.id,
          classId: exam.classId,
          examId: exam.examId,
          examTitle: exam.examTitle,
          questionCount: exam.questionCount,
          availableAt: exam.availableAt?.toISOString() ?? null,
          dueDate: exam.dueDate?.toISOString() ?? null,
          timeLimit: exam.timeLimit,
          maxAttempts: exam.maxAttempts,
          status: exam.status,
          score: exam.score,
          attemptNumber: exam.attemptNumber,
          remainingAttempts: exam.remainingAttempts,
        })),
      });
    }
  );

  // GET /api/student/exams - Get exams for student
  fastify.get(
    '/api/student/exams',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Get my exams',
        description:
          'Get all exams available to the current student (published and within availability)',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              exams: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    classId: { type: 'string', format: 'uuid' },
                    className: { type: 'string' },
                    examId: { type: 'string', format: 'uuid' },
                    examTitle: { type: 'string' },
                    questionCount: { type: 'number' },
                    availableAt: { type: 'string', format: 'date-time', nullable: true },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                    timeLimit: { type: 'number', nullable: true },
                    maxAttempts: { type: 'number' },
                    status: {
                      type: 'string',
                      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'],
                    },
                    score: { type: 'number', nullable: true },
                    attemptNumber: { type: 'number' },
                    remainingAttempts: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;

      const input: GetStudentExamsInput = {
        studentId: userId,
      };

      const result = await container.getStudentExamsUseCase.execute(input);

      reply.status(200).send({
        exams: result.exams.map((exam) => ({
          id: exam.id,
          classId: exam.classId,
          className: exam.className,
          examId: exam.examId,
          examTitle: exam.examTitle,
          questionCount: exam.questionCount,
          availableAt: exam.availableAt?.toISOString() ?? null,
          dueDate: exam.dueDate?.toISOString() ?? null,
          timeLimit: exam.timeLimit,
          maxAttempts: exam.maxAttempts,
          status: exam.status,
          score: exam.score,
          attemptNumber: exam.attemptNumber,
          remainingAttempts: exam.remainingAttempts,
        })),
      });
    }
  );

  // PATCH /api/classes/:classId/exams/:classExamId - Update exam settings
  fastify.patch(
    '/api/classes/:classId/exams/:classExamId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Update class exam settings',
        description: 'Update availability, time limit, and other settings for a class exam',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            classExamId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'classExamId'],
        },
        body: {
          type: 'object',
          properties: {
            availableAt: { type: 'string', format: 'date-time', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            timeLimit: { type: 'number', nullable: true },
            maxAttempts: { type: 'number' },
            showResultsImmediately: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              classId: { type: 'string', format: 'uuid' },
              examId: { type: 'string', format: 'uuid' },
              availableAt: { type: 'string', format: 'date-time', nullable: true },
              dueDate: { type: 'string', format: 'date-time', nullable: true },
              timeLimit: { type: 'number', nullable: true },
              maxAttempts: { type: 'number' },
              showResultsImmediately: { type: 'boolean' },
              isPublished: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId, classExamId } = request.params as { classId: string; classExamId: string };
      const body = request.body as Partial<{
        availableAt: string;
        dueDate: string;
        timeLimit: number;
        maxAttempts: number;
        showResultsImmediately: boolean;
      }>;

      const input: UpdateClassExamSettingsInput = {
        classExamId,
        classId,
        teacherId: userId,
        availableAt:
          body.availableAt !== undefined
            ? body.availableAt
              ? new Date(body.availableAt)
              : null
            : undefined,
        dueDate:
          body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        timeLimit: body.timeLimit,
        maxAttempts: body.maxAttempts,
        showResultsImmediately: body.showResultsImmediately,
      };

      const result = await container.updateClassExamSettingsUseCase.execute(input);

      reply.status(200).send({
        id: result.id,
        classId: result.classId,
        examId: result.examId,
        availableAt: result.availableAt?.toISOString() ?? null,
        dueDate: result.dueDate?.toISOString() ?? null,
        timeLimit: result.timeLimit,
        maxAttempts: result.maxAttempts,
        showResultsImmediately: result.showResultsImmediately,
        isPublished: result.isPublished,
      });
    }
  );

  // PATCH /api/classes/:classId/exams/:classExamId/publish - Publish/unpublish exam
  fastify.patch(
    '/api/classes/:classId/exams/:classExamId/publish',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Publish or unpublish class exam',
        description: 'Toggle visibility of a class exam to students',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            classExamId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'classExamId'],
        },
        body: {
          type: 'object',
          required: ['isPublished'],
          properties: {
            isPublished: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              classId: { type: 'string', format: 'uuid' },
              examId: { type: 'string', format: 'uuid' },
              isPublished: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId, classExamId } = request.params as { classId: string; classExamId: string };
      const { isPublished } = request.body as { isPublished: boolean };

      const input: PublishClassExamInput = {
        classExamId,
        classId,
        teacherId: userId,
        isPublished,
      };

      const result = await container.publishClassExamUseCase.execute(input);

      reply.status(200).send({
        id: result.id,
        classId: result.classId,
        examId: result.examId,
        isPublished: result.isPublished,
      });
    }
  );

  // GET /api/classes/:classId/exams/:classExamId/results - Get exam results (teacher)
  fastify.get(
    '/api/classes/:classId/exams/:classExamId/results',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Get class exam results',
        description: 'Get results for all students in a class exam (teacher view)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            classExamId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'classExamId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              examTitle: { type: 'string' },
              classExamId: { type: 'string', format: 'uuid' },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', format: 'uuid' },
                    studentName: { type: 'string' },
                    studentEmail: { type: 'string' },
                    status: { type: 'string' },
                    startedAt: { type: 'string', format: 'date-time', nullable: true },
                    submittedAt: { type: 'string', format: 'date-time', nullable: true },
                    timeTaken: { type: 'number', nullable: true },
                    score: { type: 'number', nullable: true },
                    attemptNumber: { type: 'number' },
                  },
                },
              },
              statistics: {
                type: 'object',
                properties: {
                  totalStudents: { type: 'number' },
                  startedCount: { type: 'number' },
                  submittedCount: { type: 'number' },
                  gradedCount: { type: 'number' },
                  averageScore: { type: 'number', nullable: true },
                  highestScore: { type: 'number', nullable: true },
                  lowestScore: { type: 'number', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId, classExamId } = request.params as { classId: string; classExamId: string };

      const result = await container.getClassExamResultsUseCase.execute({
        classExamId,
        classId,
        teacherId: userId,
      });

      reply.status(200).send({
        examTitle: result.examTitle,
        classExamId: result.classExamId,
        results: result.results.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          studentEmail: r.studentEmail,
          status: r.status,
          startedAt: r.startedAt?.toISOString() ?? null,
          submittedAt: r.submittedAt?.toISOString() ?? null,
          timeTaken: r.timeTaken,
          score: r.score,
          attemptNumber: r.attemptNumber,
        })),
        statistics: result.statistics,
      });
    }
  );

  // GET /api/classes/:classId/exams/:classExamId/students/:studentId - Get student submission detail
  fastify.get(
    '/api/classes/:classId/exams/:classExamId/students/:studentId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Get student submission detail',
        description: 'Get detailed submission results for a specific student (teacher view)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            classExamId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'classExamId', 'studentId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              student: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              exam: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                },
              },
              assignment: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  status: { type: 'string' },
                  startedAt: { type: 'string', format: 'date-time', nullable: true },
                  submittedAt: { type: 'string', format: 'date-time', nullable: true },
                  score: { type: 'number', nullable: true },
                },
              },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    questionId: { type: 'string', format: 'uuid' },
                    questionText: { type: 'string' },
                    questionType: {
                      type: 'string',
                      enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'],
                    },
                    options: { type: 'array', items: { type: 'string' }, nullable: true },
                    correctAnswer: { type: 'string' },
                    studentAnswer: { type: 'string' },
                    isCorrect: { type: 'boolean', nullable: true },
                    pointsEarned: { type: 'number' },
                    maxPoints: { type: 'number' },
                    feedback: { type: 'string', nullable: true },
                  },
                },
              },
              totalScore: { type: 'number' },
              maxScore: { type: 'number' },
              percentage: { type: 'number', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId, classExamId, studentId } = request.params as {
        classId: string;
        classExamId: string;
        studentId: string;
      };

      const input: GetStudentSubmissionDetailInput = {
        classExamId,
        classId,
        studentId,
        teacherId: userId,
      };

      const result = await container.getStudentSubmissionDetailUseCase.execute(input);

      reply.status(200).send({
        student: result.student,
        exam: result.exam,
        assignment: {
          ...result.assignment,
          startedAt: result.assignment.startedAt?.toISOString() ?? null,
          submittedAt: result.assignment.submittedAt?.toISOString() ?? null,
        },
        questions: result.questions,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
      });
    }
  );

  // DELETE /api/classes/:classId/exams/:classExamId - Remove exam from class
  fastify.delete(
    '/api/classes/:classId/exams/:classExamId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['class-exams'],
        summary: 'Remove exam from class',
        description: 'Remove an exam from a class (does not delete the exam itself)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            classExamId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'classExamId'],
        },
        response: {
          204: {
            description: 'Exam removed from class',
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { classId, classExamId } = request.params as { classId: string; classExamId: string };

      await container.deleteClassExamUseCase.execute({
        classExamId,
        classId,
        teacherId: userId,
      });

      reply.status(204).send();
    }
  );
}
