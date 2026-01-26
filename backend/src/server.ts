import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env, validateEnv } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { protectedRoutes } from './routes/protected.routes.js';

// Validate environment variables on startup
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Create Fastify instance with logging
const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: env.NODE_ENV === 'development' 
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

// Register routes
await fastify.register(authRoutes);
await fastify.register(protectedRoutes);

// Health check endpoint
fastify.get('/health', async () => {
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
      host: env.HOST 
    });
    
    fastify.log.info(`
╔══════════════════════════════════════════════════╗
║  🚀 Exam Generator API Server                    ║
║  Environment: ${env.NODE_ENV.padEnd(34)}║
║  Server: http://${env.HOST}:${env.PORT}${' '.repeat(23)}║
║  Health: http://${env.HOST}:${env.PORT}/health${' '.repeat(17)}║
╚══════════════════════════════════════════════════╝
    `);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
