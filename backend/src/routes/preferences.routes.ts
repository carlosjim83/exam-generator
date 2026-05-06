import type { FastifyInstance } from 'fastify';

import { container } from '@config/container.js';
import { authenticateUser } from '@middleware/auth.middleware.js';
import { BadRequestResponseSchema, ErrorResponseSchema } from '@schemas/common.js';
import {
  PreferencesResponseSchema,
  PreferencesUpdateResponseSchema,
} from '@schemas/preferences.js';

export async function preferencesRoutes(fastify: FastifyInstance) {
  // GET /api/preferences - Get user preferences
  fastify.get(
    '/api/preferences',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['preferences'],
        summary: 'Get user preferences',
        description: 'Get language and theme preferences for the authenticated user',
        security: [{ bearerAuth: [] }],
        response: {
          200: PreferencesResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;

        // Get or create preferences
        let preferences = await container.prisma.userPreferences.findUnique({
          where: { userId },
        });

        if (!preferences) {
          // Create default preferences if they don't exist
          preferences = await container.prisma.userPreferences.create({
            data: {
              userId,
              language: 'en',
              theme: 'light',
            },
          });
        }

        return reply.status(200).send({
          language: preferences.language,
          theme: preferences.theme,
        });
      } catch (error: any) {
        fastify.log.error('Get preferences error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get preferences',
        });
      }
    }
  );

  // PATCH /api/preferences - Update user preferences
  fastify.patch(
    '/api/preferences',
    {
      preHandler: authenticateUser,
      schema: {
        tags: ['preferences'],
        summary: 'Update user preferences',
        description: 'Update language and/or theme preferences',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              enum: ['en', 'es'],
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark'],
            },
          },
        },
        response: {
          200: PreferencesUpdateResponseSchema,
          400: BadRequestResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { language, theme } = request.body as { language?: string; theme?: string };
        const userId = request.user!.userId;

        // Validate at least one field is provided
        if (!language && !theme) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'At least one preference (language or theme) must be provided',
          });
        }

        // Build update data
        const updateData: { language?: string; theme?: string } = {};
        if (language) updateData.language = language;
        if (theme) updateData.theme = theme;

        // Upsert preferences
        const preferences = await container.prisma.userPreferences.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            language: language || 'en',
            theme: theme || 'light',
          },
        });

        return reply.status(200).send({
          language: preferences.language,
          theme: preferences.theme,
          message: 'Preferences updated successfully',
        });
      } catch (error: any) {
        fastify.log.error('Update preferences error:', error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to update preferences',
        });
      }
    }
  );
}
