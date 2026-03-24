/**
 * Subscription Limits Configuration
 * Centralized constants for subscription tier limits
 */

/**
 * Exam Generation Limits
 */
export const EXAM_LIMITS = {
  /**
   * Maximum number of documents that can be used to generate an exam
   */
  MAX_DOCUMENTS_PER_EXAM: 10,

  /**
   * Maximum chunks to extract per document for balanced context
   */
  MAX_CHUNKS_PER_DOCUMENT: 20,

  /**
   * Minimum number of questions per exam
   */
  MIN_QUESTIONS_PER_EXAM: 5,

  /**
   * Maximum number of questions per exam (hardcoded in Free tier)
   */
  MAX_QUESTIONS_PER_EXAM: 50,
} as const;

/**
 * Free Tier Limits (per spec)
 */
export const FREE_TIER_LIMITS = {
  /**
   * Maximum number of classes a Free tier teacher can have
   * Soft limit - can archive old classes to create new ones
   */
  MAX_CLASSES: 1,

  /**
   * Maximum number of students a Free tier teacher can have
   * Hard limit - cannot add more without upgrading
   */
  MAX_STUDENTS: 30,

  /**
   * Maximum number of exams a Free tier teacher can create per month
   * Resets monthly on the 1st
   */
  MAX_EXAMS_PER_MONTH: 10,

  /**
   * Maximum number of questions per exam for Free tier
   * Hard limit
   */
  MAX_QUESTIONS_PER_EXAM: 50,
} as const;

/**
 * Usage Warning Thresholds
 * Percentage of limit at which to show warning/banner
 */
export const WARNING_THRESHOLD = 0.8; // 80%

/**
 * Hard Limit Threshold
 * Percentage when action is blocked
 */
export const HARD_LIMIT_THRESHOLD = 1.0; // 100%

/**
 * Usage warning thresholds for showing upgrade prompts
 */
export const UPGRADE_TRIGGERS = {
  /**
   * Show warning when students remaining equals or falls below this value
   */
  STUDENTS_WARNING_THRESHOLD: 5,

  /**
   * Show warning when exams remaining in month equals or falls below this value
   */
  EXAMS_WARNING_THRESHOLD: 2,

  /**
   * Show warning when class count equals this value (for Free tier)
   */
  CLASS_WARNING_THRESHOLD: 1,
} as const;

/**
 * Pro Tier Pricing
 */
export const PRICING = {
  PRO_MONTHLY: 9, // USD
  PRO_YEARLY: 90, // USD (17% discount)

  PRO_PLUS_MONTHLY: 19, // USD
  PRO_PLUS_YEARLY: 190, // USD (17% discount)
} as const;

/**
 * AI Models per Tier
 * Use the AIModel enum values directly
 */
export const AI_MODELS = {
  FREE: 'GPT_4O_MINI',
  PRO: 'GPT_4O',
  PRO_PLUS: 'GPT_4O',
  ENTERPRISE: 'GPT_4O',
} as const;

/**
 * Billing Cycles
 */
export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

/**
 * Error Messages
 */
export const LIMIT_ERRORS = {
  /**
   * Class limit error message
   */
  CLASS_LIMIT: {
    FREE: 'You have reached your Free tier limit of 1 class. Upgrade to Pro for unlimited classes.',
    PRO: 'You have reached your class limit. Upgrade to Pro Plus for unlimited classes.',
  },

  /**
   * Student limit error message
   */
  STUDENT_LIMIT: {
    FREE: 'You have reached your Free tier limit of 30 students. Upgrade to Pro for unlimited students.',
    PRO: 'You have reached your student limit. Upgrade to Pro Plus for unlimited students.',
  },

  /**
   * Exam limit error message
   */
  EXAM_LIMIT: {
    FREE: 'You have used your monthly exam limit. Wait until next month or upgrade to Pro for unlimited exams.',
    PRO: 'You have reached your monthly exam limit. Upgrade to Pro Plus for unlimited exams.',
  },

  /**
   * Question limit error message
   */
  QUESTION_LIMIT: {
    FREE: 'You have reached the question limit for this exam (50). Upgrade to Pro for unlimited questions.',
    PRO: 'You have reached the question limit for this exam. Upgrade to Pro Plus for unlimited questions.',
  },
} as const;

/**
 * Upgrade Messages (warning at 80% of limit)
 */
export const UPGRADE_MESSAGES = {
  /**
   * Student warning message
   */
  STUDENTS: {
    WARNING: (remaining: number): string =>
      `${remaining} student${remaining > 1 ? 's' : ''} remaining. Upgrade to Pro for unlimited students.`,
    BLOCKED: 'You have reached your student limit. Upgrade to Pro for unlimited students.',
  },

  /**
   * Class warning message
   */
  CLASSES: {
    WARNING: '1 class remaining. Upgrade to Pro for unlimited classes.',
    BLOCKED: 'You have reached your class limit. Upgrade to Pro for unlimited classes.',
  },

  /**
   * Exam warning message
   */
  EXAMS: {
    WARNING: (remaining: number): string =>
      `${remaining} exam${remaining > 1 ? 's' : ''} remaining this month. Upgrade to Pro for unlimited exams.`,
    BLOCKED: 'You have used your monthly exam limit. Upgrade to Pro for unlimited exams.',
  },
} as const;
