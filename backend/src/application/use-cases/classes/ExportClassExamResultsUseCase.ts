/**
 * ExportClassExamResultsUseCase
 *
 * Exports exam results to CSV format for teachers to download.
 */

import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ExportClassExamResultsInput {
  classExamId: string;
  classId: string;
  teacherId: string;
  format?: 'CSV' | 'JSON';
}

export interface StudentResultRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  timeTakenMinutes: number | null;
  score: number | null;
  percentage: number | null;
}

export class ExportClassExamResultsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository,
    private readonly examAssignmentRepository: IExamAssignmentRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: ExportClassExamResultsInput): Promise<{
    filename: string;
    content: string;
    contentType: string;
  }> {
    const classExamId = ClassExamId.create(input.classExamId);
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);
    const format = input.format ?? 'CSV';

    // Verify class exists and teacher owns it
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (!classEntity.teacherId.equals(teacherId)) {
      throw new Error('You are not the teacher of this class');
    }

    // Get the class exam
    const classExam = await this.classExamRepository.findById(classExamId);
    if (!classExam) {
      throw new Error('Class exam not found');
    }

    // Verify class exam belongs to this class
    if (!classExam.classId.equals(classId)) {
      throw new Error('Class exam does not belong to this class');
    }

    // Get all assignments for this class exam
    const assignments = await this.examAssignmentRepository.findByClassExamId(classExamId);

    // Build results with student info
    const results: StudentResultRow[] = [];
    for (const assignment of assignments) {
      const student = await this.userRepository.findById(assignment.studentId);
      if (!student) continue;

      // Calculate time taken from startedAt and submittedAt
      let timeTakenMinutes: number | null = null;
      if (assignment.startedAt && assignment.submittedAt) {
        const timeTakenMs = assignment.submittedAt.getTime() - assignment.startedAt.getTime();
        timeTakenMinutes = Math.round(timeTakenMs / (1000 * 60));
      }

      results.push({
        studentId: student.id.toString(),
        studentName: student.fullName,
        studentEmail: student.email.value,
        status: assignment.status,
        startedAt: assignment.startedAt?.toISOString() ?? null,
        submittedAt: assignment.submittedAt?.toISOString() ?? null,
        timeTakenMinutes,
        score: assignment.score,
        percentage: assignment.score,
      });
    }

    // Sort by student name
    results.sort((a, b) => a.studentName.localeCompare(b.studentName));

    if (format === 'CSV') {
      const csv = this.generateCSV(results);
      return {
        filename: `exam-results-${classExamId.value.slice(0, 8)}.csv`,
        content: csv,
        contentType: 'text/csv',
      };
    }

    // JSON format
    return {
      filename: `exam-results-${classExamId.value.slice(0, 8)}.json`,
      content: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    };
  }

  private generateCSV(results: StudentResultRow[]): string {
    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Status',
      'Started At',
      'Submitted At',
      'Time Taken (min)',
      'Score (%)',
    ];

    const rows = results.map((r) => [
      r.studentId,
      this.escapeCSV(r.studentName),
      r.studentEmail,
      r.status,
      r.startedAt ? new Date(r.startedAt).toLocaleString() : '',
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
      r.timeTakenMinutes?.toString() ?? '',
      r.score?.toString() ?? '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csvContent;
  }

  private escapeCSV(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes
    if (/[\",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
