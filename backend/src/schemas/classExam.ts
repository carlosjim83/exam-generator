import { Type } from '@sinclair/typebox';

// --- Class Exam schemas ---

export const AssignExamResponseSchema = Type.Object(
  {
    classExamId: Type.String(),
    classId: Type.String(),
    examId: Type.String(),
    assignedStudents: Type.Number(),
    alreadyAssigned: Type.Number(),
  },
  { description: 'Exam assigned to class' }
);

export const ClassExamItemSchema = Type.Object({
  id: Type.String(),
  classId: Type.String(),
  examId: Type.String(),
  examTitle: Type.String(),
  questionCount: Type.Number(),
  availableAt: Type.Union([Type.String(), Type.Null()]),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  timeLimit: Type.Union([Type.Number(), Type.Null()]),
  isPublished: Type.Boolean(),
  maxAttempts: Type.Number(),
  showResultsImmediately: Type.Boolean(),
  startedCount: Type.Number(),
  submittedCount: Type.Number(),
  gradedCount: Type.Number(),
  assignedCount: Type.Number(),
  createdAt: Type.String(),
});

export const ClassExamListResponseSchema = Type.Object(
  {
    exams: Type.Array(ClassExamItemSchema),
  },
  { description: 'List of class exams' }
);

export const StudentClassExamItemSchema = Type.Object({
  id: Type.String(),
  classId: Type.String(),
  examId: Type.String(),
  examTitle: Type.String(),
  questionCount: Type.Number(),
  availableAt: Type.Union([Type.String(), Type.Null()]),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  timeLimit: Type.Union([Type.Number(), Type.Null()]),
  maxAttempts: Type.Number(),
  status: Type.String(),
  score: Type.Union([Type.Number(), Type.Null()]),
  attemptNumber: Type.Number(),
  remainingAttempts: Type.Number(),
  assignmentId: Type.Union([Type.String(), Type.Null()]),
});

export const StudentClassExamListResponseSchema = Type.Object(
  {
    exams: Type.Array(StudentClassExamItemSchema),
  },
  { description: 'Available exams for student' }
);

export const StudentExamItemSchema = Type.Object({
  id: Type.String(),
  classId: Type.String(),
  className: Type.String(),
  examId: Type.String(),
  examTitle: Type.String(),
  questionCount: Type.Number(),
  availableAt: Type.Union([Type.String(), Type.Null()]),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  timeLimit: Type.Union([Type.Number(), Type.Null()]),
  maxAttempts: Type.Number(),
  status: Type.String(),
  score: Type.Union([Type.Number(), Type.Null()]),
  attemptNumber: Type.Number(),
  remainingAttempts: Type.Number(),
});

export const StudentExamListResponseSchema = Type.Object(
  {
    exams: Type.Array(StudentExamItemSchema),
  },
  { description: 'Student exams' }
);

export const UpdateClassExamResponseSchema = Type.Object(
  {
    id: Type.String(),
    classId: Type.String(),
    examId: Type.String(),
    availableAt: Type.Union([Type.String(), Type.Null()]),
    dueDate: Type.Union([Type.String(), Type.Null()]),
    timeLimit: Type.Union([Type.Number(), Type.Null()]),
    maxAttempts: Type.Number(),
    showResultsImmediately: Type.Boolean(),
    isPublished: Type.Boolean(),
  },
  { description: 'Class exam settings updated' }
);

export const PublishClassExamResponseSchema = Type.Object(
  {
    id: Type.String(),
    classId: Type.String(),
    examId: Type.String(),
    isPublished: Type.Boolean(),
  },
  { description: 'Class exam published/unpublished' }
);

export const ExamResultItemSchema = Type.Object({
  studentId: Type.String(),
  studentName: Type.String(),
  studentEmail: Type.String(),
  status: Type.String(),
  startedAt: Type.Union([Type.String(), Type.Null()]),
  submittedAt: Type.Union([Type.String(), Type.Null()]),
  timeTaken: Type.Union([Type.Number(), Type.Null()]),
  score: Type.Union([Type.Number(), Type.Null()]),
  attemptNumber: Type.Number(),
});

export const ExamStatisticsSchema = Type.Object({
  totalStudents: Type.Number(),
  startedCount: Type.Number(),
  submittedCount: Type.Number(),
  gradedCount: Type.Number(),
  averageScore: Type.Union([Type.Number(), Type.Null()]),
  highestScore: Type.Union([Type.Number(), Type.Null()]),
  lowestScore: Type.Union([Type.Number(), Type.Null()]),
});

export const ClassExamResultsResponseSchema = Type.Object(
  {
    examTitle: Type.String(),
    classExamId: Type.String(),
    results: Type.Array(ExamResultItemSchema),
    statistics: ExamStatisticsSchema,
  },
  { description: 'Class exam results' }
);

export const StudentSubmissionQuestionSchema = Type.Object({
  questionId: Type.String(),
  questionText: Type.String(),
  questionType: Type.String(),
  options: Type.Union([Type.Array(Type.String()), Type.Null()]),
  correctAnswer: Type.String(),
  studentAnswer: Type.String(),
  isCorrect: Type.Union([Type.Boolean(), Type.Null()]),
  pointsEarned: Type.Number(),
  maxPoints: Type.Number(),
});

export const StudentSubmissionDetailResponseSchema = Type.Object(
  {
    student: Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String(),
    }),
    exam: Type.Object({
      id: Type.String(),
      title: Type.String(),
      description: Type.Union([Type.String(), Type.Null()]),
    }),
    assignment: Type.Object({
      id: Type.String(),
      status: Type.String(),
      startedAt: Type.Union([Type.String(), Type.Null()]),
      submittedAt: Type.Union([Type.String(), Type.Null()]),
      score: Type.Union([Type.Number(), Type.Null()]),
    }),
    questions: Type.Array(StudentSubmissionQuestionSchema),
    totalScore: Type.Number(),
    maxScore: Type.Number(),
    percentage: Type.Union([Type.Number(), Type.Null()]),
  },
  { description: 'Student submission detail' }
);
