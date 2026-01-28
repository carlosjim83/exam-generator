import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup and teardown
    globals: true,
    setupFiles: ['./src/config/vitest-global-setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
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

    // Test match patterns
    include: ['src/**/*.{test,spec}.ts'],
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
      '@exam-generator/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
});
