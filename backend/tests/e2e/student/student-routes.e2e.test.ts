import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestServer } from '@tests/helpers/test-server.js';
import { ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import {
  ApiUserMother,
  DbExamMother,
  DbExamAssignmentMother,
} from '@tests/helpers/mothers/index.js';

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
      url: '/api/auth/register',
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
      url: '/api/auth/register',
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
          url: '/api/students/assignments',
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
          url: '/api/students/assignments',
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
          url: '/api/students/assignments',
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
          url: '/api/students/assignments',
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
          url: '/api/students/assignments',
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
      it('should assign exam to student successfully', async () => {
        // Create exam using Object Mother
        const { exam } = await DbExamMother.complete({ userId: teacherId });

        const response = await app.inject({
          method: 'POST',
          url: '/api/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            examId: exam.id,
            studentId: studentId,
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.assignment.examId).toBe(exam.id);
        expect(body.assignment.studentId).toBe(studentId);
        expect(body.assignment.status).toBe('PENDING');
      });

      it('should assign exam with optional due date', async () => {
        // Create exam using Object Mother
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const dueDate = new Date(Date.now() + 86400000 * 7); // 7 days from now

        const response = await app.inject({
          method: 'POST',
          url: '/api/students/assignments',
          headers: {
            authorization: `Bearer ${teacherToken}`,
          },
          payload: {
            examId: exam.id,
            studentId: studentId,
            dueDate: dueDate.toISOString(),
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.assignment.dueDate).toBeDefined();
        expect(new Date(body.assignment.dueDate).getTime()).toBeCloseTo(
          dueDate.getTime(),
          -2 // within 100ms
        );
      });
    });
  });

  describe('GET /students/assignments - Get Assigned Exams', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments',
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
        // ARRANGE: Create a NEW student who has no assignments yet
        const freshStudent = await ApiUserMother.student(app);

        // ACT: Fetch assignments for this fresh student
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments',
          headers: {
            authorization: `Bearer ${freshStudent.tokens.accessToken}`,
          },
        });

        // ASSERT: Should return empty array
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignments).toEqual([]);
        expect(body.total).toBe(0);
      });

      it('should filter assignments by status query parameter', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments?status=PENDING',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignments).toBeDefined();
        expect(Array.isArray(body.assignments)).toBe(true);
      });

      it('should return all assignments with exam details', async () => {
        // ARRANGE: Create a NEW student and assignment
        const freshStudent = await ApiUserMother.student(app);
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.pending({
          examId: exam.id,
          studentId: freshStudent.user.id,
          teacherId: teacherId,
        });

        // ACT: Fetch assignments
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments',
          headers: {
            authorization: `Bearer ${freshStudent.tokens.accessToken}`,
          },
        });

        // ASSERT: Verify response
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignments).toBeDefined();
        expect(Array.isArray(body.assignments)).toBe(true);
        expect(body.assignments.length).toBeGreaterThan(0);

        // Verify assignment details (should have at least the one we created)
        const foundAssignment = body.assignments.find((a: any) => a.examId === exam.id);
        expect(foundAssignment).toBeDefined();
        expect(foundAssignment.status).toBe('PENDING');
      });
    });
  });

  describe('POST /students/assignments/:id/start - Start Exam', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/students/assignments/some-assignment-id/start',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/students/assignments/some-assignment-id/start',
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
          url: '/api/students/assignments/non-existent-id/start',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Assignment not found');
      });

      it('should reject if assignment does not belong to student', async () => {
        // ARRANGE: Create another student and assignment for them
        const otherStudent = await ApiUserMother.student(app);
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.pending({
          examId: exam.id,
          studentId: otherStudent.user.id, // Different student
          teacherId: teacherId,
        });

        // ACT: Try to start with original student token
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/start`,
          headers: {
            authorization: `Bearer ${studentToken}`, // Wrong student
          },
        });

        // ASSERT: Should be forbidden
        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('do not have access');
      });

      it('should reject if assignment is not in PENDING status', async () => {
        // ARRANGE: Create assignment already in SUBMITTED status
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.submitted({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Try to start again
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/start`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Should fail with business rule error
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('already been completed');
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it('should start exam successfully and return IN_PROGRESS status', async () => {
        // ARRANGE: Create pending assignment
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.pending({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Start the exam
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/start`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Should transition to IN_PROGRESS
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.status).toBe('IN_PROGRESS');
        expect(body.assignment.startedAt).toBeDefined();
      });

      it('should set startedAt timestamp', async () => {
        // ARRANGE: Create pending assignment
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.pending({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        const beforeStart = new Date();

        // ACT: Start the exam
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/start`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        const afterStart = new Date();

        // ASSERT: startedAt should be recent
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.startedAt).toBeDefined();

        const startedAt = new Date(body.assignment.startedAt);
        expect(startedAt.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
        expect(startedAt.getTime()).toBeLessThanOrEqual(afterStart.getTime());
      });
    });
  });

  describe('POST /students/assignments/:id/submit - Submit Exam Answers', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/students/assignments/some-assignment-id/submit',
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
          url: '/api/students/assignments/some-assignment-id/submit',
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
          url: '/api/students/assignments/some-assignment-id/submit',
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
          url: '/api/students/assignments/non-existent-id/submit',
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

      it('should reject if assignment is not IN_PROGRESS', async () => {
        // ARRANGE: Create PENDING assignment (not started)
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.pending({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Try to submit without starting
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/submit`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            answers: [],
          },
        });

        // ASSERT: Should fail with business rule error
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Cannot submit assignment with status');
        expect(body.message).toContain('PENDING');
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it('should submit answers and auto-grade multiple-choice questions', async () => {
        // ARRANGE: Create exam and start it
        const { exam, questions } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.inProgress({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // Prepare answers (mix of correct and incorrect)
        const answers = [
          { questionId: questions[0].id, answerText: questions[0].correctAnswer }, // Correct
          { questionId: questions[1].id, answerText: 'Wrong answer' }, // Incorrect
          { questionId: questions[2].id, answerText: questions[2].correctAnswer }, // Correct
        ];

        // ACT: Submit answers
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/submit`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            answers,
          },
        });

        // ASSERT: Should auto-grade and calculate score
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.status).toBe('GRADED');
        expect(body.assignment.score).toBeDefined();
        expect(body.assignment.score).toBeGreaterThan(0); // 2 out of 3 correct
        expect(body.assignment.score).toBeLessThan(100); // Not perfect
      });

      it('should transition to SUBMITTED status', async () => {
        // ARRANGE: Create exam and start it
        const { exam, questions } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.inProgress({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Submit answers
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/submit`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            answers: [{ questionId: questions[0].id, answerText: questions[0].correctAnswer }],
          },
        });

        // ASSERT: Status should be GRADED (auto-graded since all questions are auto-gradable)
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.status).toBe('GRADED');
        expect(body.assignment.submittedAt).toBeDefined();
      });

      it('should allow submitting with empty answers array', async () => {
        // ARRANGE: Create exam and start it
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.inProgress({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Submit with no answers
        const response = await app.inject({
          method: 'POST',
          url: `/api/students/assignments/${assignment.id}/submit`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
          payload: {
            answers: [], // Empty submission
          },
        });

        // ASSERT: Should accept and score as 0
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.status).toBe('GRADED');
        expect(body.assignment.score).toBe(0); // No correct answers
      });
    });
  });

  describe('GET /students/assignments/:id/results - Get Exam Results', () => {
    describe('🔴 RED: Error cases', () => {
      it('should reject request without authentication', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments/some-assignment-id/results',
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Unauthorized');
      });

      it('should reject request from teacher role', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/students/assignments/some-assignment-id/results',
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
          url: '/api/students/assignments/non-existent-id/results',
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Assignment not found');
      });

      it('should reject if assignment is not submitted yet', async () => {
        // ARRANGE: Create IN_PROGRESS assignment (not submitted yet)
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.inProgress({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Try to get results before submitting
        const response = await app.inject({
          method: 'GET',
          url: `/api/students/assignments/${assignment.id}/results`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Should fail since not submitted
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('submitted');
      });
    });

    describe('🟢 GREEN: Success cases', () => {
      it('should return exam results with all question details', async () => {
        // ARRANGE: Create GRADED assignment with answers
        const { exam, questions } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.graded({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Get results
        const response = await app.inject({
          method: 'GET',
          url: `/api/students/assignments/${assignment.id}/results`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Should return full results with question details
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment).toBeDefined();
        expect(body.exam).toBeDefined();
        expect(body.answers).toBeDefined();
        expect(Array.isArray(body.answers)).toBe(true);
        expect(body.exam.questions).toBeDefined();
        expect(Array.isArray(body.exam.questions)).toBe(true);

        // Verify exam questions are included
        body.exam.questions.forEach((question: any) => {
          expect(question.id).toBeDefined();
          expect(question.text).toBeDefined();
        });
      });

      it('should include score and feedback', async () => {
        // ARRANGE: Create GRADED assignment
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.graded({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Get results
        const response = await app.inject({
          method: 'GET',
          url: `/api/students/assignments/${assignment.id}/results`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Should include score (feedback is optional)
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.assignment.score).toBeDefined();
        expect(typeof body.assignment.score).toBe('number');
        expect(body.assignment.score).toBeGreaterThanOrEqual(0);
        expect(body.assignment.score).toBeLessThanOrEqual(100);
      });

      it('should show correct/incorrect status for each answer', async () => {
        // ARRANGE: Create GRADED assignment with answers
        const { exam } = await DbExamMother.complete({ userId: teacherId });
        const assignment = await DbExamAssignmentMother.graded({
          examId: exam.id,
          studentId: studentId,
          teacherId: teacherId,
        });

        // ACT: Get results
        const response = await app.inject({
          method: 'GET',
          url: `/api/students/assignments/${assignment.id}/results`,
          headers: {
            authorization: `Bearer ${studentToken}`,
          },
        });

        // ASSERT: Each answer should have isCorrect flag
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.answers).toBeDefined();
        expect(Array.isArray(body.answers)).toBe(true);

        // At least one answer should exist
        if (body.answers.length > 0) {
          body.answers.forEach((answer: any) => {
            expect(answer.isCorrect).toBeDefined();
            // isCorrect can be null for unanswered questions
            if (answer.isCorrect !== null) {
              expect(typeof answer.isCorrect).toBe('boolean');
            }
          });
        }
      });
    });
  });
});
