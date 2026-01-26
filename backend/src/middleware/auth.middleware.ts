import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../services/token.service.js';

const tokenService = new TokenService();

/**
 * Middleware to authenticate users via JWT
 * Extracts token from Authorization header, validates it, and attaches user to request
 */
export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
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

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    // Attach user info to request
    (request as any).user = payload;
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
 * Middleware to require specific roles
 * Must be used AFTER authenticateUser middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireRoles(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Get user from request (attached by authenticateUser)
    const user = (request as any).user;

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      });
    }
  };
}
