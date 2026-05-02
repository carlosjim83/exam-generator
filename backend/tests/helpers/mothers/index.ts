/**
 * Database Object Mother Pattern Index
 *
 * Exports all DB Object Mothers for easy importing in E2E/integration tests
 *
 * Usage:
 * import { ApiUserMother, DbExamMother, DbExamAssignmentMother } from '@tests/helpers/mothers';
 *
 * const teacher = await ApiUserMother.teacher(app);
 * const { exam, questions } = await DbExamMother.complete({ userId: teacher.user.id });
 * const assignment = await DbExamAssignmentMother.pending({
 *   examId: exam.id,
 *   studentId: student.user.id
 * });
 */

export { DbDocumentMother } from '../db-mothers/DbDocumentMother.js';
export { DbExamMother } from '../db-mothers/DbExamMother.js';
export { ApiUserMother } from '../db-mothers/ApiUserMother.js';
export { DbExamAssignmentMother } from '../db-mothers/DbExamAssignmentMother.js';

export type { DocumentMotherOptions } from '../db-mothers/DbDocumentMother.js';
export type { ExamMotherOptions } from '../db-mothers/DbExamMother.js';
export type { UserMotherOptions, UserMotherResult } from '../db-mothers/ApiUserMother.js';
export type { ExamAssignmentMotherOptions } from '../db-mothers/DbExamAssignmentMother.js';
