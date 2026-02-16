/**
 * Class Routes
 * API endpoints for class creation and management
 */

import { FastifyInstance } from 'fastify';
import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';

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

      reply.code(201).send({
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
}
