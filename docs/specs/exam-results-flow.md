# Spec: Teacher Exam Results & Student Exam Experience

## Overview

Complete flow for exam management:

1. **Student** can view their assigned exams, take exams, save progress, submit, and view results
2. **Teacher** can view exam results for all students, see individual answers, and grade short-answer questions

## Current State Analysis

### Problems Identified

1. **Student Exam Results Page Missing**: After submitting an exam, student sees a success message but cannot view their results
2. **Teacher Exam Results Page Missing**: Teacher can see exam stats (started/submitted counts) but cannot view individual student results
3. **No Grading Flow**: Short-answer questions need manual grading, but there's no grading interface
4. **Resume Exam UX Confusion**: When student resumes an exam, previous answers are not loaded

### Existing Endpoints

**Student Routes:**

- ✅ `GET /api/students/assignments` - List assigned exams
- ✅ `POST /api/students/assignments/:id/start` - Start/resume exam
- ✅ `POST /api/students/assignments/:id/answers` - Save answer
- ✅ `POST /api/students/assignments/:id/submit` - Submit exam
- ✅ `GET /api/students/assignments/:id/results` - Get exam results (exists but frontend not using)

**Class Exam Routes (Teacher):**

- ✅ `GET /api/classes/:classId/exams` - List class exams with stats
- ✅ `POST /api/classes/:classId/exams` - Assign exam to class
- ✅ `PATCH /api/classes/:classId/exams/:examId` - Publish/unpublish exam
- ✅ `GET /api/classes/:classId/exams/:classExamId/results` - Get results (exists but frontend not using)

## Proposed Solutions

### Phase 1: Student View Results (HIGH PRIORITY)

#### 1.1. Student Exam Results Page

**Location:** `/student/exams/[id]/results`

**What it shows:**

- Exam title and description
- Score (if graded)
- Percentage
- For each question:
  - Question text
  - Student's answer
  - Correct answer (for multiple-choice)
  - Whether correct/incorrect
  - Points earned
  - Explanation (if available)

**Backend:**

- Endpoint already exists: `GET /api/students/assignments/:id/results`
- Returns: `ExamResultsData`

**Frontend Changes:**

1. Create `StudentExamResults` component
2. Add navigation flow:
   - From exam list: Show results button for `GRADED` status
   - After submission: Redirect to results page
3. Handle `SUBMITTED` status: Show "Your exam has been submitted and is being graded"

#### 1.2. Student Exam List Updates

**Current Behavior:**

```typescript
// StudentExamList.tsx
const handleExamSelect = (exam: StudentExamListItem) => {
  if (exam.status === 'GRADED') {
    router.push(`/student/exams/${exam.id}/results`);
  } else {
    router.push(`/student/exams/${exam.id}`); // Goes to take exam page
  }
};
```

**Issues:**

- `SUBMITTED` exams show "take exam" button → should show "view submission" or disabled
- `IN_PROGRESS` exams correctly show "resume" button
- No visual distinction between statuses in the list

**Proposed Changes:**

```typescript
// Proposed behavior
const handleExamSelect = (exam: StudentExamListItem) => {
  switch (exam.status) {
    case 'PENDING':
      router.push(`/student/exams/${exam.id}`); // Start exam
      break;
    case 'IN_PROGRESS':
      router.push(`/student/exams/${exam.id}`); // Resume exam
      break;
    case 'SUBMITTED':
      // Show modal: "Your exam has been submitted and is being graded"
      // OR redirect to results page with "grading in progress" state
      router.push(`/student/exams/${exam.id}/results`);
      break;
    case 'GRADED':
      router.push(`/student/exams/${exam.id}/results`); // View results
      break;
  }
};
```

#### 1.3. Exam Taking - Resume Flow

**Current Issue:** When resuming an exam, previous answers are blank.

**Expected Behavior:**

1. Student clicks "Resume" on an `IN_PROGRESS` exam
2. `POST /api/students/assignments/:id/answers` has been saving answers
3. Need to load existing answers on resume

**Backend Changes:** None - answers are being saved correctly.

**Frontend Changes:**

- `GET /api/students/assignments/:id/start` already returns the exam
- Need to also return saved answers for `IN_PROGRESS` exams
- Store answers in `ExamTaking` component state

### Phase 2: Teacher View Results (HIGH PRIORITY)

#### 2.1. Teacher Exam Results Page

**Location:** `/dashboard/classes/[classId]/exams/[examId]/results`

**What it shows:**

- Exam title and description
- Statistics: total students, started, submitted, graded, etc.
- Table of students with:
  - Name
  - Status (NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED)
  - Score (if graded)
  - Submission date
  - Action buttons (view details, grade)

#### 2.2. Individual Student Results View

**Location:** `/dashboard/classes/[classId]/exams/[examId]/students/[studentId]`

**What it shows:**

- Student name and submission date
- Each question:
  - Question text
  - Student's answer
  - Correct answer (for multiple-choice)
  - Manual grader input for short-answer questions
  - Points earned / max points
  - Feedback (optional)

#### 2.3. Grading Interface

**For Short-Answer Questions:**

- Show all student answers for a question
- Allow teacher to:
  - Mark as correct/incorrect
  - Award partial points
  - Add feedback

**Proposed Grading Flow:**

1. Teacher opens exam results
2. Clicks "Grade" on a submission
3. Sees all questions with student answers
4. For multiple-choice: Already auto-graded
5. For short-answer: Input field for points, checkbox for correct/incorrect, optional feedback

### Phase 3: Enhanced Student Experience

#### 3.1. ExamTaking Component Improvements

**Current Issues:**

- Answers not persisted between question navigation
- No visual indicator of saved answers
- Confusing submit vs save

**Proposed Changes:**

- Auto-save answers on question navigation (debounced)
- Show visual indicator (checkmark) for saved questions
- Add "Review before submit" view showing all questions and answer status
- Better status badges in question navigation

## Detailed API Specification

### Existing Endpoints to Verify

#### GET `/api/students/assignments/:id/results`

**Current Response:**

```typescript
interface ExamResultsData {
  assignment: ExamAssignment;
  exam: ExamWithQuestions;
  answers: StudentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
}
```

**Needs Validation:** Does this return student's answers correctly?

#### GET `/api/classes/:classId/exams/:classExamId/results`

**Current Response:** Need to verify what it returns.

**Proposed Response:**

```typescript
interface ClassExamResultsResponse {
  classExam: {
    id: string;
    examTitle: string;
    totalStudents: number;
    startedCount: number;
    submittedCount: number;
    gradedCount: number;
    averageScore?: number;
  };
  submissions: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
    startedAt?: string;
    submittedAt?: string;
    score?: number;
    maxScore: number;
    percentage?: number;
  }>;
}
```

### New Endpoints Needed

#### GET `/api/classes/:classId/exams/:classExamId/students/:studentId`

**Purpose:** Get detailed results for a specific student

**Response:**

```typescript
interface StudentExamSubmissionResponse {
  student: {
    id: string;
    name: string;
    email: string;
  };
  exam: ExamWithQuestions;
  assignment: {
    id: string;
    status: string;
    startedAt: string;
    submittedAt?: string;
    score?: number;
  };
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
    options?: string[];
    correctAnswer: string;
    studentAnswer: string;
    isCorrect?: boolean;
    pointsEarned: number;
    maxPoints: number;
    feedback?: string;
  }>;
}
```

#### PATCH `/api/classes/:classId/exams/:classExamId/students/:studentId/grade`

**Purpose:** Grade short-answer questions

**Request:**

```typescript
interface GradeSubmissionRequest {
  grades: Array<{
    questionId: string;
    pointsAwarded: number;
    feedback?: string;
  }>;
}
```

## Implementation Order

### Phase 1: Student Results (1-2 days)

1. ✅ Verify backend endpoint returns correct data
2. ✅ Create `StudentExamResults.tsx` component
3. ✅ Add route `/student/exams/[id]/results/page.tsx`
4. ✅ Update `StudentExamList` to handle all statuses
5. ✅ Update `ExamTaking` to load saved answers on resume
6. ✅ Add i18n keys for results UI

### Phase 2: Teacher Results (2-3 days)

1. Verify/extend class exam results endpoint
2. Create `ClassExamResults.tsx` component
3. Create `StudentSubmissionDetail.tsx` component
4. Add route `/dashboard/classes/[classId]/exams/[examId]/results`
5. Add route `/dashboard/classes/[classId]/exams/[examId]/students/[studentId]`
6. Wire up to `ClassExamList` "View Results" button

### Phase 3: Grading Interface (1-2 days)

1. Add grading modal/page for short-answer questions
2. Add point override and feedback fields
3. Wire up to student submission detail view

## Files to Create/Modify

### New Files

**Frontend:**

- `app/student/exams/[id]/results/page.tsx`
- `features/student-exams/components/StudentExamResults.tsx`
- `app/dashboard/classes/[id]/exams/[examId]/results/page.tsx`
- `features/classes/components/ClassExamResults.tsx`
- `features/classes/components/StudentSubmissionDetail.tsx`
- `lib/services/api-exam-results.service.ts`

### Modified Files

**Frontend:**

- `features/student-exams/components/StudentExamList.tsx` - Update status handling
- `features/student-exams/hooks/useExamAssignment.ts` - Load saved answers
- `features/student-exams/types/student-exam.types.ts` - Add result types

**Backend:**

- Verify all existing endpoints return correct data
- Add missing fields if needed

## Translation Keys Needed

### English (`en/student.json`)

```json
{
  "results": {
    "title": "Your Results",
    "score": "Score",
    "percentage": "Percentage",
    "submittedOn": "Submitted on",
    "gradingInProgress": "Your exam has been submitted and is being graded",
    "question": "Question",
    "yourAnswer": "Your Answer",
    "correctAnswer": "Correct Answer",
    "pointsEarned": "Points Earned",
    "explanation": "Explanation",
    "correct": "Correct",
    "incorrect": "Incorrect",
    "partial": "Partial",
    "notAnswered": "Not Answered"
  }
}
```

### English (`en/classes.json`)

```json
{
  "examResults": {
    "title": "Exam Results",
    "totalStudents": "Total Students",
    "started": "Started",
    "submitted": "Submitted",
    "graded": "Graded",
    "averageScore": "Average Score",
    "viewSubmission": "View Submission",
    "grade": "Grade",
    "submissionDetails": "Submission Details",
    "studentName": "Student Name",
    "submittedAt": "Submitted At",
    "status": "Status",
    "notStarted": "Not Started",
    "inProgress": "In Progress"
  }
}
```

## Testing Checklist

### Student Flow

- [ ] Student can view list of assigned exams
- [ ] Student can start a new exam (PENDING → IN_PROGRESS)
- [ ] Student can resume an in-progress exam
- [ ] Saved answers persist when navigating between questions
- [ ] Student can save individual answers
- [ ] Student can submit exam
- [ ] Student sees "submitted" status after submission
- [ ] Student can view "submitted" exam (shows "grading in progress")
- [ ] Student can view graded exam results with score and answers
- [ ] Status badges differentiate: PENDING, IN_PROGRESS, SUBMITTED, GRADED

### Teacher Flow

- [ ] Teacher can view all exams for a class
- [ ] Teacher can see stats: total, started, submitted, graded
- [ ] Teacher can click "View Results" on published exam
- [ ] Teacher sees table with all students and their status
- [ ] Teacher can click on a student to view detailed submission
- [ ] Teacher can view each question with student's answer
- [ ] Teacher can grade short-answer questions
- [ ] Teacher can add feedback to graded answers

---

## Next Steps

1. **Review this spec** - Confirm priorities and scope
2. **Verify backend endpoints** - Test existing endpoints return correct data
3. **Create frontend components** - Phase 1 + Phase 2 in parallel
4. **Add E2E tests** - For critical flows

¿Empezamos con Phase 1?
