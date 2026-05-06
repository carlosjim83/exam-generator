import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware to authorize specific roles
 * Must be used AFTER authenticateUser middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function authorizeRoles(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Get user from request (attached by authenticateUser)
    const user = request.user;

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

// Backward-compatible alias used by some route files
export { authorizeRoles as requireRoles };
