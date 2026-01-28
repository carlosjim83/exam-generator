import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { Container } from '@config/container.js';
import { authRoutes } from '@routes/auth.routes.js';
import { documentRoutes } from '@routes/document.routes.js';
import { protectedRoutes } from '@routes/protected.routes.js';
import { oauthRoutes } from '@routes/oauth.routes.js';

/**
 * Creates and configures a Fastify test server instance.
 * This helper ensures that all routes and plugins are registered
 * and the dependency injection container is properly initialized for testing.
 */
export async function createTestServer(): Promise<FastifyInstance> {
  // Reset the DI container for a clean test environment (important for singleton)
  Container.reset();

  const app = Fastify({
    logger: false, // Disable logging during tests
  });

  // Register Fastify plugins
  app.register(multipart); // Needed for file uploads

  // Register application routes
  app.register(authRoutes);
  app.register(documentRoutes);
  app.register(protectedRoutes);
  app.register(oauthRoutes);

  // Ensure all plugins and routes are ready
  await app.ready();

  return app;
}
