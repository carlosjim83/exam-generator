# Spec: Dashboard Class Exams Integration

## Overview

Change the dashboard's "Recent Exams" section to display `ClassExam` entities instead of `Exam` entities. This provides accurate publication status (`isPublished`) and better reflects the teacher's actual workflow.

## Problem Statement

Currently, the dashboard shows generic `Exam` entities which:

- Don't have a publication status (always show as "Draft")
- Don't reflect whether the exam is assigned to any class
- Are confusing for teachers who expect to see their "active" exams

## Solution

Display `ClassExam` entities (exams assigned to classes) which have:

- `isPublished` boolean field
- Relationship to a specific class
- Actual publication status

## Domain Model

### Current Model

```
Exam (teacher-created)
├── id
├── title
├── questions
└── createdAt

ClassExam (assigned to class)
├── id
├── examId
├── classId
├── isPublished ← THE IMPORTANT FIELD
├── assignedAt
└── dueDate (optional)
```

### New Dashboard Data Model

```typescript
interface DashboardClassExam {
  id: string;
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  isPublished: boolean;
  questionCount: number;
  assignedAt: Date;
  dueDate?: Date;
}
```

## Backend Changes

### 1. New Use Case: ListRecentClassExamsUseCase

**Location**: `backend/src/application/use-cases/class-exams/`

**Input**:

```typescript
interface ListRecentClassExamsInput {
  userId: string;
  limit?: number;
}
```

**Output**:

```typescript
interface ListRecentClassExamsOutput {
  classExams: {
    id: string;
    examId: string;
    examTitle: string;
    classId: string;
    className: string;
    isPublished: boolean;
    questionCount: number;
    assignedAt: Date;
    dueDate?: Date;
  }[];
}
```

### 2. Repository Method

Add to `IClassExamRepository`:

```typescript
findRecentByTeacherId(teacherId: string, limit: number): Promise<ClassExam[]>;
```

### 3. API Endpoint

**GET** `/api/dashboard/class-exams`

**Response 200**:

```json
{
  "classExams": [
    {
      "id": "uuid",
      "examId": "uuid",
      "examTitle": "Mid-term Exam",
      "classId": "uuid",
      "className": "Mathematics 101",
      "isPublished": true,
      "questionCount": 20,
      "assignedAt": "2024-01-15T10:00:00Z",
      "dueDate": "2024-01-20T23:59:59Z"
    }
  ]
}
```

## Frontend Changes

### 1. New Type: DashboardClassExam

**Location**: `frontend/lib/types/dashboard.types.ts`

```typescript
export interface DashboardClassExam {
  id: string;
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  isPublished: boolean;
  questionCount: number;
  assignedAt: Date;
  dueDate?: Date;
}
```

### 2. Update DashboardContext

**Location**: `frontend/features/dashboard/context/DashboardContext.tsx`

- Change `exams: Exam[]` to `classExams: DashboardClassExam[]`
- Update `getRecentExams()` to call new endpoint
- Update loading and error states

### 3. Update RecentExams Component

**Location**: `frontend/features/dashboard/components/RecentExams.tsx`

- Update to use `DashboardClassExam` instead of `Exam`
- Show class name alongside exam title
- Keep publication status badge (now accurate!)

### 4. Update ApiDashboardService

**Location**: `frontend/lib/providers/api-dashboard.service.ts`

```typescript
async getRecentClassExams(limit: number = 5): Promise<DashboardClassExam[]> {
  const response = await this.fetchWithAuth<{
    classExams: any[];
  }>('/api/dashboard/class-exams');

  if (!response) return [];

  return response.classExams.map((ce) => ({
    id: ce.id,
    examId: ce.examId,
    examTitle: ce.examTitle,
    classId: ce.classId,
    className: ce.className,
    isPublished: ce.isPublished,
    questionCount: ce.questionCount,
    assignedAt: new Date(ce.assignedAt),
    dueDate: ce.dueDate ? new Date(ce.dueDate) : undefined,
  }));
}
```

## i18n Translations

### English

```json
{
  "dashboard": {
    "recentClassExams": {
      "title": "Recent Exams",
      "viewAll": "View All",
      "published": "Published",
      "draft": "Draft",
      "viewExam": "View Exam",
      "editDraft": "Edit",
      "assignedTo": "Assigned to {{className}}",
      "questions": "questions"
    }
  }
}
```

### Spanish

```json
{
  "dashboard": {
    "recentClassExams": {
      "title": "Exámenes Recientes",
      "viewAll": "Ver Todos",
      "published": "Publicado",
      "draft": "Borrador",
      "viewExam": "Ver Examen",
      "editDraft": "Editar",
      "assignedTo": "Asignado a {{className}}",
      "questions": "preguntas"
    }
  }
}
```

## Testing Strategy

### Backend Tests

1. **Unit**: ListRecentClassExamsUseCase
   - Returns class exams ordered by assignedAt DESC
   - Respects limit parameter
   - Only returns teacher's own class exams
   - Handles empty results

2. **Integration**: GET /api/dashboard/class-exams
   - Returns 200 with correct data
   - Returns 401 if not authenticated
   - Limits results correctly

### Frontend Tests

1. **Unit**: DashboardContext
   - Fetches and stores class exams correctly
   - Handles loading states
   - Handles errors gracefully

2. **Component**: RecentExams
   - Renders class exam cards correctly
   - Shows publication status badge
   - Displays class name
   - Links to correct exam detail page

3. **E2E**: Dashboard Flow
   - Teacher sees recent class exams on login
   - Publication status is accurate
   - Clicking exam navigates to detail

## Database Queries

### Prisma Query

```typescript
const classExams = await prisma.classExam.findMany({
  where: {
    class: {
      teacherId: teacherId,
    },
  },
  include: {
    exam: {
      select: {
        id: true,
        title: true,
        questions: true,
      },
    },
    class: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    assignedAt: 'desc',
  },
  take: limit,
});
```

## Migration Plan

### Phase 1: Backend (PR #1)

1. Create ListRecentClassExamsUseCase
2. Add repository method
3. Create API endpoint
4. Add tests

### Phase 2: Frontend (PR #2)

1. Add DashboardClassExam type
2. Update DashboardContext
3. Update RecentExams component
4. Update ApiDashboardService
5. Add i18n translations
6. Add/update tests

## Acceptance Criteria

- [ ] Dashboard shows class exams instead of generic exams
- [ ] Publication status (isPublished) is accurate and real-time
- [ ] Each exam shows which class it's assigned to
- [ ] "Published" exams show as published (not always draft)
- [ ] Navigation from dashboard to exam detail works
- [ ] All tests pass (unit, integration, E2E)
- [ ] i18n translations complete (EN/ES)
- [ ] No console errors
- [ ] Responsive design works on mobile

## Notes

- This change makes the dashboard more useful for teachers
- Class exams better represent "active" exams vs "draft" exams
- We may want to add a separate "My Exam Templates" section later for unassigned exams
