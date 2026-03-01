import { beforeAll, afterAll, vi } from 'vitest';

// Note: Database setup is handled by tests/global-setup.ts which runs ONCE before all tests
// This file handles per-worker setup and cleanup

import { Container } from './container.js';
import { prisma } from './prisma.js';

/**
 * Global Vitest setup file.
 * This file runs once per test worker and provides global hooks
 * for database cleanup and container management.
 *
 * Strategy:
 * - beforeAll: Runs ONCE at the start of the test worker
 * - Cleans database to ensure fresh state
 * - Each test file is responsible for managing its own test data lifecycle
 *
 * Note: Individual test files should use beforeAll/beforeEach to set up
 * their specific test data as needed.
 */

// Mock Azure OpenAI SDK to prevent real API calls in tests
vi.mock('openai', () => {
  return {
    AzureOpenAI: class MockAzureOpenAI {
      embeddings = {
        create: vi.fn().mockResolvedValue({
          data: [
            {
              embedding: Array(1536)
                .fill(0)
                .map(() => Math.random()),
              index: 0,
              object: 'embedding',
            },
          ],
          model: 'text-embedding-3-small',
          object: 'list',
          usage: { prompt_tokens: 8, total_tokens: 8 },
        }),
      };

      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            id: 'chatcmpl-mock',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    questions: [
                      {
                        id: '1',
                        type: 'multiple_choice',
                        question: 'Mock question?',
                        options: ['A', 'B', 'C', 'D'],
                        correctAnswer: 'A',
                        explanation: 'Mock explanation',
                        difficulty: 'medium',
                        topic: 'Mock topic',
                      },
                    ],
                  }),
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
        },
      };
    },
  };
});

// Mock AzureOpenAIEmbeddingService to prevent env var checks
vi.mock('@infrastructure/ai/AzureOpenAIEmbeddingService.js', () => {
  return {
    AzureOpenAIEmbeddingService: class MockAzureOpenAIEmbeddingService {
      async generateEmbedding(_text: string): Promise<number[]> {
        return Array(1536)
          .fill(0)
          .map(() => Math.random());
      }

      async generateEmbeddings(_texts: string[]): Promise<number[][]> {
        return _texts.map(() =>
          Array(1536)
            .fill(0)
            .map(() => Math.random())
        );
      }
    },
  };
});

// Reset container and cleanup database before all tests
beforeAll(async () => {
  // Reset container for clean state
  Container.reset();

  // Clean the database before test run starts
  // Note: We use the test database (from .env.test), NOT development database
  await prisma.$transaction([
    // Student module tables (most dependent)
    prisma.studentAnswer.deleteMany(),
    prisma.examAssignment.deleteMany(),
    prisma.question.deleteMany(),
    prisma.exam.deleteMany(),
    // Class module tables
    prisma.classDocument.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.studentEnrollment.deleteMany(),
    prisma.class.deleteMany(),
    // Document tables
    prisma.documentChunk.deleteMany(),
    prisma.document.deleteMany(),
    // User table (least dependent - others reference this)
    prisma.user.deleteMany(),
  ]);
});

// Disconnect Prisma after all tests are done
afterAll(async () => {
  await prisma.$disconnect();
});
