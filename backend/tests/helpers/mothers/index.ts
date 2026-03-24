/**
 * Object Mother Pattern Index
 *
 * Exports all Object Mothers for easy importing
 *
 * Usage:
 * import { UserMother, ExamMother, ExamAssignmentMother } from '@tests/helpers/mothers';
 *
 * const teacher = await UserMother.teacher(app);
 * const { exam, questions } = await ExamMother.complete({ userId: teacher.user.id });
 * const assignment = await ExamAssignmentMother.pending({
 *   examId: exam.id,
 *   studentId: student.user.id
 * });
 */

export { DocumentMother } from './DocumentMother.js';
export { ExamMother } from './ExamMother.js';
export { UserMother } from './UserMother.js';
export { ExamAssignmentMother } from './ExamAssignmentMother.js';
export { SubscriptionMother } from './SubscriptionMother.js';
export { UsageMetricsMother } from './UsageMetricsMother.js';

export type { DocumentMotherOptions } from './DocumentMother.js';
export type { ExamMotherOptions } from './ExamMother.js';
export type { UserMotherOptions, UserMotherResult } from './UserMother.js';
export type { ExamAssignmentMotherOptions } from './ExamAssignmentMother.js';
