/**
 * Class Routes
 * API endpoints for class creation and management
 */

import type { FastifyInstance } from 'fastify';

import { CreateClassCommand } from '@application/use-cases/classes/CreateClassUseCase.js';
import { CreateEmailInvitationsCommand } from '@application/use-cases/classes/CreateEmailInvitationsUseCase.js';
import { DeleteClassCommand } from '@application/use-cases/classes/DeleteClassUseCase.js';
import { GetClassByCodeCommand } from '@application/use-cases/classes/GetClassByCodeUseCase.js';
import { GetClassDetailsCommand } from '@application/use-cases/classes/GetClassDetailsUseCase.js';
import { GetClassesCommand } from '@application/use-cases/classes/GetClassesUseCase.js';
import { GetClassInvitationsCommand } from '@application/use-cases/classes/GetClassInvitationsUseCase.js';
import { GetClassStudentsCommand } from '@application/use-cases/classes/GetClassStudentsUseCase.js';
import { GetStudentClassesCommand } from '@application/use-cases/classes/GetStudentClassesUseCase.js';
import { ImportStudentsCSVCommand } from '@application/use-cases/classes/ImportStudentsCSVUseCase.js';
import { RemoveStudentFromClassCommand } from '@application/use-cases/classes/RemoveStudentFromClassUseCase.js';
import { StudentJoinClassCommand } from '@application/use-cases/classes/StudentJoinClassUseCase.js';
import { StudentJoinClassWithInvitationCommand } from '@application/use-cases/classes/StudentJoinClassWithInvitationUseCase.js';
import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

export async function classRoutes(fastify: FastifyInstance) {
  // GET /api/classes - List all classes for authenticated teacher
  fastify.get(
    '/api/classes',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'List all classes',
        description: 'List all classes for the authenticated teacher',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1, minimum: 1 },
            limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    color: { type: 'string', nullable: true },
                    teacherId: { type: 'string', format: 'uuid' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const {
        page = 1,
        limit = 20,
        search = '',
      } = request.query as {
        page?: number;
        limit?: number;
        search?: string;
      };

      const command = new GetClassesCommand(userId, page, limit, search);
      const result = await container.getClassesUseCase.execute(command);

      reply.status(200).send({
        classes: result.classes.map((c) => ({
          id: c.id.toString(),
          name: c.name,
          code: c.code,
          description: c.description,
          color: c.color,
          teacherId: c.teacherId.toString(),
          createdAt: c.createdAt.toISOString(),
        })),
        total: result.total,
        page,
        limit,
      });
    }
  );

  // GET /api/classes/:id - Get class details by ID
  fastify.get(
    '/api/classes/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Get class details',
        description: 'Get detailed information about a class by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string', nullable: true },
              color: { type: 'string', nullable: true },
              teacherId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              teacherName: { type: 'string' },
              studentCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };

      const command = new GetClassDetailsCommand(id, userId);
      const result = await container.getClassDetailsUseCase.execute(command);

      reply.status(200).send({
        id: result.class.id.toString(),
        name: result.class.name,
        code: result.class.code,
        description: result.class.description,
        color: result.class.color,
        teacherId: result.class.teacherId.toString(),
        createdAt: result.class.createdAt.toISOString(),
        updatedAt: result.class.updatedAt.toISOString(),
        teacherName: result.teacherName,
        studentCount: result.studentCount,
      });
    }
  );

  // GET /api/classes/code/:code - Get class by code for student join validation
  fastify.get(
    '/api/classes/code/:code',
    {
      schema: {
        tags: ['classes'],
        summary: 'Get class by code',
        description: 'Get class information by code for student join validation',
        params: {
          type: 'object',
          properties: {
            code: { type: 'string' },
          },
          required: ['code'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              class: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  color: { type: 'string', nullable: true },
                },
              },
              teacherName: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { code } = request.params as { code: string };

      const command = new GetClassByCodeCommand(code);
      const result = await container.getClassByCodeUseCase.execute(command);

      if (!result) {
        return reply.status(404).send({ message: 'Class not found' });
      }

      reply.status(200).send({
        class: {
          id: result.class.id.toString(),
          name: result.class.name,
          code: result.class.code,
          description: result.class.description,
          color: result.class.color,
        },
        teacherName: result.teacherName,
      });
    }
  );

  // POST /api/classes - Create a new class
  fastify.post(
    '/api/classes',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Create a new class',
        description: 'Create a new class with a unique code that students can join',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Name of the class (e.g., "Mathematics 101")',
            },
            description: {
              type: 'string',
              maxLength: 5000,
              nullable: true,
              description: 'Optional description of the class',
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              nullable: true,
              description: 'Hex color code for UI (e.g., "#FF5733")',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string', nullable: true },
              color: { type: 'string', nullable: true },
              teacherId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const teacherId = (request as any).user.userId;
      const { name, description, color } = request.body as {
        name: string;
        description?: string;
        color?: string;
      };

      const command = new CreateClassCommand(teacherId, name, description, color);
      const result = await container.createClassUseCase.execute(command);

      reply.status(201).send({
        id: result.id.toString(),
        name: result.name,
        code: result.code,
        description: result.description,
        color: result.color,
        teacherId: result.teacherId.toString(),
        createdAt: result.createdAt.toISOString(),
      });
    }
  );

  // DELETE /api/classes/:id - Delete a class
  fastify.delete(
    '/api/classes/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Delete a class',
        description: 'Delete a class (only accessible by the class teacher)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          204: {
            description: 'Class deleted successfully',
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };

      const command = new DeleteClassCommand(id, userId);
      await container.deleteClassUseCase.execute(command);

      reply.status(204).send();
    }
  );

  // GET /api/classes/:classId/students - List students in class
  fastify.get(
    '/api/classes/:classId/students',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'List students in class',
        description: 'Get all students enrolled in a class',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['classId'],
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1, minimum: 1 },
            limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              students: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    joinedAt: { type: 'string', format: 'date-time' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { classId } = request.params as { classId: string };
      const {
        page = 1,
        limit = 20,
        search = '',
      } = request.query as {
        page?: number;
        limit?: number;
        search?: string;
      };

      const command = new GetClassStudentsCommand(classId, page, limit, search);
      const result = await container.getClassStudentsUseCase.execute(command);

      reply.status(200).send({
        students: result.students.map((s: any) => ({
          id: s.id.toString(),
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          joinedAt:
            s.joinedAt instanceof Date
              ? s.joinedAt.toISOString()
              : new Date(s.joinedAt).toISOString(),
          isActive: s.isActive,
        })),
        total: result.total,
        page,
        limit,
      });
    }
  );

  // DELETE /api/classes/:classId/students/:studentId - Remove student from class
  fastify.delete(
    '/api/classes/:classId/students/:studentId',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Remove student from class',
        description: 'Remove a student from a class (only accessible by the class teacher)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
          },
          required: ['classId', 'studentId'],
        },
        response: {
          204: {
            description: 'Student removed successfully',
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { classId, studentId } = request.params as { classId: string; studentId: string };

      const command = new RemoveStudentFromClassCommand(classId, studentId, userId);
      await container.removeStudentFromClassUseCase.execute(command);

      reply.status(204).send();
    }
  );

  // POST /api/classes/:classId/join - Student joins class
  fastify.post(
    '/api/classes/:classId/join',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Student joins a class',
        description: 'Student joins a class using class ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            classId: { type: 'string', format: 'uuid' },
          },
          required: ['classId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              classId: { type: 'string', format: 'uuid' },
              joinedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };

      const command = new StudentJoinClassCommand(classId, userId);

      const result = await container.studentJoinClassUseCase.execute(command);

      reply.status(201).send({
        classId: result.classId.toString(),
        joinedAt: result.joinedAt.toISOString(),
      });
    }
  );

  // POST /api/classes/:classId/invitations - Invite students by email
  fastify.post(
    '/api/classes/:classId/invitations',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Invite students by email',
        description: 'Create invitations for students via email',
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
          required: ['emails'],
          properties: {
            emails: {
              type: 'array',
              items: { type: 'string', format: 'email' },
              maxItems: 50,
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              invitations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING'] },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };
      const { emails } = request.body as { emails: string[] };

      const command = new CreateEmailInvitationsCommand(classId, userId, emails);

      const result = await container.createEmailInvitationsUseCase.execute(command);

      reply.status(200).send({
        invitations: result.map((i: any) => ({
          email: i.email,
          status: i.status,
          expiresAt: i.expiresAt.toISOString(),
        })),
      });
    }
  );

  // POST /api/classes/:classId/invitations/csv - Import students from CSV
  fastify.post(
    '/api/classes/:classId/invitations/csv',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Import students from CSV file',
        description: 'Upload CSV file to create invitations for students',
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
          properties: {
            file: { type: 'string', format: 'binary' },
          },
          required: ['file'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              imported: { type: 'integer' },
              failed: { type: 'integer' },
              errors: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };
      const { csvContent } = request.body as { csvContent: string };

      const command = new ImportStudentsCSVCommand(classId, userId, csvContent);

      const result = await container.importStudentsCSVUseCase.execute(command);

      reply.status(200).send({
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      });
    }
  );

  // GET /api/classes/:classId/invitations - List invitations
  fastify.get(
    '/api/classes/:classId/invitations',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'List all invitations for a class',
        description: 'Get all invitations for a class with their status',
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
              invitations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string' },
                    status: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    acceptedAt: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };

      const command = new GetClassInvitationsCommand(classId, userId);

      const result = await container.getClassInvitationsUseCase.execute(command);

      reply.status(200).send({
        invitations: result.invitations,
      });
    }
  );

  // POST /api/invitations/:token/accept - Accept invitation
  fastify.post(
    '/api/invitations/:token/accept',
    {
      schema: {
        tags: ['invitations'],
        summary: 'Accept invitation and join class',
        description: 'Accept invitation using token (public endpoint)',
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              classId: { type: 'string', format: 'uuid' },
              joinedAt: { type: 'string', format: 'date-time' },
            },
          },
          302: {
            description: 'Redirect to class page',
          },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const userId = (request as any).user?.userId;

      const command = new StudentJoinClassWithInvitationCommand(token, userId);

      const result = await container.studentJoinClassWithInvitationUseCase.execute(command);

      reply.status(200).send({
        classId: result.classId.toString(),
        joinedAt: result.joinedAt.toISOString(),
      });
    }
  );

  // POST /api/invitations/:token/resend - Resend invitation
  fastify.post(
    '/api/invitations/:token/resend',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['invitations'],
        summary: 'Resend invitation email',
        description: 'Resend invitation email to student',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        response: {
          204: {
            description: 'Invitation resent successfully',
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { token } = request.params as { token: string };

      // Find invitation by token first to get the invitationId
      const invitation = await container.invitationRepository.findByToken(token);
      if (!invitation) {
        return;
      }

      await container.resendInvitationUseCase.execute({
        invitationId: invitation.id.toString(),
        userId,
      });

      reply.status(204).send();
    }
  );

  // GET /api/classes/:classId/documents - Get documents shared with a class (for students)
  fastify.get(
    '/api/classes/:classId/documents',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Get class documents',
        description: 'Get all documents shared with a class (students only see visible documents)',
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
              class: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                },
              },
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    documentId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    filename: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    isVisible: { type: 'boolean' },
                    publishedAt: { type: 'string', format: 'date-time', nullable: true },
                    orderIndex: { type: 'number' },
                  },
                },
              },
            },
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
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
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };

      try {
        const result = await container.getClassDocumentsForStudentUseCase.execute({
          classId,
          studentId: userId,
        });

        reply.status(200).send({
          class: result.class,
          documents: result.documents.map((doc) => ({
            id: doc.id,
            documentId: doc.documentId,
            title: doc.title,
            filename: doc.filename,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            isVisible: doc.isVisible,
            publishedAt: doc.publishedAt?.toISOString() ?? null,
            orderIndex: doc.orderIndex,
          })),
        });
      } catch (error: any) {
        if (error.message === 'Class not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Class not found',
          });
        }
        if (error.message.includes('not enrolled')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'You are not enrolled in this class',
          });
        }
        throw error;
      }
    }
  );

  // GET /api/classes/:classId/documents/teacher - Get class documents (teacher view)
  fastify.get(
    '/api/classes/:classId/documents/teacher',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Get class documents (teacher view)',
        description:
          'Get all documents shared with a class. Teachers can see both published and draft documents.',
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
              class: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                },
              },
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    documentId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    filename: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    isVisible: { type: 'boolean' },
                    publishedAt: { type: 'string', format: 'date-time', nullable: true },
                    orderIndex: { type: 'number' },
                    sharedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
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
      const userId = (request as any).user.userId;
      const { classId } = request.params as { classId: string };

      try {
        const result = await container.getClassDocumentsForTeacherUseCase.execute({
          classId,
          teacherId: userId,
        });

        reply.status(200).send({
          class: result.class,
          documents: result.documents.map((doc) => ({
            id: doc.id,
            documentId: doc.documentId,
            title: doc.title,
            filename: doc.filename,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            isVisible: doc.isVisible,
            publishedAt: doc.publishedAt?.toISOString() ?? null,
            orderIndex: doc.orderIndex,
            sharedAt: doc.sharedAt.toISOString(),
          })),
        });
      } catch (error: any) {
        if (error.message === 'Class not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Class not found',
          });
        }
        if (error.message.includes('permission')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  // GET /api/student/classes - Get enrolled classes for student
  fastify.get(
    '/api/student/classes',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Get my enrolled classes',
        description: 'Get all classes the current student is enrolled in',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    description: { type: 'string' },
                    color: { type: 'string' },
                    teacherId: { type: 'string', format: 'uuid' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const userRole = (request as any).user.role;

      // Only students can access this endpoint
      if (userRole !== 'STUDENT') {
        (reply as any).code(403).send({ error: 'Only students can access their enrolled classes' });
        return;
      }

      const command = new GetStudentClassesCommand(userId);
      const result = await container.getStudentClassesUseCase.execute(command);

      reply.status(200).send({
        classes: result.classes.map((cls: any) => ({
          id: cls.id.toString(),
          name: cls.name,
          code: cls.code.value,
          description: cls.description,
          color: cls.color,
          teacherId: cls.teacherId.toString(),
          createdAt: cls.createdAt.toISOString(),
          updatedAt: cls.updatedAt.toISOString(),
        })),
      });
    }
  );
}
