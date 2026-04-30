import { Type } from '@sinclair/typebox';

// --- Class schemas ---

export const ClassSummarySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  code: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  color: Type.Union([Type.String(), Type.Null()]),
  studentCount: Type.Number(),
  documentCount: Type.Number(),
  examCount: Type.Number(),
  createdAt: Type.String(),
});

export const ClassListResponseSchema = Type.Object(
  {
    classes: Type.Array(ClassSummarySchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
  },
  { description: 'List of classes' }
);

export const ClassDetailSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  code: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  color: Type.Union([Type.String(), Type.Null()]),
  teacherId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  teacherName: Type.String(),
  studentCount: Type.Number(),
});

export const ClassDetailResponseSchema = Type.Object(
  {
    class: Type.Object({
      id: Type.String(),
      name: Type.String(),
      code: Type.String(),
      description: Type.Union([Type.String(), Type.Null()]),
      color: Type.Union([Type.String(), Type.Null()]),
    }),
    teacherName: Type.String(),
  },
  { description: 'Class by code' }
);

export const ClassCreateResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    code: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    color: Type.Union([Type.String(), Type.Null()]),
    teacherId: Type.String(),
    createdAt: Type.String(),
  },
  { description: 'Class created successfully' }
);

export const StudentListItemSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  joinedAt: Type.String(),
  isActive: Type.Boolean(),
});

export const StudentListResponseSchema = Type.Object(
  {
    students: Type.Array(StudentListItemSchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
  },
  { description: 'List of students in class' }
);

export const JoinClassResponseSchema = Type.Object(
  {
    classId: Type.String(),
    joinedAt: Type.String(),
  },
  { description: 'Student joined class' }
);

export const InvitationItemSchema = Type.Object({
  email: Type.String(),
  status: Type.String(),
  expiresAt: Type.String(),
});

export const InvitationListItemSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  status: Type.String(),
  expiresAt: Type.String(),
  acceptedAt: Type.Union([Type.String(), Type.Null()]),
});

export const CreateInvitationsResponseSchema = Type.Object(
  {
    invitations: Type.Array(InvitationItemSchema),
  },
  { description: 'Invitations created' }
);

export const GetInvitationsResponseSchema = Type.Object(
  {
    invitations: Type.Array(InvitationListItemSchema),
  },
  { description: 'List of invitations' }
);

export const ImportCSVResponseSchema = Type.Object(
  {
    imported: Type.Integer(),
    failed: Type.Integer(),
    errors: Type.Array(Type.String()),
  },
  { description: 'CSV import result' }
);

export const ClassDocumentItemSchema = Type.Object({
  id: Type.String(),
  documentId: Type.String(),
  title: Type.String(),
  filename: Type.String(),
  fileSize: Type.Number(),
  mimeType: Type.String(),
  isVisible: Type.Boolean(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
  orderIndex: Type.Number(),
});

export const ClassDocumentItemTeacherSchema = Type.Object({
  id: Type.String(),
  documentId: Type.String(),
  title: Type.String(),
  filename: Type.String(),
  fileSize: Type.Number(),
  mimeType: Type.String(),
  isVisible: Type.Boolean(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
  orderIndex: Type.Number(),
  sharedAt: Type.String(),
});

export const ClassDocumentsResponseSchema = Type.Object(
  {
    class: Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.Union([Type.String(), Type.Null()]),
    }),
    documents: Type.Array(ClassDocumentItemSchema),
  },
  { description: 'Class documents' }
);

export const ClassDocumentsTeacherResponseSchema = Type.Object(
  {
    class: Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.Union([Type.String(), Type.Null()]),
    }),
    documents: Type.Array(ClassDocumentItemTeacherSchema),
  },
  { description: 'Class documents (teacher view)' }
);

export const StudentClassesResponseSchema = Type.Object(
  {
    classes: Type.Array(ClassSummarySchema),
  },
  { description: 'Student enrolled classes' }
);
