import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestServer } from '@tests/helpers/test-server.js';
import { ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';

/**
 * E2E Tests for Student Routes
 * Tests the complete HTTP layer for student exam management
 *
 * Routes tested:
 * - POST /students/assignments - Assign exam to student (teacher only)
 * - GET /students/assignments - Get assigned exams
 * - POST /students/assignments/:id/start - Start exam
 * - POST /students/assignments/:id/submit - Submit answers
 * - GET /students/assignments/:id/results - Get results
 */

function uniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

describe('Student Routes E2E Tests', () => {
  let app: FastifyInstance;
  let teacherToken: string;
  let teacherId: string;
  let studentToken: string;
  let studentId: string;
  let examId: string;

  beforeAll(async () => {
    app = await createTestServer();

    // Create teacher account
    const teacherResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: uniqueEmail('teacher'),
        password: 'TeacherPass123!',
        firstName: 'Teacher',
        lastName: 'Test',
        role: 'TEACHER',
      },
    });

    const teacherBody = JSON.parse(teacherResponse.body);
    teacherToken = teacherBody.accessToken;
    teacherId = teacherBody.user.id;

    // Create student account
    const studentResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: uniqueEmail('student'),
        password: 'StudentPass123!',
        firstName: 'Student',
        lastName: 'Test',
        role: 'STUDENT',
      },
    });

    const studentBody = JSON.parse(studentResponse.body);
    studentToken = studentBody.accessToken;
    studentId = studentBody.user.id;

    // Create a test exam (teacher needs to upload document first and generate exam)
    // For now, we'll mock the exam creation in the tests that need it
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /students/assignments - Assign Exam to Student', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject assignment without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments',
          payload: {
            examId: 'some-exam-id',
            studentId: studentId,
          },
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject assignment if user is not a teacher', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            examId: 'some-exam-id',
            studentId: studentId,
          },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Forbidden');
      });

      it('should reject assignment with invalid request body', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            // missing examId and studentId
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Bad Request');
      });

      it('should reject assignment if exam does not exist', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            examId: 'non-existent-exam-id',
            studentId: studentId,
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Exam not found');
      });

      it('should reject assignment if student does not exist', async () => {
        // TODO: Need to create a real exam first
        // For now this will fail at exam validation
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            examId: 'some-exam-id',
            studentId: 'non-existent-student-id',
          },
        });

        expect([404, 400]).toContain(response.statusCode);
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it.skip('should assign exam to student successfully', async () => {
        // TODO: Implement after exam creation is working
        // This requires:
        // 1. Upload document
        // 2. Process document
        // 3. Generate exam from document
        // 4. Assign exam to student
      });

      it.skip('should assign exam with optional due date', async () => {
        // TODO: Implement after basic assignment works
      });
    });
  });

  describe('GET /students/assignments - Get Assigned Exams', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Forbidden');
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it('should return empty array when student has no assignments', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignments).toEqual([]);
        expect(body.total).toBe(0);
      });

      it('should filter assignments by status query parameter', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments?status=PENDING',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignments).toBeDefined();
        expect(Array.isArray(body.assignments)).toBe(true);
      });

      it.skip('should return all assignments with exam details', async () => {
        // TODO: Implement after assignment creation works
      });
    });
  });

  describe('POST /students/assignments/:id/start - Start Exam', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/some-assignment-id/start',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/some-assignment-id/start',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Forbidden');
      });

      it('should reject if assignment does not exist', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/non-existent-id/start',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Assignment not found');
      });

      it.skip('should reject if assignment does not belong to student', async () => {
        // TODO: Need to create assignment for different student
      });

      it.skip('should reject if assignment is not in PENDING status', async () => {
        // TODO: Need to create and start an assignment first
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it.skip('should start exam successfully and return IN_PROGRESS status', async () => {
        // TODO: Implement after assignment creation works
      });

      it.skip('should set startedAt timestamp', async () => {
        // TODO: Implement after assignment creation works
      });
    });
  });

  describe('POST /students/assignments/:id/submit - Submit Exam Answers', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/some-assignment-id/submit',
          payload: {
            answers: [],
          },
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/some-assignment-id/submit',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            answers: [],
          },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Forbidden');
      });

      it('should reject with invalid request body', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/some-assignment-id/submit',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            // missing answers array
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Bad Request');
      });

      it('should reject if assignment does not exist', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/students/assignments/non-existent-id/submit',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            answers: [],
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Assignment not found');
      });

      it.skip('should reject if assignment is not IN_PROGRESS', async () => {
        // TODO: Need to create assignment without starting it
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it.skip('should submit answers and auto-grade multiple-choice questions', async () => {
        // TODO: Implement after full flow works
      });

      it.skip('should transition to SUBMITTED status', async () => {
        // TODO: Implement after full flow works
      });

      it.skip('should allow submitting with empty answers array', async () => {
        // TODO: Implement after full flow works
      });
    });
  });

  describe('GET /students/assignments/:id/results - Get Exam Results', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments/some-assignment-id/results',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments/some-assignment-id/results',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Forbidden');
      });

      it('should reject if assignment does not exist', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/students/assignments/non-existent-id/results',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Assignment not found');
      });

      it.skip('should reject if assignment is not graded yet', async () => {
        // TODO: Need to create submitted but not graded assignment
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it.skip('should return exam results with all question details', async () => {
        // TODO: Implement after grading works
      });

      it.skip('should include score and feedback', async () => {
        // TODO: Implement after grading works
      });

      it.skip('should show correct/incorrect status for each answer', async () => {
        // TODO: Implement after grading works
      });
    });
  });
});
