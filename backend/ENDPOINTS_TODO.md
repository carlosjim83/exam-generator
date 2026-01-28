# Backend Endpoints TODO

## 📋 Existing Endpoints

### Auth

- ✅ `POST /auth/register` - Register new user
- ✅ `POST /auth/login` - Login user
- ✅ `POST /auth/refresh` - Refresh access token
- ✅ `GET /auth/google/callback` - OAuth callback
- ✅ `GET /auth/google/mock` - Mock OAuth (development)

### Documents

- ✅ `POST /documents/upload` - Upload document
- ✅ `GET /documents` - List user documents
- ✅ `GET /documents/:id` - Get document by ID
- ✅ `POST /documents/:id/process` - Trigger document processing

### Protected

- ✅ `GET /api/profile` - Get user profile
- ✅ `GET /api/teacher/dashboard` - Teacher dashboard (basic stats)

---

## 🚧 Missing Endpoints (Frontend Needs)

### Dashboard Stats

**Priority: HIGH**

- ❌ `GET /api/dashboard/stats` - Get comprehensive dashboard statistics
  ```json
  Response: {
    "totalDocuments": 128,
    "totalExams": 42,
    "documentsChange": "+12% this month",
    "examsChange": "+5% from last term",
    "lastActivity": {
      "timestamp": "2024-01-28T10:30:00Z",
      "description": "Last edit on 'Introduction to Calculus'"
    }
  }
  ```

**Notes:**

- Current `/api/teacher/dashboard` only returns hardcoded `totalDocuments: 10` and `totalExams: 5`
- Need to calculate real counts from database
- Need to calculate percentage changes (compare with previous period)
- Need to fetch last activity from document/exam updates

**Implementation:**

- Add `DashboardStatsUseCase`
- Query document count: `SELECT COUNT(*) FROM documents WHERE userId = ?`
- Query exam count: `SELECT COUNT(*) FROM exams WHERE userId = ?` (exams table doesn't exist yet!)
- Calculate change percentages (requires date filtering)
- Get last activity: `SELECT * FROM documents ORDER BY updatedAt DESC LIMIT 1`

---

### Documents

**Priority: MEDIUM**

- ❌ `GET /api/documents/recent?limit=5` - Get recent documents (shortcut for dashboard)
  - Currently `/documents` endpoint exists but might return all documents
  - Need to verify if it supports `limit` query param
  - Should order by `uploadedAt DESC` or `updatedAt DESC`

**Notes:**

- The existing `GET /documents` endpoint might already support this
- Check `ListDocumentsUseCase` to see if limit is supported
- If not, add query param: `?limit=5&orderBy=uploadedAt&order=desc`

---

### Exams (NOT IMPLEMENTED AT ALL!)

**Priority: HIGH**

The entire Exam domain is missing from the backend:

- ❌ `GET /api/exams` - List user exams

  ```json
  Response: {
    "exams": [
      {
        "id": "uuid",
        "title": "Midterm Exam: Modern History",
        "status": "published" | "draft" | "archived",
        "questionsCount": 25,
        "gradeLevel": "10th Grade",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z"
      }
    ]
  }
  ```

- ❌ `GET /api/exams/recent?limit=5` - Get recent exams (for dashboard)
- ❌ `POST /api/exams` - Create new exam
- ❌ `GET /api/exams/:id` - Get exam by ID
- ❌ `PUT /api/exams/:id` - Update exam
- ❌ `DELETE /api/exams/:id` - Delete exam
- ❌ `POST /api/exams/:id/publish` - Publish exam
- ❌ `POST /api/exams/:id/archive` - Archive exam

**Database Schema Needed:**

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'draft', 'published', 'archived'
  questions_count INTEGER NOT NULL,
  grade_level VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer', 'essay'
  correct_answer TEXT,
  options JSONB, -- For multiple choice: ["A", "B", "C", "D"]
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Implementation Steps:**

1. Create domain layer:
   - `backend/src/domain/entities/Exam.ts`
   - `backend/src/domain/entities/ExamQuestion.ts`
   - `backend/src/domain/repositories/IExamRepository.ts`
   - `backend/src/domain/value-objects/ExamId.ts`

2. Create application layer:
   - `backend/src/application/use-cases/exams/CreateExamUseCase.ts`
   - `backend/src/application/use-cases/exams/ListExamsUseCase.ts`
   - `backend/src/application/use-cases/exams/GetExamUseCase.ts`
   - `backend/src/application/use-cases/exams/UpdateExamUseCase.ts`
   - `backend/src/application/use-cases/exams/DeleteExamUseCase.ts`
   - `backend/src/application/use-cases/exams/PublishExamUseCase.ts`

3. Create infrastructure layer:
   - `backend/src/infrastructure/repositories/PrismaExamRepository.ts`
   - Update Prisma schema
   - Run migration

4. Create presentation layer:
   - `backend/src/routes/exam.routes.ts`
   - Register routes in `server.ts`

---

## 🎯 Implementation Priority

### Phase 1: Dashboard Stats (Quick Win)

1. ✅ Fix `/api/teacher/dashboard` to return real counts
2. ✅ Add `GET /api/dashboard/stats` with activity tracking
3. ✅ Verify `/api/documents` supports limit/pagination

**Estimated Time:** 2-4 hours

### Phase 2: Exam Domain (Major Feature)

1. ❌ Design Exam domain model
2. ❌ Create database schema & migration
3. ❌ Implement use cases
4. ❌ Add REST endpoints
5. ❌ Write tests (unit + integration + E2E)

**Estimated Time:** 2-3 days

### Phase 3: Advanced Features

- Exam generation from documents (AI integration)
- Exam templates
- Question bank
- Analytics & reporting

**Estimated Time:** 1-2 weeks

---

## 📝 Notes for Implementation

### Current Dashboard Endpoint Issue

The existing `/api/teacher/dashboard` returns hardcoded data:

```typescript
return reply.send({
  message: 'Welcome to teacher dashboard',
  data: {
    totalDocuments: 10, // ❌ HARDCODED
    totalExams: 5, // ❌ HARDCODED
  },
});
```

**Fix:** Query real counts from database using repositories.

### Documents Endpoint Verification Needed

Check if `GET /documents` endpoint in `document.routes.ts` supports:

- Query params: `?limit=5`
- Ordering: `?orderBy=uploadedAt&order=desc`

If not, the frontend will need to fetch all documents and slice them client-side (not ideal).

---

## 🔗 Related Files

- Frontend Dashboard Service: `frontend/lib/services/dashboard.service.ts`
- Frontend API Implementation: `frontend/lib/providers/api-dashboard.service.ts`
- Backend Protected Routes: `backend/src/routes/protected.routes.ts`
- Backend Document Routes: `backend/src/routes/document.routes.ts`

---

**Last Updated:** 2026-01-28
**Maintained By:** Development Team
