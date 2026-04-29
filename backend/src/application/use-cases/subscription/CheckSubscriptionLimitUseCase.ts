import {
  UPGRADE_TRIGGERS,
  UPGRADE_MESSAGES,
  WARNING_THRESHOLD,
} from '@config/subscription-limits.js';
import type { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import type { UsageMetrics } from '@domain/entities/UsageMetrics.js';

/**
 * Result type for subscription limit checks
 */
export interface LimitCheckResult {
  allowed: boolean;
  remaining: number | 'unlimited';
  limit: number | 'unlimited';
  severity: 'ok' | 'warning' | 'blocked';
  message?: string;
}

/**
 * Use case: Check subscription limits before performing an action
 */
export class CheckSubscriptionLimitUseCase {
  checkStudentLimit(limits: SubscriptionLimits, metrics: UsageMetrics): LimitCheckResult {
    const currentStudents = metrics.currentStudents;
    const maxStudents = limits.maxStudents;

    // Unlimited tiers (Pro and above)
    if (maxStudents === null) {
      return {
        allowed: true,
        remaining: 'unlimited',
        limit: 'unlimited',
        severity: 'ok',
      };
    }

    const remaining = maxStudents - currentStudents;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: maxStudents,
        severity: 'blocked',
        message: UPGRADE_MESSAGES.STUDENTS.BLOCKED,
      };
    }

    if (remaining <= UPGRADE_TRIGGERS.STUDENTS_WARNING_THRESHOLD) {
      return {
        allowed: true,
        remaining,
        limit: maxStudents,
        severity: 'warning',
        message: UPGRADE_MESSAGES.STUDENTS.WARNING(remaining),
      };
    }

    // Warning at 80% of limit
    if (currentStudents >= Math.floor(maxStudents * WARNING_THRESHOLD)) {
      const percentage = Math.floor((currentStudents / maxStudents) * 100);
      return {
        allowed: true,
        remaining,
        limit: maxStudents,
        severity: 'warning',
        message: UPGRADE_MESSAGES.STUDENTS.WARNING(remaining) + ` (${percentage}% used).`,
      };
    }

    return {
      allowed: true,
      remaining,
      limit: maxStudents,
      severity: 'ok',
    };
  }

  checkClassLimit(limits: SubscriptionLimits, metrics: UsageMetrics): LimitCheckResult {
    const currentClasses = metrics.currentClasses;
    const maxClasses = limits.maxClasses;

    // Unlimited tiers
    if (maxClasses === null) {
      return {
        allowed: true,
        remaining: 'unlimited',
        limit: 'unlimited',
        severity: 'ok',
      };
    }

    const remaining = maxClasses - currentClasses;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: maxClasses,
        severity: 'blocked',
        message: UPGRADE_MESSAGES.CLASSES.BLOCKED,
      };
    }

    if (remaining <= UPGRADE_TRIGGERS.CLASS_WARNING_THRESHOLD) {
      return {
        allowed: true,
        remaining,
        limit: maxClasses,
        severity: 'warning',
        message: UPGRADE_MESSAGES.CLASSES.WARNING,
      };
    }

    return {
      allowed: true,
      remaining,
      limit: maxClasses,
      severity: 'ok',
    };
  }

  checkExamLimit(limits: SubscriptionLimits, metrics: UsageMetrics): LimitCheckResult {
    const examsThisMonth = metrics.examsCreatedThisMonth;
    const maxExams = limits.maxExamsPerMonth;

    // Unlimited tiers
    if (maxExams === null) {
      return {
        allowed: true,
        remaining: 'unlimited',
        limit: 'unlimited',
        severity: 'ok',
      };
    }

    const remaining = maxExams - examsThisMonth;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: maxExams,
        severity: 'blocked',
        message: UPGRADE_MESSAGES.EXAMS.BLOCKED,
      };
    }

    if (remaining <= UPGRADE_TRIGGERS.EXAMS_WARNING_THRESHOLD) {
      return {
        allowed: true,
        remaining,
        limit: maxExams,
        severity: 'warning',
        message: UPGRADE_MESSAGES.EXAMS.WARNING(remaining),
      };
    }

    // Warning at 80% of limit
    if (examsThisMonth >= Math.floor(maxExams * WARNING_THRESHOLD)) {
      const percentage = Math.floor((examsThisMonth / maxExams) * 100);
      return {
        allowed: true,
        remaining,
        limit: maxExams,
        severity: 'warning',
        message: UPGRADE_MESSAGES.EXAMS.WARNING(remaining) + ` (${percentage}% used).`,
      };
    }

    return {
      allowed: true,
      remaining,
      limit: maxExams,
      severity: 'ok',
    };
  }

  checkQuestionLimit(limits: SubscriptionLimits, currentQuestions: number): LimitCheckResult {
    const maxQuestions = limits.maxQuestionsPerExam;

    // Unlimited tiers
    if (maxQuestions === null) {
      return {
        allowed: true,
        remaining: 'unlimited',
        limit: 'unlimited',
        severity: 'ok',
      };
    }

    const remaining = maxQuestions - currentQuestions;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: maxQuestions,
        severity: 'blocked',
        message: `You've reached the question limit for this exam (${maxQuestions}). Upgrade to Pro for unlimited questions.`,
      };
    }

    if (remaining <= 5) {
      return {
        allowed: true,
        remaining,
        limit: maxQuestions,
        severity: 'warning',
        message: `${remaining} question${remaining > 1 ? 's' : ''} remaining in this exam.`,
      };
    }

    return {
      allowed: true,
      remaining,
      limit: maxQuestions,
      severity: 'ok',
    };
  }

  /**
   * Get all current usage and upgrade suggestions
   */
  getUpgradeSuggestions(
    limits: SubscriptionLimits,
    metrics: UsageMetrics
  ): { type: string; severity: 'low' | 'medium' | 'high'; message: string }[] {
    const suggestions: { type: string; severity: 'low' | 'medium' | 'high'; message: string }[] =
      [];

    // Check student limit
    const studentResult = this.checkStudentLimit(limits, metrics);
    if (studentResult.severity === 'warning' && studentResult.message) {
      suggestions.push({
        type: 'students',
        severity: 'medium',
        message: studentResult.message,
      });
    }
    if (studentResult.severity === 'blocked' && studentResult.message) {
      suggestions.push({
        type: 'students',
        severity: 'high',
        message: studentResult.message,
      });
    }

    // Check exam limit
    const examResult = this.checkExamLimit(limits, metrics);
    if (examResult.severity === 'warning' && examResult.message) {
      suggestions.push({
        type: 'exams',
        severity: 'medium',
        message: examResult.message,
      });
    }
    if (examResult.severity === 'blocked' && examResult.message) {
      suggestions.push({
        type: 'exams',
        severity: 'high',
        message: examResult.message,
      });
    }

    // Check class limit
    const classResult = this.checkClassLimit(limits, metrics);
    if (classResult.severity === 'warning' && classResult.message) {
      suggestions.push({
        type: 'classes',
        severity: 'medium',
        message: classResult.message,
      });
    }
    if (classResult.severity === 'blocked' && classResult.message) {
      suggestions.push({
        type: 'classes',
        severity: 'high',
        message: classResult.message,
      });
    }

    return suggestions;
  }
}
