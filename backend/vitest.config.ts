import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load .env.test FIRST (it overrides DATABASE_URL for tests)
// Then load .env for other variables that .env.test doesn't define
const envTestPath = path.resolve(__dirname, '.env.test');
if (existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath, override: true });
}
dotenv.config({ path: path.resolve(__dirname, '.env'), override: false });

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup - runs ONCE before all tests to setup database
    globalSetup: ['./tests/global-setup.ts'],

    // Global setup and teardown
    globals: true,
    setupFiles: ['./src/config/vitest-global-setup.ts'],

    // File parallelism - run E2E tests sequentially to avoid DB conflicts
    fileParallelism: false, // Run test files one at a time
    pool: 'forks', // Use process isolation for better cleanup

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/coverage/**',
        'src/server.ts', // Exclude server entry point
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test match patterns - now looking in tests/ directory
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules/', 'dist/'],

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporter
    reporters: ['verbose'],

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@config': path.resolve(__dirname, './src/config'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@tests': path.resolve(__dirname, './tests'),
      '@exam-generator/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
});
