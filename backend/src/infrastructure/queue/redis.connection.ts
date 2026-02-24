/**
 * Redis Connection Configuration for BullMQ
 *
 * Centralized Redis connection settings used by both Queue and Worker
 */

import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Determine if we need TLS (Azure Redis uses port 6380 with TLS)
const needsTLS = REDIS_PORT === 6380 || REDIS_HOST.includes('redis.cache.windows.net');

// Connection options for BullMQ (not the Redis instance itself)
export const redisConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Recommended for BullMQ
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

// Redis instance for direct Redis operations (if needed elsewhere)
export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  ...(needsTLS && {
    tls: {
      servername: REDIS_HOST,
    },
  }),
});

// Log connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});
