# Class-Exam Integration Specification

**Version**: 1.0
**Last Updated**: 2026-03-01
**Status**: Draft

---

## Overview

This document specifies how exams are assigned to classes, managed by teachers, and taken by students. It follows the same patterns as document sharing (see `0011-class-resources-management.md`) but adapted for exams.

---

## Research: How Popular LMS Handle Exam-Class Integration

### Google Classroom

- **Assignments**: Create assignment → Attach quiz form → Assign to class
- **Due Dates**: Optional, can be scheduled
- **Visibility**: Draft (only teacher sees) vs Assigned (students see)
- **Grading**: Auto-graded via Google Forms integration
- **Results**: Teachers see per-student results, students see their own
- **Late Submissions**: Can be allowed or blocked
- **Multiple Classes**: One assignment can be posted to multiple classes

### Canvas LMS

- **Assignments**: Create assignment → Select submission type (online quiz) → Assign to course
- **Availability Window**: Start date (when students can see) + End date (when it's due)
- **Time Limits**: Optional per-quiz time limit
- **Attempts**: Configurable (1 to unlimited)
- **Grade Passback**: Grades sync to gradebook automatically
- **SpeedGrader**: Teachers review submissions one question at a time
- **Module Integration**: Quizzes can be placed in course modules

### Moodle

- **Quiz Activity**: Create quiz → Add questions → Configure settings
- **Timing**: Open/close dates, time limit
- **Attempts**: Limit attempts per student
- **Shuffle**: Questions and answers can be shuffled
- **Review Options**: Control what students see after submission
- **Gradebook**: Auto-syncs to gradebook
- **Question Bank**: Reusable questions across quizzes

### Blackboard

- **Tests**: Create test → Deploy to content area → Set options
- **Availability**: Schedule start/end dates
- **Force Completion**: Must finish in one sitting
- **Timer**: Countdown timer enforcement
- **Feedback**: Rule-based feedback release
- **Grade Center**: Automatic column creation

---

## Key Patterns to Adopt

| Feature              | Implementation                                           |
| -------------------- | -------------------------------------------------------- |
| **Assign to Class**  | Bulk assign exam to all enrolled students                |
| **Due Dates**        | Optional deadline for submissions                        |
| **Availability**     | Start/end window (when exam becomes visible to students) |
| **Time Limit**       | Optional countdown timer during exam                     |
| **Visibility**       | Draft (teacher edits) → Published (students can see)     |
| **Results**          | Teachers see all results; students see their own         |
| **Multiple Classes** | One exam can be assigned to multiple classes             |

---

## Domain Model

### Current State

We already have:

- `Exam` entity: Teacher's exam with questions
- `ExamAssignment` entity: Links exam to a **single student**
- `Class` entity: Groups students
- `StudentEnrollment` entity: Links student to class

### New Entity: `ClassExam`

Create a new join table between `Exam` and `Class`, similar to `ClassDocument`:

```typescript
// backend/src/domain/entities/ClassExam.ts

export interface ClassExamProps {
  id: ClassExamId;
  classId: ClassId;
  examId: string; // Exam ID (UUID string)
  teacherId: UserId; // Who assigned it

  // Availability settings
  availableAt: Date | null; // When students can start seeing it
  dueDate: Date | null; // Deadline for submission
  timeLimit: number | null; // Minutes (null = unlimited)

  // Visibility
  isPublished: boolean; // Draft vs Published

  // Attempt settings
  maxAttempts: number; // 1 = single attempt, >1 = multiple
  showResultsImmediately: boolean; // Show results after submission

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Entity Relationship

```
┌─────────┐       ┌─────────────┐       ┌─────────┐
│  Exam   │       │  ClassExam  │       │  Class  │
│         │───────│             │───────│         │
│ (teacher│       │ - classId   │       │ (grouped│
│  owns)  │       │ - examId    │       │ students│
│         │       │ - settings  │       │         │
└─────────┘       └─────────────┘       └─────────┘
                         │
                         │ (creates)
                         ▼
                  ┌─────────────────┐
                  │ ExamAssignment  │
                  │ (per student)   │
                  └─────────────────┘
```

**Flow**:

1. Teacher creates `Exam` (owns it)
2. Teacher assigns exam to class → creates `ClassExam` (with settings)
3. System creates `ExamAssignment` for each enrolled student
4. Student takes exam → `ExamAssignment` tracks progress

---

## API Endpoints

### 1. Assign Exam to Class

**Endpoint**: `POST /api/classes/:classId/exams`

**Request**:

```json
{
  "examId": "uuid-exam-1234",
  "availableAt": "2026-03-10T09:00:00Z", // Optional: when exam becomes visible
  "dueDate": "2026-03-17T23:59:00Z", // Optional: deadline
  "timeLimit": 60, // Optional: minutes (null = unlimited)
  "maxAttempts": 1, // Default: 1
  "showResultsImmediately": false // Default: false
}
```

**Response** (201 Created):

```json
{
  "classExam": {
    "id": "uuid-class-exam-1",
    "classId": "uuid-class-123",
    "examId": "uuid-exam-1234",
    "examTitle": "Cell Division Quiz",
    "questionCount": 10,
    "availableAt": "2026-03-10T09:00:00Z",
    "dueDate": "2026-03-17T23:59:00Z",
    "timeLimit": 60,
    "isPublished": false,
    "maxAttempts": 1,
    "showResultsImmediately": false,
    "assignedStudents": 25,
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

**Errors**:

- `404`: Class not found
- `403`: Not the class teacher
- `400`: Exam already assigned to this class

---

### 2. Get Exams for Class (Teacher View)

**Endpoint**: `GET /api/classes/:classId/exams`

**Response**:

```json
{
  "exams": [
    {
      "id": "uuid-class-exam-1",
      "examId": "uuid-exam-1234",
      "examTitle": "Cell Division Quiz",
      "questionCount": 10,
      "availableAt": "2026-03-10T09:00:00Z",
      "dueDate": "2026-03-17T23:59:00Z",
      "isPublished": true,
      "assignedStudents": 25,
      "startedCount": 18,
      "submittedCount": 12,
      "gradedCount": 10
    }
  ]
}
```

---

### 3. Get Exams for Student (Student View)

**Endpoint**: `GET /api/student/exams`

**Response**:

```json
{
  "exams": [
    {
      "id": "uuid-class-exam-1",
      "classId": "uuid-class-123",
      "className": "Biology 101",
      "examTitle": "Cell Division Quiz",
      "questionCount": 10,
      "availableAt": "2026-03-10T09:00:00Z",
      "dueDate": "2026-03-17T23:59:00Z",
      "timeLimit": 60,
      "status": "NOT_STARTED", // NOT_STARTED | IN_PROGRESS | SUBMITTED | GRADED
      "score": null,
      "attemptNumber": 0,
      "remainingAttempts": 1
    }
  ]
}
```

**Filtering**:

- Only shows **published** exams
- Only shows exams where `availableAt` has passed (or null)
- Shows deadline status (overdue, due soon, etc.)

---

### 4. Get Exam Details for Student

**Endpoint**: `GET /api/student/exams/:classExamId`

**Response**:

```json
{
  "exam": {
    "id": "uuid-class-exam-1",
    "title": "Cell Division Quiz",
    "description": "Test your knowledge...",
    "timeLimit": 60,
    "questionCount": 10,
    "dueDate": "2026-03-17T23:59:00Z"
  },
  "assignment": {
    "id": "uuid-assignment-1",
    "status": "NOT_STARTED",
    "startedAt": null,
    "submittedAt": null,
    "score": null,
    "attemptNumber": 0
  },
  "canStart": true,
  "canSubmit": false
}
```

---

### 5. Start Exam (Student)

**Endpoint**: `POST /api/student/exams/:classExamId/start`

**Response**:

```json
{
  "assignment": {
    "id": "uuid-assignment-1",
    "status": "IN_PROGRESS",
    "startedAt": "2026-03-15T14:30:00Z",
    "attemptNumber": 1
  },
  "exam": {
    "id": "uuid-exam-1234",
    "title": "Cell Division Quiz",
    "questions": [
      {
        "id": "q-1",
        "question": "What is mitosis?",
        "options": {
          "A": "Cell division producing gametes",
          "B": "Cell division producing identical cells",
          "C": "Process of cell growth",
          "D": "Process of cell death"
        }
        // correctAnswer NOT included!
      }
    ]
  },
  "timeRemaining": 3600 // seconds (if timeLimit set)
}
```

**Business Logic**:

1. Check `isPublished` and `availableAt` (must be past or null)
2. Check `maxAttempts` vs `attemptNumber`
3. Check if `dueDate` passed (block if overdue and strict mode)
4. Create `ExamAssignment` if not exists
5. Update `ExamAssignment.status` to `IN_PROGRESS`
6. Return questions WITHOUT correct answers

---

### 6. Submit Exam Answers (Student)

**Endpoint**: `POST /api/student/exams/:classExamId/submit`

**Request**:

```json
{
  "answers": [
    { "questionId": "q-1", "answer": "B" },
    { "questionId": "q-2", "answer": "A" }
    // ... all answers
  ]
}
```

**Response**:

```json
{
  "assignment": {
    "id": "uuid-assignment-1",
    "status": "SUBMITTED",
    "submittedAt": "2026-03-15T15:20:00Z",
    "score": 85.5, // Only if showResultsImmediately
    "attemptNumber": 1
  },
  "showResults": false, // Based on showResultsImmediately setting
  "message": "Your exam has been submitted successfully."
}
```

---

### 7. Publish/Unpublish Class Exam

**Endpoint**: `PATCH /api/classes/:classId/exams/:classExamId/publish`

**Request**:

```json
{
  "isPublished": true
}
```

**Response**: Updated ClassExam object

**Business Logic**:

- Publishing creates `ExamAssignment` for all enrolled students
- Unpublishing hides exam from students (but doesn't delete assignments)

---

### 8. Get Exam Results (Teacher)

**Endpoint**: `GET /api/classes/:classId/exams/:classExamId/results`

**Response**:

```json
{
  "examTitle": "Cell Division Quiz",
  "classExamId": "uuid-class-exam-1",
  "results": [
    {
      "studentId": "uuid-student-1",
      "studentName": "John Doe",
      "studentEmail": "john@example.com",
      "status": "GRADED",
      "startedAt": "2026-03-15T14:30:00Z",
      "submittedAt": "2026-03-15T15:15:00Z",
      "timeTaken": 2700, // seconds
      "score": 85.5,
      "attemptNumber": 1
    },
    {
      "studentId": "uuid-student-2",
      "studentName": "Jane Smith",
      "studentEmail": "jane@example.com",
      "status": "NOT_STARTED",
      "startedAt": null,
      "submittedAt": null,
      "timeTaken": null,
      "score": null,
      "attemptNumber": 0
    }
  ],
  "statistics": {
    "totalStudents": 25,
    "startedCount": 18,
    "submittedCount": 12,
    "gradedCount": 10,
    "averageScore": 78.5,
    "highestScore": 95,
    "lowestScore": 45
  }
}
```

---

### 9. Update Class Exam Settings

**Endpoint**: `PATCH /api/classes/:classId/exams/:classExamId`

**Request**:

```json
{
  "availableAt": "2026-03-11T09:00:00Z",
  "dueDate": "2026-03-18T23:59:00Z",
  "timeLimit": 45,
  "isPublished": true
}
```

---

### 10. Remove Exam from Class

**Endpoint**: `DELETE /api/classes/:classId/exams/:classExamId`

**Business Logic**:

- Soft delete (mark as removed)
- All `ExamAssignment` records are kept for history
- Students can no longer start/submitted exams can still be viewed for grading

---

## Frontend Components

### Teacher View

```
┌─────────────────────────────────────────────────────────────┐
│  Class: Biology 101                     [Edit] [Add Exam]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Exams (3)                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cell Division Quiz                                  │   │
│  │ 📋 10 questions • ⏱️ 60 min • 📅 Due: Mar 17      │   │
│  │ Status: Draft                                       │   │
│  │ 📊 0/25 started • 0/25 submitted                    │   │
│  │                          [Publish] [Edit] [Delete]  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Photosynthesis Test                                 │   │
│  │ 📋 20 questions • ⏱️ 90 min • 📅 Due: Mar 20       │   │
│  │ Status: Published ✓                                 │   │
│  │ 📊 18/25 started • 12/25 submitted • 10 graded      │   │
│  │                          [View Results] [Unpublish] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Student View

```
┌─────────────────────────────────────────────────────────────┐
│  My Exams                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cell Division Quiz                     Biology 101 │   │
│  │ 📋 10 questions • ⏱️ 60 min • 📅 Due: Mar 17      │   │
│  │ Status: Not Started                                 │   │
│  │                              [Start Exam]          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Photosynthesis Test                    Biology 101  │   │
│  │ 📋 20 questions • ⏱️ 90 min                         │   │
│  │ Status: Submitted • Score: 85%                      │   │
│  │                              [View Results]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Assign Exam Modal (Teacher)

```
┌─────────────────────────────────────────────────────────────┐
│  Assign Exam to Class                              [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Exam:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cell Division Quiz (10 questions)            [✓]   │   │
│  │ Genetics Test (25 questions)                        │   │
│  │ Evolution Essay (5 questions)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Settings:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Available From:  [📅 Mar 10, 2026 09:00]           │   │
│  │ Due Date:         [📅 Mar 17, 2026 23:59]          │   │
│  │ Time Limit:       [60] minutes (0 = unlimited)     │   │
│  │ Max Attempts:     [1]                               │   │
│  │ □ Show results immediately after submission          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Excluded Students: (optional)                              │
│  [Select students to exclude from this exam...]            │
│                                                             │
│                    [Cancel]  [Assign Exam]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Table: `ClassExam`

```sql
CREATE TABLE "ClassExam" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" UUID NOT NULL REFERENCES "Class"(id) ON DELETE CASCADE,
  "examId" UUID NOT NULL REFERENCES "Exam"(id) ON DELETE CASCADE,
  "teacherId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Availability
  "availableAt" TIMESTAMP,
  "dueDate" TIMESTAMP,
  "timeLimit" INTEGER, -- minutes, NULL = unlimited

  -- Visibility
  "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,

  -- Attempt settings
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "showResultsImmediately" BOOLEAN NOT NULL DEFAULT FALSE,

  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE("classId", "examId")
);

CREATE INDEX idx_class_exam_class ON "ClassExam"("classId");
CREATE INDEX idx_class_exam_exam ON "ClassExam"("examId");
CREATE INDEX idx_class_exam_published ON "ClassExam"("isPublished");
```

### Update `ExamAssignment` Table

```sql
-- Add reference to ClassExam
ALTER TABLE "ExamAssignment" ADD COLUMN "classExamId" UUID REFERENCES "ClassExam"(id) ON DELETE SET NULL;
```

> **Note**: `classExamId` is nullable for backwards compatibility. New assignments will have it set, old ones remain NULL.

---

## Implementation Plan

### Phase 1: Domain Layer (Backend)

1. Create `ClassExam` entity
2. Create `ClassExamId` value object
3. Create `IClassExamRepository` interface
4. Create `PrismaClassExamRepository` implementation
5. Add Prisma migration for `ClassExam` table

### Phase 2: Use Cases (Backend)

1. `AssignExamToClassUseCase` - Refactor existing to use ClassExam
2. `GetClassExamsUseCase` - Teacher view
3. `GetStudentExamsUseCase` - Student view
4. `PublishClassExamUseCase` - Toggle visibility
5. `GetClassExamResultsUseCase` - Teacher grades view
6. `UpdateClassExamSettingsUseCase` - Edit settings
7. `DeleteClassExamUseCase` - Remove from class

### Phase 3: API Routes (Backend)

1. `POST /api/classes/:classId/exams` - Assign exam
2. `GET /api/classes/:classId/exams` - List class exams (teacher)
3. `GET /api/student/exams` - List student exams
4. `GET /api/student/exams/:classExamId` - Get details
5. `POST /api/student/exams/:classExamId/start` - Start exam
6. `POST /api/student/exams/:classExamId/submit` - Submit answers
7. `PATCH /api/classes/:classId/exams/:classExamId` - Update settings
8. `PATCH /api/classes/:classId/exams/:classExamId/publish` - Publish/unpublish
9. `GET /api/classes/:classId/exams/:classExamId/results` - Get results
10. `DELETE /api/classes/:classId/exams/:classExamId` - Remove

### Phase 4: Frontend Components

1. `AssignExamModal` - Teacher assigns exam to class
2. `ClassExamList` - Teacher view of class exams
3. `StudentExamList` - Student view of assigned exams
4. `ExamSettingsForm` - Edit availability, due date, etc.
5. `ExamResultsTable` - Teacher grades view
6. Update `ClassCard` to show exam count

### Phase 5: Integration Testing

1. E2E: Teacher assigns exam to class → Student sees in list
2. E2E: Student starts exam → Submit → Teacher sees results
3. E2E: Publish/unpublish flow
4. E2E: Due date enforcement

---

## Edge Cases

### 1. What happens when a student joins a class late?

- If exam is already published, create `ExamAssignment` for new student
- If exam has `dueDate` passed, student cannot take it (unless grace period)

### 2. What if due date passes while student is taking exam?

- Timer shows "OVERDUE" warning
- If strict mode: auto-submit current answers
- If lenient mode: allow submission with late flag

### 3. What if teacher unpublishes exam while students are taking it?

- Students currently in progress can finish
- Students who haven't started won't see it

### 4. What if teacher deletes an exam that's assigned to classes?

- `ON DELETE CASCADE` removes `ClassExam` records
- Soft delete recommended for production (add `deletedAt` column)

### 5. What if student has multiple attempts?

- Track `attemptNumber` in `ExamAssignment`
- On new attempt, reset `status` to `PENDING`
- Keep history of previous attempts (future: attempt history table)

---

## Testing Requirements

### Unit Tests

- `ClassExam` entity validation (dates, time limits)
- `AssignExamToClassUseCase` with exclusions
- `GetStudentExamsUseCase` filtering (published, available)
- Repository methods (CRUD operations)

### Integration Tests

- Bulk assignment creation for class students
- Concurrent exam starts (race conditions)
- Due date boundaries
- Publish/unpublish cascade effects

### E2E Tests

- Complete flow: Create exam → Assign to class → Publish → Student takes exam → Teacher views results
- Student joins class late → Gets assigned exam
- Multiple attempts flow

---

## API Endpoints Summary

| Method | Endpoint                                  | Description                |
| ------ | ----------------------------------------- | -------------------------- |
| POST   | `/api/classes/:classId/exams`             | Assign exam to class       |
| GET    | `/api/classes/:classId/exams`             | List class exams (teacher) |
| PATCH  | `/api/classes/:classId/exams/:id`         | Update exam settings       |
| PATCH  | `/api/classes/:classId/exams/:id/publish` | Publish/unpublish          |
| GET    | `/api/classes/:classId/exams/:id/results` | Get exam results           |
| DELETE | `/api/classes/:classId/exams/:id`         | Remove exam from class     |
| GET    | `/api/student/exams`                      | List student's exams       |
| GET    | `/api/student/exams/:id`                  | Get exam details (student) |
| POST   | `/api/student/exams/:id/start`            | Start exam                 |
| POST   | `/api/student/exams/:id/submit`           | Submit answers             |

---

## Related Documentation

- See `docs/specs/exam-generation.md` for exam creation
- See `docs/specs/student-module.md` for student assignment flow
- See `docs/adr/0009-clean-architecture.md` for domain patterns
- See `docs/specs/0011-class-resources-management.md` for document sharing pattern

---

## Open Questions

1. **Should exams be reusable across multiple classes?**
   - Yes, one `Exam` can have multiple `ClassExam` records
   - Each class can have different settings (due date, time limit)

2. **Should we support exam templates?**
   - Future: Create exam from template
   - For MVP: Manual exam creation only

3. **How to handle retakes?**
   - `maxAttempts` setting
   - Track each attempt separately
   - Keep best score or latest score?

4. **Analytics and insights?**
   - Per-question statistics (difficulty, discrimination)
   - Time spent per question
   - Future: ML-powered recommendations

---

**Last Updated**: 2026-03-01
