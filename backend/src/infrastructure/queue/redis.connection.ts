/**
 * Redis Connection Configuration for BullMQ
 *
 * Centralized Redis connection settings used by both Queue and Worker.
 * Uses separate ioredis instances for Queue and Worker so BullMQ
 * does not create internal connections without error handlers.
 */

import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Determine if we need TLS (Azure Redis uses port 6380 with TLS)
const needsTLS = REDIS_PORT === 6380 || REDIS_HOST.includes('redis.cache.windows.net');

// Base connection options for BullMQ (not the Redis instance itself)
const baseConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Recommended for BullMQ
  // keepAlive prevents Azure Redis from closing idle TCP connections
  keepAlive: 30000,
  connectTimeout: 30000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  ...(needsTLS && {
    tls: {
      servername: REDIS_HOST,
    },
  }),
};

// Export connection options for backward compatibility
export const redisConnection = baseConnectionOptions;

// Dedicated Redis instance for BullMQ Queue (non-blocking ops)
// This instance has error listeners so ECONNRESETs are caught instead of
// crashing the process as uncaught exceptions.
export const redisQueue = new Redis(baseConnectionOptions);
redisQueue.on('connect', () => {
  console.log('[Redis Queue] Connected successfully');
});
redisQueue.on('error', (err) => {
  console.error('[Redis Queue] Connection error:', err.message);
});
redisQueue.on('close', () => {
  console.warn('[Redis Queue] Connection closed');
});

// Dedicated Redis instance for BullMQ Worker (blocking ops like BRPOP)
// Must be separate from Queue connection to avoid blocking non-blocking ops.
export const redisWorker = new Redis(baseConnectionOptions);
redisWorker.on('connect', () => {
  console.log('[Redis Worker] Connected successfully');
});
redisWorker.on('error', (err) => {
  console.error('[Redis Worker] Connection error:', err.message);
});
redisWorker.on('close', () => {
  console.warn('[Redis Worker] Connection closed');
});

// Legacy Redis instance for direct Redis operations (if needed elsewhere)
export const redis = new Redis(baseConnectionOptions);
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});
