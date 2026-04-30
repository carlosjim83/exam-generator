import { Type } from '@sinclair/typebox';

// --- Protected routes schemas ---

export const ProfileResponseSchema = Type.Object(
  {
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    role: Type.String(),
    provider: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
  },
  { description: 'User profile' }
);

export const TeacherDashboardResponseSchema = Type.Object(
  {
    message: Type.String(),
    data: Type.Object({
      totalDocuments: Type.Number(),
      totalExams: Type.Number(),
    }),
  },
  { description: 'Teacher dashboard' }
);
