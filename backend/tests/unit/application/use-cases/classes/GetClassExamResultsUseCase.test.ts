import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GetClassExamResultsUseCase,
  GetClassExamResultsInput,
} from '@application/use-cases/classes/GetClassExamResultsUseCase.js';
import { UserRole } from '@domain/entities/User.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassMother } from '@tests/helpers/factories/ClassMother.js';
import { ClassExamMother } from '@tests/helpers/factories/ClassExamMother.js';
import { ExamMother } from '@tests/helpers/factories/ExamMother.js';
import { ExamAssignmentMother } from '@tests/helpers/factories/ExamAssignmentMother.js';
import { UserMother } from '@tests/helpers/factories/UserMother.js';

// Mock repositories
const mockClassExamRepository = {
  findById: vi.fn(),
} satisfies Partial<IClassExamRepository> as IClassExamRepository;

const mockClassRepository = {
  findById: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

const mockExamRepository = {
  findById: vi.fn(),
} satisfies Partial<IExamRepository> as IExamRepository;

const mockAssignmentRepository = {
  findByClassExamId: vi.fn(),
} satisfies Partial<IExamAssignmentRepository> as IExamAssignmentRepository;

const mockUserRepository = {
  findById: vi.fn(),
} satisfies Partial<IUserRepository> as IUserRepository;

describe('GetClassExamResultsUseCase', () => {
  let useCase: GetClassExamResultsUseCase;
  let teacherId: UserId;
  let classId: ClassId;
  let classExamId: ClassExamId;
  let examId: ExamId;

  beforeEach(() => {
    useCase = new GetClassExamResultsUseCase(
      mockClassExamRepository,
      mockClassRepository,
      mockExamRepository,
      mockAssignmentRepository,
      mockUserRepository
    );
    teacherId = UserId.create('123e4567-e89b-42d3-a456-426614174000');
    classId = ClassId.create('223e4567-e89b-42d3-a456-426614174000');
    classExamId = ClassExamId.create('323e4567-e89b-42d3-a456-426614174000');
    examId = ExamId.create('423e4567-e89b-42d3-a456-426614174000');
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw error when class is not found', async () => {
      vi.mocked(mockClassRepository.findById).mockResolvedValue(null);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Class not found');
    });

    it('should throw error when teacher does not own the class', async () => {
      const otherTeacherId = UserId.create('999e4567-e89b-42d3-a456-426614174000');
      const classEntity = ClassMother.withTeacher(otherTeacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      await expect(useCase.execute(input)).rejects.toThrow('You are not the teacher of this class');
    });

    it('should throw error when class exam is not found', async () => {
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(null);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Class exam not found');
    });

    it('should throw error when class exam does not belong to the class', async () => {
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });
      const otherClassId = ClassId.create('999e4567-e89b-42d3-a456-426614174000');
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: otherClassId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Class exam does not belong to this class'
      );
    });

    it('should throw error when exam is not found', async () => {
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(null);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Exam not found');
    });

    it('should return results with student info populated from IUserRepository', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        timeLimit: 60,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        description: 'Algebra basics',
        questionCount: 10,
      });

      // Setup student assignments
      const student1Id = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const student2Id = UserId.create('222e4567-e89b-42d3-a456-426614174000');

      const assignment1 = ExamAssignmentMother.graded({
        id: 'assign-1',
        examId: examId.value,
        studentId: student1Id.value,
        teacherId: teacherId.value,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        submittedAt: new Date('2025-01-01T10:45:00Z'),
        score: 85,
        feedback: null,
      });

      const assignment2 = ExamAssignmentMother.submitted({
        id: 'assign-2',
        examId: examId.value,
        studentId: student2Id.value,
        teacherId: teacherId.value,
        startedAt: new Date('2025-01-01T11:00:00Z'),
        submittedAt: new Date('2025-01-01T11:30:00Z'),
        score: 92,
      });

      // Setup students (OAuth users don't need password)
      const student1 = UserMother.oauth({
        id: student1Id.value,
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        providerId: 'google-123',
      });

      const student2 = UserMother.oauth({
        id: student2Id.value,
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
        providerId: 'google-456',
      });

      // Mock repository calls
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue([
        assignment1,
        assignment2,
      ]);
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(student1)
        .mockResolvedValueOnce(student2);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify student info is populated
      expect(result.results).toHaveLength(2);
      expect(result.results[0].studentId).toBe(student1Id.value);
      expect(result.results[0].studentName).toBe('John Doe');
      expect(result.results[0].studentEmail).toBe('john.doe@example.com');
      expect(result.results[1].studentId).toBe(student2Id.value);
      expect(result.results[1].studentName).toBe('Jane Smith');
      expect(result.results[1].studentEmail).toBe('jane.smith@example.com');

      // Verify IUserRepository was called for each student
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findById).toHaveBeenNthCalledWith(1, student1Id);
      expect(mockUserRepository.findById).toHaveBeenNthCalledWith(2, student2Id);
    });

    it('should handle missing student gracefully', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        questionCount: 5,
      });

      // Setup assignment with non-existent student
      const studentId = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const assignment = ExamAssignmentMother.pending({
        id: 'assign-1',
        examId: examId.value,
        studentId: studentId.value,
        teacherId: teacherId.value,
      });

      // Mock repository calls - student not found
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue([assignment]);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify student info shows as unknown when user not found
      expect(result.results).toHaveLength(1);
      expect(result.results[0].studentId).toBe(studentId.value);
      expect(result.results[0].studentName).toBe('Unknown Student');
      expect(result.results[0].studentEmail).toBe('');
    });

    it('should calculate statistics correctly', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        questionCount: 5,
      });

      // Setup assignments with various statuses
      const student1Id = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const student2Id = UserId.create('222e4567-e89b-42d3-a456-426614174000');
      const student3Id = UserId.create('333e4567-e89b-42d3-a456-426614174000');
      const student4Id = UserId.create('444e4567-e89b-42d3-a456-426614174000');

      const assignments = [
        // PENDING - not started
        ExamAssignmentMother.pending({
          id: 'assign-1',
          examId: examId.value,
          studentId: student1Id.value,
          teacherId: teacherId.value,
        }),
        // IN_PROGRESS - started but not submitted
        ExamAssignmentMother.inProgress({
          id: 'assign-2',
          examId: examId.value,
          studentId: student2Id.value,
          teacherId: teacherId.value,
          startedAt: new Date('2025-01-01T10:00:00Z'),
        }),
        // SUBMITTED - with score
        ExamAssignmentMother.submitted({
          id: 'assign-3',
          examId: examId.value,
          studentId: student3Id.value,
          teacherId: teacherId.value,
          startedAt: new Date('2025-01-01T11:00:00Z'),
          submittedAt: new Date('2025-01-01T11:30:00Z'),
          score: 75,
        }),
        // GRADED - with score
        ExamAssignmentMother.graded({
          id: 'assign-4',
          examId: examId.value,
          studentId: student4Id.value,
          teacherId: teacherId.value,
          startedAt: new Date('2025-01-01T12:00:00Z'),
          submittedAt: new Date('2025-01-01T12:45:00Z'),
          score: 95,
          feedback: 'Great job!',
        }),
      ];

      // Mock students
      const mockStudent = (id: UserId) =>
        UserMother.oauth({
          id: id.value,
          email: `student${id.value.slice(0, 3)}@example.com`,
          firstName: 'Student',
          lastName: id.value.slice(0, 3),
          role: UserRole.STUDENT,
          providerId: 'google-' + id.value.slice(0, 3),
        });

      // Mock repository calls
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue(assignments);
      vi.mocked(mockUserRepository.findById).mockImplementation((id) =>
        Promise.resolve(mockStudent(id))
      );

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify statistics
      expect(result.statistics.totalStudents).toBe(4);
      expect(result.statistics.startedCount).toBe(3); // IN_PROGRESS + SUBMITTED + GRADED
      expect(result.statistics.submittedCount).toBe(2); // SUBMITTED + GRADED
      expect(result.statistics.gradedCount).toBe(1); // GRADED only
      expect(result.statistics.averageScore).toBe(85); // (75 + 95) / 2
      expect(result.statistics.highestScore).toBe(95);
      expect(result.statistics.lowestScore).toBe(75);
    });

    it('should return null statistics when no scores are available', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        questionCount: 5,
      });

      // Setup assignments without scores
      const studentId = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const assignment = ExamAssignmentMother.pending({
        id: 'assign-1',
        examId: examId.value,
        studentId: studentId.value,
        teacherId: teacherId.value,
      });

      const student = UserMother.oauth({
        id: studentId.value,
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
        role: UserRole.STUDENT,
        providerId: 'google-test',
      });

      // Mock repository calls
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue([assignment]);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(student);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify statistics are null when no scores
      expect(result.statistics.averageScore).toBeNull();
      expect(result.statistics.highestScore).toBeNull();
      expect(result.statistics.lowestScore).toBeNull();
    });

    it('should calculate time taken correctly', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        questionCount: 5,
      });

      // Setup assignment
      const studentId = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const startedAt = new Date('2025-01-01T10:00:00Z');
      const submittedAt = new Date('2025-01-01T10:30:30Z'); // 30 min 30 sec

      const assignment = ExamAssignmentMother.submitted({
        id: 'assign-1',
        examId: examId.value,
        studentId: studentId.value,
        teacherId: teacherId.value,
        startedAt: startedAt,
        submittedAt: submittedAt,
        score: 85,
      });

      const student = UserMother.oauth({
        id: studentId.value,
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
        role: UserRole.STUDENT,
        providerId: 'google-test',
      });

      // Mock repository calls
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue([assignment]);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(student);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify time taken is calculated (30 min 30 sec = 1830 seconds)
      expect(result.results[0].timeTaken).toBe(1830);
    });

    it('should return null timeTaken when not submitted', async () => {
      // Setup class
      const classEntity = ClassMother.withTeacher(teacherId.value, {
        id: classId.value,
        name: 'Test Class',
        code: 'ABC123',
      });

      // Setup class exam
      const classExam = ClassExamMother.create({
        id: classExamId.value,
        classId: classId.value,
        examId: examId.value,
        teacherId: teacherId.value,
        isPublished: true,
      });

      // Setup exam
      const exam = ExamMother.create({
        id: examId.value,
        userId: teacherId.value,
        title: 'Math Test',
        questionCount: 5,
      });

      // Setup assignment - started but not submitted
      const studentId = UserId.create('111e4567-e89b-42d3-a456-426614174000');
      const assignment = ExamAssignmentMother.inProgress({
        id: 'assign-1',
        examId: examId.value,
        studentId: studentId.value,
        teacherId: teacherId.value,
        startedAt: new Date('2025-01-01T10:00:00Z'),
      });

      const student = UserMother.oauth({
        id: studentId.value,
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
        role: UserRole.STUDENT,
        providerId: 'google-test',
      });

      // Mock repository calls
      vi.mocked(mockClassRepository.findById).mockResolvedValue(classEntity);
      vi.mocked(mockClassExamRepository.findById).mockResolvedValue(classExam);
      vi.mocked(mockExamRepository.findById).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepository.findByClassExamId).mockResolvedValue([assignment]);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(student);

      const input: GetClassExamResultsInput = {
        classExamId: classExamId.value,
        classId: classId.value,
        teacherId: teacherId.value,
      };

      const result = await useCase.execute(input);

      // Verify timeTaken is null when not submitted
      expect(result.results[0].timeTaken).toBeNull();
    });
  });
});
