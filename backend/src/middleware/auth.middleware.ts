import type { FastifyRequest, FastifyReply } from 'fastify';

import { container } from '@config/container.js';

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Middleware to authenticate users via JWT
 * Extracts token from Authorization header or httpOnly cookie, validates it, and attaches user to request
 */
export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract token from Authorization header or httpOnly cookie
    const authHeader = request.headers.authorization;
    const cookieToken = parseCookie(request.headers.cookie, 'access_token');

    if (!authHeader && !cookieToken) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing authorization token',
      });
    }

    // Validate Bearer token format when header is present
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid authorization format. Expected: Bearer <token>',
      });
    }

    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing authorization token',
      });
    }

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
