# Student Module Specification

**Version**: 1.0  
**Last Updated**: 2026-02-13  
**Status**: Draft

---

## Overview

This document specifies the **Student Module** for the Exam Generator application. This module enables students to view assigned exams, take exams, submit answers, and view their results with feedback.

### Goals

- Allow teachers to assign exams to specific students
- Enable students to take exams in an interactive interface
- Automatically grade multiple-choice questions
- Provide immediate feedback and results to students
- Track exam attempts and completion status

### Non-Goals (Future Enhancements)

- Manual grading for short-answer questions (auto-grade only in v1)
- Time limits on exams (v1 = no timer)
- Multiple attempts per exam (v1 = single attempt only)
- Peer review or discussion forums
- Mobile app (web-only for v1)

---

## Domain Model

### Entities

#### 1. ExamAssignment

Represents an exam assigned to a specific student by a teacher.

**Properties**:

- `id`: UUID (primary key)
- `examId`: UUID (foreign key to Exam)
- `studentId`: UUID (foreign key to User with role STUDENT)
- `teacherId`: UUID (foreign key to User with role TEACHER)
- `status`: ExamAssignmentStatus (enum)
- `startedAt`: DateTime | null
- `submittedAt`: DateTime | null
- `score`: Float | null (0-100, calculated after submission)
- `feedback`: String | null (optional teacher feedback)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Status Enum**:

- `PENDING`: Assigned but not started
- `IN_PROGRESS`: Student started the exam
- `SUBMITTED`: Student submitted answers (waiting for grading if needed)
- `GRADED`: Exam graded and results available

**Business Rules**:

- Cannot start exam if status is not PENDING
- Cannot submit exam if status is not IN_PROGRESS
- Score is automatically calculated for multiple-choice questions
- Once SUBMITTED, cannot edit answers
- Teacher can provide optional feedback after submission

---

#### 2. StudentAnswer

Represents a single answer from a student for a specific question.

**Properties**:

- `id`: UUID (primary key)
- `assignmentId`: UUID (foreign key to ExamAssignment)
- `questionId`: UUID (foreign key to Question)
- `answerText`: String (student's answer - option letter for MC, text for short answer)
- `isCorrect`: Boolean | null (null = not graded yet, true/false after grading)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Business Rules**:

- One answer per question per assignment (unique constraint)
- For multiple-choice: answerText should be option index (0, 1, 2, 3)
- Auto-graded by comparing with Question.correctAnswer
- Cannot modify after assignment status is SUBMITTED

---

## Database Schema (Prisma)

```prisma
model ExamAssignment {
  id          String               @id @default(uuid())
  examId      String               @map("exam_id")
  studentId   String               @map("student_id")
  teacherId   String               @map("teacher_id")

  // Status tracking
  status      ExamAssignmentStatus @default(PENDING)
  startedAt   DateTime?            @map("started_at")
  submittedAt DateTime?            @map("submitted_at")

  // Results
  score       Float?               // 0-100
  feedback    String?              @db.Text

  // Relations
  exam        Exam                 @relation(fields: [examId], references: [id], onDelete: Cascade)
  student     User                 @relation("StudentAssignments", fields: [studentId], references: [id], onDelete: Cascade)
  teacher     User                 @relation("TeacherAssignments", fields: [teacherId], references: [id], onDelete: Cascade)
  answers     StudentAnswer[]

  // Timestamps
  createdAt   DateTime             @default(now()) @map("created_at")
  updatedAt   DateTime             @updatedAt @map("updated_at")

  @@unique([examId, studentId]) // Student can only have one assignment per exam
  @@map("exam_assignments")
  @@index([studentId])
  @@index([teacherId])
  @@index([status])
}

enum ExamAssignmentStatus {
  PENDING
  IN_PROGRESS
  SUBMITTED
  GRADED
}

model StudentAnswer {
  id           String         @id @default(uuid())
  assignmentId String         @map("assignment_id")
  questionId   String         @map("question_id")

  // Answer data
  answerText   String         @db.Text @map("answer_text")
  isCorrect    Boolean?       @map("is_correct")

  // Relations
  assignment   ExamAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  question     Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  @@unique([assignmentId, questionId]) // One answer per question per assignment
  @@map("student_answers")
  @@index([assignmentId])
}

// Update existing models:
model Exam {
  // ... existing fields
  assignments ExamAssignment[]
}

model Question {
  // ... existing fields
  studentAnswers StudentAnswer[]
}

model User {
  // ... existing fields
  studentAssignments ExamAssignment[] @relation("StudentAssignments")
  teacherAssignments ExamAssignment[] @relation("TeacherAssignments")
}
```

---

## Use Cases

### 1. AssignExamToStudentUseCase

**Actor**: Teacher  
**Input**:

- `examId`: string
- `studentId`: string
- `teacherId`: string (from JWT)

**Flow**:

1. Validate exam exists and belongs to teacher
2. Validate student exists and has STUDENT role
3. Check if assignment already exists (prevent duplicates)
4. Create ExamAssignment with status PENDING
5. Return assignment

**Output**: ExamAssignment entity

**Errors**:

- ExamNotFoundError
- StudentNotFoundError
- UnauthorizedError (exam doesn't belong to teacher)
- DuplicateAssignmentError

---

### 2. GetAssignedExamsUseCase

**Actor**: Student  
**Input**:

- `studentId`: string (from JWT)
- `status`: ExamAssignmentStatus | 'ALL' (filter)

**Flow**:

1. Validate student exists
2. Query ExamAssignments for student with optional status filter
3. Include exam details and teacher info
4. Return list sorted by createdAt DESC

**Output**: Array of ExamAssignment entities with nested Exam and Teacher data

**Errors**:

- StudentNotFoundError

---

### 3. StartExamUseCase

**Actor**: Student  
**Input**:

- `assignmentId`: string
- `studentId`: string (from JWT)

**Flow**:

1. Validate assignment exists and belongs to student
2. Check status is PENDING
3. Update status to IN_PROGRESS
4. Set startedAt to current timestamp
5. Return updated assignment

**Output**: ExamAssignment entity

**Errors**:

- AssignmentNotFoundError
- UnauthorizedError (assignment doesn't belong to student)
- InvalidStatusError (already started or submitted)

---

### 4. SubmitExamAnswersUseCase

**Actor**: Student  
**Input**:

- `assignmentId`: string
- `studentId`: string (from JWT)
- `answers`: Array<{ questionId: string, answerText: string }>

**Flow**:

1. Validate assignment exists and belongs to student
2. Check status is IN_PROGRESS
3. Validate all questions belong to the exam
4. For each answer:
   - Create or update StudentAnswer record
   - Compare answerText with Question.correctAnswer
   - Set isCorrect flag (auto-grading for multiple-choice)
5. Calculate score: (correct answers / total questions) \* 100
6. Update assignment:
   - status = GRADED (auto-graded for MC)
   - submittedAt = current timestamp
   - score = calculated score
7. Return updated assignment with results

**Output**: ExamAssignment entity with score and answers

**Errors**:

- AssignmentNotFoundError
- UnauthorizedError
- InvalidStatusError (not in progress)
- InvalidQuestionError (question doesn't belong to exam)

---

### 5. GetExamResultsUseCase

**Actor**: Student  
**Input**:

- `assignmentId`: string
- `studentId`: string (from JWT)

**Flow**:

1. Validate assignment exists and belongs to student
2. Check status is GRADED
3. Fetch assignment with:
   - Exam details
   - All questions with correct answers and explanations
   - Student answers with isCorrect flags
4. Return detailed results

**Output**:

```typescript
{
  assignment: ExamAssignment;
  exam: Exam;
  results: Array<{
    question: Question;
    studentAnswer: StudentAnswer;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  }>;
}
```

**Errors**:

- AssignmentNotFoundError
- UnauthorizedError
- NotGradedError (exam not graded yet)

---

## API Endpoints (Backend)

### Teacher Endpoints

#### POST /api/exams/:examId/assign

Assign an exam to a student.

**Auth**: Required (TEACHER role)

**Request**:

```json
{
  "studentId": "uuid"
}
```

**Response** (201):

```json
{
  "id": "uuid",
  "examId": "uuid",
  "studentId": "uuid",
  "teacherId": "uuid",
  "status": "PENDING",
  "createdAt": "2026-02-13T10:00:00Z"
}
```

---

### Student Endpoints

#### GET /api/student/assignments

Get all assigned exams for the current student.

**Auth**: Required (STUDENT role)

**Query Params**:

- `status`: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ALL' (default: 'ALL')

**Response** (200):

```json
{
  "assignments": [
    {
      "id": "uuid",
      "exam": {
        "id": "uuid",
        "title": "Cell Division Quiz",
        "description": "Test your knowledge...",
        "questionCount": 10
      },
      "teacher": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "status": "PENDING",
      "score": null,
      "createdAt": "2026-02-13T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/student/assignments/:assignmentId/start

Start an exam (changes status from PENDING to IN_PROGRESS).

**Auth**: Required (STUDENT role)

**Response** (200):

```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2026-02-13T11:00:00Z"
}
```

---

#### GET /api/student/assignments/:assignmentId/exam

Get exam questions for taking the exam.

**Auth**: Required (STUDENT role)

**Response** (200):

```json
{
  "assignment": {
    "id": "uuid",
    "status": "IN_PROGRESS"
  },
  "exam": {
    "id": "uuid",
    "title": "Cell Division Quiz",
    "description": "Test your knowledge..."
  },
  "questions": [
    {
      "id": "uuid",
      "questionText": "What is mitosis?",
      "type": "MULTIPLE_CHOICE",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "orderIndex": 0
    }
  ]
}
```

**Note**: Does NOT include `correctAnswer` or `explanation` (to prevent cheating).

---

#### POST /api/student/assignments/:assignmentId/submit

Submit answers for an exam.

**Auth**: Required (STUDENT role)

**Request**:

```json
{
  "answers": [
    {
      "questionId": "uuid",
      "answerText": "1" // Option index for multiple choice
    }
  ]
}
```

**Response** (200):

```json
{
  "id": "uuid",
  "status": "GRADED",
  "submittedAt": "2026-02-13T11:30:00Z",
  "score": 85.0
}
```

---

#### GET /api/student/assignments/:assignmentId/results

Get detailed results after exam is graded.

**Auth**: Required (STUDENT role)

**Response** (200):

```json
{
  "assignment": {
    "id": "uuid",
    "score": 85.0,
    "submittedAt": "2026-02-13T11:30:00Z",
    "feedback": "Great job!"
  },
  "exam": {
    "id": "uuid",
    "title": "Cell Division Quiz"
  },
  "results": [
    {
      "question": {
        "id": "uuid",
        "questionText": "What is mitosis?",
        "options": ["A", "B", "C", "D"],
        "explanation": "Mitosis is..."
      },
      "studentAnswer": "1",
      "correctAnswer": "1",
      "isCorrect": true
    }
  ]
}
```

---

## Frontend UI Flows

### 1. Student Dashboard (`/dashboard`)

**For STUDENT role, show**:

- Welcome message
- Stats cards:
  - Total assigned exams
  - Pending exams
  - Average score
- Quick actions:
  - View pending exams
- Recent assignments list (last 5)

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  Welcome back, Maria! 👋                                   │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐   │
│  │  📚 Exams   │ │  ⏳ Pending  │ │  📊 Avg Score    │   │
│  │  ─────────  │ │  ─────────   │ │  ──────────────  │   │
│  │     8       │ │      3       │ │      87.5%       │   │
│  └─────────────┘ └─────────────┘ └──────────────────┘   │
│                                                            │
│  Assigned Exams                          [View All →]     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📝 Cell Division Quiz                  ⏳ PENDING   │  │
│  │    10 questions • Assigned by Prof. Smith          │  │
│  │    [Start Exam]                                     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 📝 Chemical Reactions                  ✅ GRADED    │  │
│  │    15 questions • Score: 90% • Prof. Johnson       │  │
│  │    [View Results]                                   │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

### 2. Take Exam Page (`/student/exam/:assignmentId`)

**Features**:

- Progress indicator (Question 3/10)
- Question display with options
- Navigation (Previous/Next buttons)
- Submit button (only on last question)
- Auto-save answers (optional)

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  Cell Division Quiz                                        │
│  Progress: ████████░░░░░░░░  Question 3 of 10            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Question 3                                                │
│                                                            │
│  What is the primary purpose of mitosis?                   │
│                                                            │
│  ( ) A. To produce gametes                                │
│  (•) B. To create two identical daughter cells            │
│  ( ) C. To reduce chromosome number                       │
│  ( ) D. To increase genetic variation                     │
│                                                            │
│  [← Previous]                            [Next →]         │
│                                                            │
│  (On last question, show [Submit Exam] instead of Next)   │
└────────────────────────────────────────────────────────────┘
```

---

### 3. Exam Results Page (`/student/results/:assignmentId`)

**Features**:

- Overall score (large, prominent)
- Teacher feedback (if provided)
- Question-by-question breakdown
- Show correct answer for wrong questions
- Show explanations

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  [← Back to Dashboard]                                     │
│                                                            │
│  Cell Division Quiz - Results                              │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Your Score: 85% ✨                      │  │
│  │           8 correct out of 10 questions             │  │
│  │                                                      │  │
│  │  Teacher Feedback:                                  │  │
│  │  "Great job! Review question 4 about meiosis."     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  Question Breakdown                                        │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Question 1                                ✅ Correct│  │
│  │ What is the primary purpose of mitosis?            │  │
│  │ Your answer: B. Create two identical daughter cells│  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Question 2                                ❌ Wrong  │  │
│  │ How many chromosomes...?                           │  │
│  │ Your answer: C. 48                                 │  │
│  │ Correct answer: B. 46                              │  │
│  │                                                     │  │
│  │ 💡 Explanation: Humans have 46 chromosomes...     │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Backend

**Domain Layer** (`backend/src/domain/`):

- `entities/ExamAssignment.ts` - Core business logic
- `entities/StudentAnswer.ts` - Answer validation
- `repositories/IExamAssignmentRepository.ts` - Port interface
- `repositories/IStudentAnswerRepository.ts` - Port interface

**Application Layer** (`backend/src/application/use-cases/student/`):

- `AssignExamToStudentUseCase.ts`
- `GetAssignedExamsUseCase.ts`
- `StartExamUseCase.ts`
- `SubmitExamAnswersUseCase.ts`
- `GetExamResultsUseCase.ts`

**Infrastructure Layer** (`backend/src/infrastructure/repositories/`):

- `PrismaExamAssignmentRepository.ts` - Prisma adapter
- `PrismaStudentAnswerRepository.ts` - Prisma adapter

**Routes** (`backend/src/routes/`):

- `student.routes.ts` - Student endpoints
- Update `exam.routes.ts` - Add assign endpoint

**Middleware**:

- Update `auth.middleware.ts` to support role-based access

---

### Frontend

**Feature Structure** (`frontend/features/student/`):

```
student/
├── components/
│   ├── StudentDashboard.tsx
│   ├── AssignedExamCard.tsx
│   ├── TakeExam.tsx
│   ├── ExamQuestion.tsx
│   ├── ExamResults.tsx
│   └── QuestionResult.tsx
├── hooks/
│   ├── useAssignedExams.ts
│   ├── useStartExam.ts
│   ├── useSubmitExam.ts
│   └── useExamResults.ts
├── services/
│   └── student.service.ts
├── types/
│   └── student.types.ts
└── context/
    └── ExamTakingContext.tsx (optional, for auto-save)
```

**Routes** (`frontend/app/`):

- `/dashboard` - Conditional rendering based on role
- `/student/exam/[assignmentId]` - Take exam
- `/student/results/[assignmentId]` - View results

---

## Testing Strategy

### Unit Tests (Backend)

**Domain Entities**:

- `ExamAssignment.create()` validation
- Status transitions (PENDING → IN_PROGRESS → SUBMITTED → GRADED)
- Score calculation logic

**Use Cases**:

- `SubmitExamAnswersUseCase` - Test auto-grading logic
- `GetAssignedExamsUseCase` - Test filtering by status
- Error scenarios (unauthorized access, invalid status, etc.)

**Repositories**:

- CRUD operations for ExamAssignment and StudentAnswer
- Complex queries (assignments with nested exam data)

---

### Integration Tests (Backend)

**API Endpoints**:

- `POST /api/exams/:examId/assign` - Assign exam
- `GET /api/student/assignments` - Get assignments
- `POST /api/student/assignments/:id/start` - Start exam
- `POST /api/student/assignments/:id/submit` - Submit answers
- `GET /api/student/assignments/:id/results` - Get results

**Test Scenarios**:

- Happy path: Assign → Start → Submit → Get Results
- Authorization: Student cannot access other student's exams
- Validation: Cannot submit exam before starting
- Edge cases: Submit partial answers, submit twice, etc.

---

### E2E Tests (Frontend + Backend)

**User Flows**:

1. Teacher assigns exam to student
2. Student logs in and sees assigned exam
3. Student starts exam
4. Student answers all questions
5. Student submits exam
6. Student views results with score and feedback

**Playwright Tests**:

- `student-exam-flow.spec.ts`

---

## Migration Strategy

### Phase 1: Database Migration

1. Add new Prisma models (ExamAssignment, StudentAnswer)
2. Update existing models with relations
3. Run `pnpm prisma migrate dev --name add-student-module`
4. Verify migration in local PostgreSQL

### Phase 2: Backend Implementation

1. Domain entities + repositories (TDD)
2. Use cases (TDD)
3. API routes + middleware
4. Integration tests

### Phase 3: Frontend Implementation

1. Create feature folder structure
2. Implement services (API calls)
3. Implement hooks
4. Implement components
5. Add routes

### Phase 4: End-to-End Testing

1. Playwright tests for full flow
2. Manual QA testing

### Phase 5: Documentation

1. Update README with student features
2. Update API documentation (Swagger)
3. Add ADR if architectural decisions made

---

## Security Considerations

### Authorization

- Students can ONLY access their own assignments
- Teachers can ONLY assign their own exams
- Middleware must validate role + ownership

### Data Protection

- Do NOT send correct answers to frontend until exam is submitted
- Do NOT send explanations until exam is submitted
- Validate all input (prevent injection attacks)

### Rate Limiting

- Limit submissions to prevent spam (1 submit per assignment)
- Rate limit API calls (use existing Fastify rate limiter)

---

## Success Criteria

### MVP Definition of Done

- [ ] Teacher can assign exam to student via API
- [ ] Student can view assigned exams
- [ ] Student can start exam (status: PENDING → IN_PROGRESS)
- [ ] Student can take exam (answer questions)
- [ ] Student can submit exam (auto-graded)
- [ ] Student can view results with score and explanations
- [ ] All use cases have unit tests (>80% coverage)
- [ ] API endpoints have integration tests
- [ ] E2E test covers full student flow
- [ ] Documentation updated

---

## Future Enhancements (v2+)

- **Time limits**: Add `timeLimit` to Exam, track `remainingTime`
- **Multiple attempts**: Allow `maxAttempts` configuration
- **Short answer grading**: AI-powered grading with Azure OpenAI
- **Essay questions**: Rich text editor for longer answers
- **Question shuffle**: Randomize question order per student
- **Option shuffle**: Randomize multiple-choice options
- **Analytics**: Teacher dashboard with student performance metrics
- **Notifications**: Email/push when exam assigned or graded
- **Review mode**: Allow students to review exam before submitting
- **Partial save**: Auto-save answers as student types (WebSocket?)

---

## Related Documentation

- `docs/specs/auth-flow.md` - Authentication and authorization
- `docs/specs/exam-generation.md` - Exam creation flow
- `docs/architecture.md` - System architecture overview
- `backend/prisma/schema.prisma` - Database schema
- `AGENTS.md` - Development workflow guidelines

---

**Spec Status**: Ready for Implementation ✅

**Next Steps**:

1. Create feature branch `feature/student-module`
2. Implement Prisma migration
3. Implement backend (TDD)
4. Implement frontend
5. E2E tests
6. Create PR

---

**Last Updated**: 2026-02-13  
**Author**: Senior Architect + Student
