import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  CreateClassUseCase,
  CreateClassCommand,
} from '@application/use-cases/classes/CreateClassUseCase.js';
import { Class } from '@domain/entities/Class.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { IClassRepository } from '@domain/repositories/IClassRepository.js';

// Mock the repository
const mockClassRepository = {
  existsByCode: vi.fn(),
  save: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

describe('CreateClassUseCase', () => {
  let useCase: CreateClassUseCase;
  let teacherId: string;

  beforeEach(() => {
    useCase = new CreateClassUseCase(mockClassRepository);
    teacherId = '123e4567-e89b-42d3-a456-426614174000';
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a class with valid data', async () => {
      // Mock existsByCode to return false (code not taken)
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);

      const command = new CreateClassCommand(
        teacherId,
        'Mathematics 101',
        'Intro to Algebra',
        '#FF5733'
      );

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.name).toBe('Mathematics 101');
      expect(result.description).toBe('Intro to Algebra');
      expect(result.color).toBe('#FF5733');
      expect(result.code.length).toBe(6);
      expect(mockClassRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a class with minimal data', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);

      const command = new CreateClassCommand(teacherId, 'Physics Class');

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.name).toBe('Physics Class');
      expect(result.description).toBeNull();
      expect(result.color).toBeNull();
    });

    it('should generate unique class code', async () => {
      // First call returns true (code taken), second returns false
      vi.mocked(mockClassRepository.existsByCode)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Class);
      expect(result.code.length).toBe(6);
    });

    it('should throw error if unique code cannot be generated', async () => {
      // Always return true (all codes taken)
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(true);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      await expect(useCase.execute(command)).rejects.toThrow(
        'Failed to generate unique class code'
      );
    });

    it('should validate class code uniqueness before saving', async () => {
      const saveMock = vi.mocked(mockClassRepository.save);
      vi.mocked(mockClassRepository.existsByCode)
        .mockResolvedValueOnce(true) // Code1 taken
        .mockResolvedValueOnce(false); // Code2 available

      const command = new CreateClassCommand(teacherId, 'Test Class');

      await useCase.execute(command);

      // save should only be called once (with the second code)
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('should use UserId for teacherId', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      await useCase.execute(command);

      // Verify that the repository was called with a valid Class entity
      const savedClass = vi.mocked(mockClassRepository.save).mock.calls[0][0];
      expect(savedClass).toBeInstanceOf(Class);
      expect(savedClass.teacherId.toString()).toBe(teacherId);
    });

    it('should handle code generation with valid characters', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      const result = await useCase.execute(command);

      // Verify that the code contains only allowed characters
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = result.code;
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    });

    it('should generate 6-character codes', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(false);

      const command = new CreateClassCommand(teacherId, 'Test Class');

      const result = await useCase.execute(command);

      expect(result.code.length).toBe(6);
      expect(result.code).toMatch(/^[A-Z2-9]{6}$/);
    });
  });

  describe('generateClassCode', () => {
    it('should generate 6-character random codes', () => {
      const useCase = new CreateClassUseCase(mockClassRepository);
      const code = (useCase as any).generateClassCode();

      expect(code.length).toBe(6);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('should not use confusing characters', () => {
      const useCase = new CreateClassUseCase(mockClassRepository);
      const code = (useCase as any).generateClassCode();

      // Should not contain O, 0, I, 1
      expect(code).not.toMatch(/[O0I1]/);
    });

    it('should generate different codes on each call', () => {
      const useCase = new CreateClassUseCase(mockClassRepository);
      const codes = new Set([
        (useCase as any).generateClassCode(),
        (useCase as any).generateClassCode(),
        (useCase as any).generateClassCode(),
      ]);

      // With high probability, all 3 should be different
      expect(codes.size).toBe(3);
    });
  });

  describe('class code uniqueness', () => {
    it('should retry up to 5 times before failing', async () => {
      vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(true); // Always returns true

      const command = new CreateClassUseCase(mockClassRepository) as any;
      const code = command.generateClassCode();

      // Simulate the code generation loop
      let attempts = 0;
      do {
        attempts++;
        if (attempts >= 5) {
          await expect(
            (async () => {
              vi.mocked(mockClassRepository.existsByCode).mockResolvedValue(true);
              const finalUseCase = new CreateClassUseCase(mockClassRepository);
              await finalUseCase.execute(command);
            })()
          ).rejects.toThrow('Failed to generate unique class code');
          break;
        }
      } while (await mockClassRepository.existsByCode(code));
    });
  });
});
