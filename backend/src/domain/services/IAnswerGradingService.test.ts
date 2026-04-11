import { beforeEach, describe, expect, it } from 'vitest';

import type { IAnswerGradingService } from '@domain/services/IAnswerGradingService.js';

/**
 * Mock implementation of IAnswerGradingService for testing
 */
class MockAnswerGradingService implements IAnswerGradingService {
  private responses: Map<string, { isCorrect: boolean; score: number; feedback?: string }> =
    new Map();

  setResponse(key: string, response: { isCorrect: boolean; score: number; feedback?: string }) {
    this.responses.set(key, response);
  }

  async gradeAnswer(params: {
    questionText: string;
    correctAnswer: string;
    studentAnswer: string;
    points: number;
  }): Promise<{ isCorrect: boolean; score: number; feedback?: string }> {
    const key = `${params.questionText}_${params.studentAnswer}`;
    const response = this.responses.get(key);

    if (response) {
      return response;
    }

    // Default response: partial credit for non-empty answers
    const similarity = this.calculateSimilarity(params.correctAnswer, params.studentAnswer);
    const score = Math.round(similarity * params.points);

    return {
      isCorrect: similarity >= 0.8,
      score,
      feedback: similarity >= 0.8 ? 'Correct answer' : 'Partial credit based on similarity',
    };
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple similarity calculation for testing
    const aLower = a.toLowerCase().trim();
    const bLower = b.toLowerCase().trim();

    if (aLower === bLower) return 1;
    if (bLower.includes(aLower) || aLower.includes(bLower)) return 0.8;
    return 0.5;
  }
}

describe('IAnswerGradingService', () => {
  let gradingService: MockAnswerGradingService;

  beforeEach(() => {
    gradingService = new MockAnswerGradingService();
  });

  describe('gradeAnswer', () => {
    it('should return correct=true for exact match', async () => {
      const result = await gradingService.gradeAnswer({
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        studentAnswer: 'Paris',
        points: 3,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should return partial score for similar answers', async () => {
      const result = await gradingService.gradeAnswer({
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        studentAnswer: 'paris',
        points: 3,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(3);
    });

    it('should return isCorrect=false for wrong answers', async () => {
      // Configure mock to return incorrect
      gradingService.setResponse('What is the capital of France?_London', {
        isCorrect: false,
        score: 0,
        feedback: 'Incorrect. The capital of France is Paris.',
      });

      const result = await gradingService.gradeAnswer({
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        studentAnswer: 'London',
        points: 3,
      });

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('Paris');
    });

    it('should provide feedback when answer is incorrect', async () => {
      gradingService.setResponse('What is 2+2?_5', {
        isCorrect: false,
        score: 0,
        feedback: 'Incorrect. 2+2 equals 4.',
      });

      const result = await gradingService.gradeAnswer({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        studentAnswer: '5',
        points: 1,
      });

      expect(result.feedback).toBeDefined();
      expect(result.feedback).toContain('4');
    });

    it('should handle multi-word answers', async () => {
      gradingService.setResponse(
        'Explain photosynthesis_The process by which plants convert sunlight into energy',
        { isCorrect: true, score: 3, feedback: 'Good explanation of photosynthesis.' }
      );

      const result = await gradingService.gradeAnswer({
        questionText: 'Explain photosynthesis',
        correctAnswer: 'The process by which plants convert light energy into chemical energy',
        studentAnswer: 'The process by which plants convert sunlight into energy',
        points: 3,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(3);
    });

    it('should handle empty answers', async () => {
      const result = await gradingService.gradeAnswer({
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        studentAnswer: '',
        points: 3,
      });

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });
  });
});
