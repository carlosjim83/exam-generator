import { Type } from '@sinclair/typebox';

// --- Student schemas ---

export const ExamQuestionSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
  order: Type.Number(),
  type: Type.String(),
  options: Type.Array(Type.String()),
});

export const AssignmentSchema = Type.Object({
  id: Type.String(),
  examId: Type.String(),
  studentId: Type.String(),
  teacherId: Type.String(),
  status: Type.String(),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  startedAt: Type.Union([Type.String(), Type.Null()]),
  submittedAt: Type.Union([Type.String(), Type.Null()]),
  score: Type.Union([Type.Number(), Type.Null()]),
  feedback: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const ExamForStudentSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  questions: Type.Array(ExamQuestionSchema),
});

export const CreateAssignmentResponseSchema = Type.Object(
  {
    assignment: AssignmentSchema,
  },
  { description: 'Assignment created successfully' }
);

export const AssignedExamItemSchema = Type.Object({
  id: Type.String(),
  examId: Type.String(),
  examTitle: Type.String(),
  examDescription: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  questionCount: Type.Number(),
  maxScore: Type.Number(),
  score: Type.Union([Type.Number(), Type.Null()]),
  startedAt: Type.Union([Type.String(), Type.Null()]),
  submittedAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
});

export const AssignedExamsResponseSchema = Type.Object(
  {
    assignments: Type.Array(AssignedExamItemSchema),
    total: Type.Integer(),
  },
  { description: 'List of assigned exams' }
);

export const StartExamResponseSchema = Type.Object(
  {
    assignment: AssignmentSchema,
    exam: ExamForStudentSchema,
  },
  { description: 'Exam started/resumed successfully' }
);

export const SubmitExamResponseSchema = Type.Object(
  {
    assignment: AssignmentSchema,
  },
  { description: 'Exam submitted successfully' }
);

export const SaveAnswerResponseSchema = Type.Object(
  {
    saved: Type.Boolean(),
    questionId: Type.String(),
  },
  { description: 'Answer saved successfully' }
);

export const ExamResultQuestionSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
  order: Type.Number(),
  type: Type.String(),
  options: Type.Array(Type.String()),
});

export const StudentAnswerSchema = Type.Object({
  id: Type.String(),
  questionId: Type.String(),
  answer: Type.String(),
  isCorrect: Type.Union([Type.Boolean(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const ExamInResultSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  documentId: Type.String(),
  createdBy: Type.String(),
  createdAt: Type.String(),
  questions: Type.Array(ExamResultQuestionSchema),
});

export const ExamResultsResponseSchema = Type.Object(
  {
    assignment: AssignmentSchema,
    exam: ExamInResultSchema,
    answers: Type.Array(StudentAnswerSchema),
    score: Type.Number(),
    maxScore: Type.Number(),
    percentage: Type.Number(),
  },
  { description: 'Exam results' }
);
