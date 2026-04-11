import { describe, expect, it, vi } from 'vitest';

import { AzureOpenAIGradingService } from '@infrastructure/ai/AzureOpenAIGradingService.js';

/**
 * Unit tests for AzureOpenAIGradingService
 *
 * Note: These tests mock the Azure OpenAI client to avoid
 * actual API calls during testing.
 */
describe('AzureOpenAIGradingService', () => {
  describe('gradeAnswer', () => {
    it('should return score 0 for empty answers', async () => {
      const service = new AzureOpenAIGradingService();

      const result = await service.gradeAnswer({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        studentAnswer: '',
        points: 1,
      });

      expect(result.score).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('should return score 0 for whitespace-only answers', async () => {
      const service = new AzureOpenAIGradingService();

      const result = await service.gradeAnswer({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        studentAnswer: '   ',
        points: 1,
      });

      expect(result.score).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('should cap score at max points', async () => {
      // This test verifies the parseResponse logic
      const service = new AzureOpenAIGradingService();

      // Mock the client
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 150, // Exceeds max points
                isCorrect: true,
                feedback: 'Great!',
              }),
            },
          },
        ],
      });

      (service as any).client = { chat: { completions: { create: mockCreate } } };

      const result = await service.gradeAnswer({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        studentAnswer: '4',
        points: 3,
      });

      expect(result.score).toBeLessThanOrEqual(3);
    });

    it('should handle AI API errors gracefully', async () => {
      const service = new AzureOpenAIGradingService();

      // Mock the client to throw error
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));
      (service as any).client = { chat: { completions: { create: mockCreate } } };

      const result = await service.gradeAnswer({
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        studentAnswer: 'Paris',
        points: 3,
      });

      // Should use fallback grading
      expect(result.score).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
    });

    it('should handle invalid JSON responses', async () => {
      const service = new AzureOpenAIGradingService();

      // Mock the client to return invalid JSON
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
      });
      (service as any).client = { chat: { completions: { create: mockCreate } } };

      const result = await service.gradeAnswer({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        studentAnswer: '4',
        points: 1,
      });

      // Should use fallback grading
      expect(result.feedback).toBeDefined();
    });
  });
});
