import { Type } from '@sinclair/typebox';

// --- Dashboard schemas ---

export const DashboardStatsResponseSchema = Type.Object(
  {
    totalDocuments: Type.Number(),
    totalExams: Type.Number(),
    documentsChange: Type.String(),
    examsChange: Type.String(),
    lastActivity: Type.Object({
      timestamp: Type.String(),
      description: Type.String(),
    }),
  },
  { description: 'Dashboard statistics' }
);

export const ClassExamDashboardItemSchema = Type.Object({
  id: Type.String(),
  examId: Type.String(),
  classId: Type.String(),
  examTitle: Type.Union([Type.String(), Type.Null()]),
  className: Type.Union([Type.String(), Type.Null()]),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  isPublished: Type.Boolean(),
  questionCount: Type.Union([Type.Number(), Type.Null()]),
  submittedCount: Type.Number(),
  createdAt: Type.String(),
});

export const RecentClassExamsResponseSchema = Type.Object(
  {
    classExams: Type.Array(ClassExamDashboardItemSchema),
  },
  { description: 'Recent class exams' }
);
