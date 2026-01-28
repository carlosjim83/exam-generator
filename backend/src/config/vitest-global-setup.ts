import { beforeAll, afterAll } from 'vitest';
import { prisma } from './prisma'; // Import prisma for cleanup/reset
import { Container } from './container'; // Ensure container can be reset

/**
 * Global Vitest setup file.
 * This file runs once before all test suites and provides global hooks
 * for database cleanup and container management.
 *
 * Strategy:
 * - beforeAll: Runs ONCE at the start of the entire test run
 * - Cleans database and resets container to ensure fresh state
 * - Each test file is responsible for managing its own test data lifecycle
 *
 * Note: Individual test files should use beforeAll/beforeEach to set up
 * their specific test data as needed.
 */

// Reset container and cleanup database ONCE before all tests run
beforeAll(async () => {
  // Ensure the container is reset for a clean state
  Container.reset();

  // Clean the database before test run starts
  // Delete in correct order to respect foreign key constraints:
  // 1. Delete child tables first (documents reference users)
  // 2. Delete parent tables last (users)
  await prisma.$transaction([prisma.document.deleteMany(), prisma.user.deleteMany()]);
});

// Disconnect Prisma after all tests are done
afterAll(async () => {
  await prisma.$disconnect();
});
