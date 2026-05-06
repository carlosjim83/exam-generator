import type { FastifyRequest, FastifyReply } from 'fastify';

import { container } from '@config/container.js';

/**
 * Middleware to authenticate users via JWT
 * Extracts token from Authorization header, validates it, and attaches user to request
 */
export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing authorization header',
      });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid authorization format. Expected: Bearer <token>',
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token using container's token service
    const payload = container.tokenService.verifyAccessToken(token);

    // Attach user info to request
    request.user = payload;
  } catch (error: any) {
    // Handle JWT errors
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message || 'Invalid token',
    });
  }
}

/**
 * Re-export role authorization middleware from role.middleware.ts
 */
export { authorizeRoles as requireRoles } from './role.middleware.js';
