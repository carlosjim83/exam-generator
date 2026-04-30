import { Type } from '@sinclair/typebox';

// --- Exam schemas ---

export const QuestionSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  difficulty: Type.String(),
  questionText: Type.String(),
  options: Type.Array(Type.String()),
  correctAnswer: Type.String(),
  explanation: Type.String(),
  points: Type.Integer(),
});

export const QuestionWithOrderSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  difficulty: Type.String(),
  questionText: Type.String(),
  options: Type.Array(Type.String()),
  correctAnswer: Type.String(),
  explanation: Type.String(),
  points: Type.Integer(),
  orderIndex: Type.Integer(),
});

export const ExamSummarySchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  questionCount: Type.Integer(),
  documentCount: Type.Integer(),
  createdAt: Type.String(),
});

export const ExamDetailSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  questionCount: Type.Integer(),
  documentCount: Type.Integer(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const GenerateExamResponseSchema = Type.Object(
  {
    exam: ExamSummarySchema,
    questions: Type.Array(QuestionSchema),
    generationTimeMs: Type.Integer(),
  },
  { description: 'Exam generated successfully' }
);

export const ListExamsResponseSchema = Type.Object(
  {
    exams: Type.Array(ExamSummarySchema),
    total: Type.Integer(),
  },
  { description: 'List of exams' }
);

export const GetExamResponseSchema = Type.Object(
  {
    exam: ExamDetailSchema,
    questions: Type.Array(QuestionWithOrderSchema),
  },
  { description: 'Exam details' }
);

export const DeleteExamResponseSchema = Type.Object(
  {
    success: Type.Boolean(),
    message: Type.String(),
  },
  { description: 'Exam deleted successfully' }
);
