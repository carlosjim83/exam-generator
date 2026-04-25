import { describe, it, expect } from 'vitest';
import { isLLMArtifact } from '@infrastructure/ai/flows/generateExam.flow.js';

describe('isLLMArtifact', () => {
  describe('should detect LLM artifacts (filter OUT)', () => {
    it('detects correctAnswer]: with various spacings', () => {
      expect(isLLMArtifact('correctAnswer]:')).toBe(true);
      expect(isLLMArtifact('correctAnswer]: ')).toBe(true);
      expect(isLLMArtifact('  correctAnswer]:  ')).toBe(true);
    });

    it('detects explanation]: as artifact', () => {
      expect(isLLMArtifact('explanation]:')).toBe(true);
    });

    it('detects standalone property names', () => {
      expect(isLLMArtifact('correctAnswer')).toBe(true);
      expect(isLLMArtifact('correctanswer')).toBe(true); // case insensitive
      expect(isLLMArtifact('explanation')).toBe(true);
      expect(isLLMArtifact('questionText')).toBe(true);
      expect(isLLMArtifact('difficulty')).toBe(true);
      expect(isLLMArtifact('points')).toBe(true);
      expect(isLLMArtifact('options')).toBe(true);
      expect(isLLMArtifact('type')).toBe(true);
    });

    it('detects JSON quoted properties with colon', () => {
      expect(isLLMArtifact('"correctAnswer":')).toBe(true);
      expect(isLLMArtifact('"explanation": ')).toBe(true);
    });

    it('detects JSON braces alone', () => {
      expect(isLLMArtifact('{')).toBe(true);
      expect(isLLMArtifact('}')).toBe(true);
      expect(isLLMArtifact('  {  ')).toBe(true);
    });

    it('detects questionText]: as artifact', () => {
      expect(isLLMArtifact('questionText]:')).toBe(true);
    });
  });

  describe('should NOT filter valid answer options (keep IN)', () => {
    it('allows sentences containing artifact words', () => {
      // These are legitimate options that happen to contain the words
      expect(isLLMArtifact('The correct answer is A')).toBe(false);
      expect(isLLMArtifact('For a detailed explanation see chapter 3')).toBe(false);
      expect(isLLMArtifact('What is the difficulty level?')).toBe(false);
      expect(isLLMArtifact('All of the above options are correct')).toBe(false);
    });

    it('allows programming/technical terms', () => {
      expect(isLLMArtifact('string type')).toBe(false);
      expect(isLLMArtifact('The type of variable')).toBe(false);
      expect(isLLMArtifact('Data types in Python')).toBe(false);
    });

    it('allows text with curly braces in context', () => {
      expect(isLLMArtifact('function() { return x; }')).toBe(false);
      expect(isLLMArtifact('JSON object: {key: value}')).toBe(false);
    });

    it('allows text with quotes in context', () => {
      expect(isLLMArtifact('He said "hello" to me')).toBe(false);
      expect(isLLMArtifact('The string "correctAnswer" is a property')).toBe(false);
    });

    it('allows Spanish/typical exam content', () => {
      expect(isLLMArtifact('El tipo correcto de dato')).toBe(false);
      expect(isLLMArtifact('Nivel de dificultad avanzado')).toBe(false);
      expect(isLLMArtifact('Otras opciones son válidas')).toBe(false);
    });

    it('allows content with brackets that are not artifacts', () => {
      expect(isLLMArtifact('Answer [A] is correct')).toBe(false);
      expect(isLLMArtifact('Value [0] in the array')).toBe(false);
    });

    it('allows typical multiple choice answers', () => {
      expect(isLLMArtifact('A. 42')).toBe(false);
      expect(isLLMArtifact('B. The speed of light')).toBe(false);
      expect(isLLMArtifact('C. 3.14159')).toBe(false);
      expect(isLLMArtifact('D. None of the above')).toBe(false);
    });

    it('allows text with colons in context', () => {
      expect(isLLMArtifact('Note: This is important')).toBe(false);
      expect(isLLMArtifact('Ratio: 3:4')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles empty strings', () => {
      expect(isLLMArtifact('')).toBe(false);
    });

    it('handles whitespace-only strings', () => {
      expect(isLLMArtifact('   ')).toBe(false);
    });

    it('handles single characters', () => {
      expect(isLLMArtifact('a')).toBe(false);
      expect(isLLMArtifact(':')).toBe(false);
      expect(isLLMArtifact(']')).toBe(false);
    });

    it('handles partial matches that are not standalone', () => {
      expect(isLLMArtifact('correct')).toBe(false); // prefix
      expect(isLLMArtifact('Answer')).toBe(false); // suffix
      expect(isLLMArtifact('mytype')).toBe(false); // contains 'type'
      expect(isLLMArtifact('explanations')).toBe(false); // plural
    });

    it('handles property-like text with different casing', () => {
      expect(isLLMArtifact('CorrectAnswer')).toBe(true); // PascalCase is still artifact
      expect(isLLMArtifact('CORRECTANSWER')).toBe(true); // ALL CAPS
    });
  });
});
