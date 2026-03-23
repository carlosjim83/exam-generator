import AdminJSFastify from '@adminjs/fastify';
import cors from '@fastify/cors';
import '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { authenticate } from './admin/auth.js';
import { admin } from './admin/index.js';
import { env, validateEnv } from './config/env.js';
import { bootstrapEventHandlers } from './infrastructure/events/bootstrap.js';
import { authRoutes } from './routes/auth.routes.js';
import { classExamRoutes } from './routes/class-exam.routes.js';
import { classRoutes } from './routes/class.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { documentRoutes } from './routes/document.routes.js';
import { examRoutes } from './routes/exam.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { oauthRoutes } from './routes/oauth.routes.js';
import { preferencesRoutes } from './routes/preferences.routes.js';
import { protectedRoutes } from './routes/protected.routes.js';
import { studentRoutes } from './routes/student.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';

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
  trustProxy: true,
});

// Register CORS plugin
await fastify.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
        description: 'Document upload and management',
      },
      {
        name: 'exams',
        description: 'Exam generation and management',
      },
      {
        name: 'students',
        description: 'Student exam assignments and submissions',
      },
      {
        name: 'classes',
        description: 'Class creation and management',
      },
      {
        name: 'class-exams',
        description: 'Class exam management and student assignments',
      },
      {
        name: 'class-documents',
        description: 'Document sharing with classes',
      },
      {
        name: 'invitations',
        description: 'Class invitations and enrollment',
      },
      {
        name: 'preferences',
        description: 'User preferences (language, theme)',
      },
      {
        name: 'dashboard',
        description: 'Dashboard statistics and analytics',
      },
      {
        name: 'subscription',
        description: 'Subscription management and pricing',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter your JWT access token (obtained from /api/auth/login or /api/auth/register)',
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

console.log('⚠️  Using in-memory session store (not persistent across restarts)');

// Register AdminJS router BEFORE other routes
await AdminJSFastify.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      return await authenticate(email, password, prisma);
    },
    cookiePassword: env.ADMINJS_COOKIE_SECRET,
    cookieName: 'adminjs',
  },
  fastify,
  {
    secret: env.ADMINJS_COOKIE_SECRET,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }
);

// AdminJS debug hook - can be removed in production
fastify.addHook('onRequest', async (request) => {
  if (request.url.startsWith('/admin')) {
    console.log('🔍 ADMIN request:', {
      method: request.method,
      url: request.url,
    });
  }
});

// Register routes AFTER AdminJS (so multipart decorator is available)
await fastify.register(healthRoutes);
await fastify.register(authRoutes);
await fastify.register(oauthRoutes);
await fastify.register(preferencesRoutes);
await fastify.register(documentRoutes); // Needs multipart - registered after AdminJS
await fastify.register(examRoutes);
await fastify.register(studentRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(protectedRoutes);
await fastify.register(classRoutes);
await fastify.register(classExamRoutes);
await fastify.register(subscriptionRoutes);

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
