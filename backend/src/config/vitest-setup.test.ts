import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should have access to shared types', async () => {
    const { UserRole } = await import('@exam-generator/shared');
    expect(UserRole.TEACHER).toBe('TEACHER');
    expect(UserRole.STUDENT).toBe('STUDENT');
  });
});
