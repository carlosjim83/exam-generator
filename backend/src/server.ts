import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env, validateEnv } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { oauthRoutes } from './routes/oauth.routes.js';
import { documentRoutes } from './routes/document.routes.js';
import { examRoutes } from './routes/exam.routes.js';
import { studentRoutes } from './routes/student.routes.js';
import { protectedRoutes } from './routes/protected.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { preferencesRoutes } from './routes/preferences.routes.js';
import { bootstrapEventHandlers } from './infrastructure/events/bootstrap.js';

// Validate environment variables on startup
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Bootstrap event handlers for background processing
bootstrapEventHandlers();

// Start the document processing worker
// This imports and initializes the BullMQ worker that processes documents in the background
import './infrastructure/queue/DocumentWorker.js';
console.log('📦 Document processing worker initialized');

// Create Fastify instance with logging
const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// Register CORS plugin
await fastify.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

// Register multipart/form-data plugin (for file uploads)
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Max 1 file per request
  },
});

// Register rate limiting plugin (global defaults)
await fastify.register(rateLimit, {
  global: true, // Enable rate limiting globally
  max: 100, // 100 requests per timeWindow (default for all routes)
  timeWindow: '1 minute', // Time window for rate limiting
  cache: 10000, // Cache size (number of unique IPs to track)
  allowList: [], // Whitelist IPs (empty in production)
  redis: undefined, // Use in-memory store (for development)
  nameSpace: 'exam-generator:', // Redis key prefix (if using Redis)
  continueExceeding: true, // Continue counting even after limit exceeded
  skipOnError: true, // Skip rate limiting if Redis/cache fails (fail open)
  ban: undefined, // Ban IPs after X violations (optional)
  keyGenerator: (request) => {
    // Use IP address as key
    return request.ip;
  },
  errorResponseBuilder: (_request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: context.ttl, // Time until rate limit resets (in ms)
    };
  },
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
});

// Register Swagger for API documentation
await fastify.register(swagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Exam Generator API',
      description:
        'AI-powered exam generation platform with RAG (Retrieval-Augmented Generation). Upload documents, generate exams, and manage student assessments.',
      version: '0.1.0',
      contact: {
        name: 'Exam Generator Team',
        email: 'support@exam-generator.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.exam-generator.dev',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'health',
        description: 'Health check and monitoring endpoints',
      },
      {
        name: 'auth',
        description: 'Authentication endpoints (register, login, refresh, logout)',
      },
      {
        name: 'protected',
        description: 'Protected endpoints (require authentication)',
      },
      {
        name: 'documents',
        description: 'Document upload and management (coming soon)',
      },
      {
        name: 'exams',
        description: 'Exam generation and management (coming soon)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (obtained from /auth/login or /auth/register)',
        },
      },
    },
  },
});

// Register Swagger UI
await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Register routes
await fastify.register(healthRoutes);
await fastify.register(authRoutes);
await fastify.register(oauthRoutes);
await fastify.register(preferencesRoutes);
await fastify.register(documentRoutes);
await fastify.register(examRoutes);
await fastify.register(studentRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(protectedRoutes);

// Legacy health check endpoint (kept for backwards compatibility)
fastify.get('/health-legacy', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '0.1.0',
  };
});

// Root endpoint
fastify.get('/', async () => {
  return {
    message: 'Exam Generator API',
    version: '0.1.0',
    documentation: '/docs',
  };
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    fastify.log.info(`
╔══════════════════════════════════════════════════╗
║  🚀 Exam Generator API Server                    ║
║  Environment: ${env.NODE_ENV.padEnd(34)}║
║  Server: http://${env.HOST}:${env.PORT}${' '.repeat(23)}║
║  Health: http://${env.HOST}:${env.PORT}/health${' '.repeat(17)}║
║  Docs:   http://${env.HOST}:${env.PORT}/docs${' '.repeat(19)}║
╚══════════════════════════════════════════════════╝
    `);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
