/**
 * Class Routes
 * API endpoints for class creation and management
 */

import { FastifyInstance } from 'fastify';
import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { GetClassesCommand } from '@application/use-cases/classes/GetClassesUseCase.js';
import { GetClassByCodeCommand } from '@application/use-cases/classes/GetClassByCodeUseCase.js';
import { DeleteClassCommand } from '@application/use-cases/classes/DeleteClassUseCase.js';

export async function classRoutes(fastify: FastifyInstance) {
  // POST /classes - Create a new class
  fastify.post(
    '/classes',
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
      const userId = (request as any).user.userId;
      const { name, description, color } = request.body as {
        name: string;
        description?: string;
        color?: string;
      };

      const command = {
        teacherId: userId,
        name,
        description,
        color,
      };

      const classEntity = await container.createClassUseCase.execute(command);

      reply.status(201).send({
        id: classEntity.id.toString(),
        name: classEntity.name,
        code: classEntity.code,
        description: classEntity.description,
        color: classEntity.color,
        teacherId: classEntity.teacherId.toString(),
        createdAt: classEntity.createdAt.toISOString(),
      });
    }
  );

  // GET /classes - List classes for the current user
  fastify.get(
    '/classes',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'List all classes for the authenticated teacher',
        description: 'Paginated list of classes created by the authenticated user',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number (1-based)',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Number of items per page',
            },
            search: {
              type: 'string',
              description: 'Search term for class name or description',
            },
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
                    studentCount: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
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

      reply.code(200).send({
        classes: result.classes.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          code: c.code,
          description: c.description,
          color: c.color,
          studentCount: 0,
          createdAt: c.createdAt.toISOString(),
        })),
        total: result.total,
        page,
        limit,
      });
    }
  );

  // GET /classes/:id - Get class details
  fastify.get(
    '/classes/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Get class details with student count',
        description: 'Retrieve class information and number of enrolled students',
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
              teacherName: { type: 'string' },
              studentCount: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.userId;
      const { id } = request.params as { id: string };

      const command = {
        classId: id,
        userId,
      };

      const result = await container.getClassDetailsUseCase.execute(command);

      reply.code(200).send({
        id: result.class.id.toString(),
        name: result.class.name,
        code: result.class.code,
        description: result.class.description,
        color: result.class.color,
        teacherId: result.class.teacherId.toString(),
        teacherName: result.teacherName,
        studentCount: result.studentCount,
        createdAt: result.class.createdAt.toISOString(),
      });
    }
  );

  // GET /classes/code/:code - Get class by code (public endpoint)
  fastify.get(
    '/classes/code/:code',
    {
      schema: {
        tags: ['classes'],
        summary: 'Get class information by code (public)',
        description: 'Retrieve class information for student join validation',
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
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              teacherName: { type: 'string' },
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
        throw new Error('Class not found');
      }

      return reply.status(200).send({
        id: result.class.id.toString(),
        name: result.class.name,
        teacherName: result.teacherName,
      });
    }
  );

  // DELETE /classes/:id - Delete a class
  fastify.delete(
    '/classes/:id',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['classes'],
        summary: 'Delete a class',
        description: 'Delete a class created by the authenticated user',
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

      reply.code(204).send();
    }
  );
}
