# Spec: Class Resources - Teacher Document Sharing

**Status**: Draft  
**Created**: 2026-02-28  
**Author**: Senior Architect  
**Related ADRs**: [ADR 0006](../adr/0006-file-storage.md), [ADR 0009](../adr/0009-clean-architecture.md)

---

## Executive Summary

Enable teachers to share uploaded documents with students in their classes. This allows students to view class materials (PDFs, DOCX) that teachers have uploaded for exam generation, creating a proper LMS-like resource sharing experience.

---

## Problem Statement

Currently:

- Teachers upload documents for exam generation
- Documents are stored under `userId` only (personal storage)
- Students have **no access** to teacher's documents
- No relationship between `Document` and `Class` entities

This creates a gap in the product: students cannot study from the materials their teachers uploaded.

---

## Competitor Analysis

| Platform             | Resource Org            | Student Access      | Permissions                                       | Key Feature                   |
| -------------------- | ----------------------- | ------------------- | ------------------------------------------------- | ----------------------------- |
| **Moodle**           | Sections/Topics         | Browse & download   | Show/Hide, Date restrictions, Completion tracking | Fine-grained permissions      |
| **Google Classroom** | Classwork tabs (topics) | View via Drive      | View/Edit/Copy per file                           | Simplicity, Drive integration |
| **Canvas**           | Modules (linear)        | Browse & preview    | Publish/Unpublish, Prerequisites                  | DocViewer preview             |
| **Blackboard**       | Folders/Modules         | Conditional release | Date-based, Group-based                           | Analytics                     |

### Key Patterns Identified

1. **Organization**: Folders/topics are universal
2. **Permissions**: Publish/unpublish toggle (all platforms)
3. **Access Control**: Date restrictions (available from/to)
4. **Preview**: Some platforms offer inline preview

### Recommended MVP Approach

- **Phase 1**: Basic sharing (publish/unpublish toggle)
- **Phase 2**: Organization (folders) - post-MVP
- **Phase 3**: Advanced features (date restrictions, tracking) - post-MVP

Focus on **Phase 1** for this spec.

---

## Requirements

### Functional Requirements

#### FR-001: Teacher Resource Management

- Teachers can view all documents they've uploaded
- Teachers can share documents with specific classes
- Teachers can unshare documents from classes
- Teachers can see which classes a document is shared with

#### FR-002: Student Resource Access

- Students can view documents shared with their enrolled classes
- Students can download documents (via SAS URL)
- Students cannot access documents from classes they're not enrolled in
- Students see only "published" resources

#### FR-003: Access Control

- Documents start as "private" (not shared with any class)
- Sharing is explicit (teacher must choose to share)
- One document can be shared with multiple classes

### Non-Functional Requirements

#### NFR-001: Security

- Students cannot access documents from other classes
- SAS URLs are time-limited (1 hour)
- Verify enrollment before generating download URL

#### NFR-002: Performance

- Document list should load in < 500ms
- Pagination for large document lists (>50 items)

#### NFR-003: UX

- Clear indicator of which documents are shared/unshared
- Easy toggle to share/unshare
- Students see organized list by class

---

## Domain Model

### New Entity: `ClassDocument`

**Purpose**: Many-to-many relationship between Classes and Documents with visibility settings.

```
┌─────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│     Class       │       │   ClassDocument     │       │   Document   │
├─────────────────┤       ├─────────────────────┤       ├──────────────┤
│ id              │──┐    │ id                  │    ┌──│ id           │
│ teacherId       │  │    │ classId (FK)        │──┐│  │ userId       │
│ name            │  └───▶│ documentId (FK)     │  ││  │ title        │
│ code            │       │ isVisible           │◀┘│  │ filename     │
│ description     │       │ publishedAt         │  │  │ status       │
│ createdAt       │       │ orderIndex          │  │  │ ...          │
└─────────────────┘       │ createdAt           │  │  └──────────────┘
                          │ updatedAt           │  │
                          └─────────────────────┘  │
                                                    │
                          ┌─────────────────────┐  │
                          │ StudentEnrollment   │  │
                          ├─────────────────────┤  │
                          │ classId (FK)        │──┘
                          │ studentId (FK)      │──▶ Student can access
                          │ joinedAt            │     all published documents
                          └─────────────────────┘     in enrolled classes
```

### Entity Definitions

```typescript
// ClassDocument Entity
interface ClassDocumentProps {
  id: ClassDocumentId;
  classId: ClassId;
  documentId: DocumentId;
  isVisible: boolean;          // Published or draft
  publishedAt: Date | null;    // When it was published
  orderIndex: number;          // For ordering in list
  createdAt: Date;
  updatedAt: Date;
}

// Business Rules
- A document can be shared with multiple classes
- A class can have multiple documents
- isVisible = true means students can see it
- orderIndex determines display order (lower = first)
```

### Database Schema

```prisma
// Add to schema.prisma

model ClassDocument {
  id          String    @id @default(uuid())
  classId     String    @map("class_id")
  documentId  String    @map("document_id")
  isVisible   Boolean   @default(false) @map("is_visible")
  publishedAt DateTime? @map("published_at")
  orderIndex  Int       @default(0) @map("order_index")

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([classId, documentId]) // One entry per class-document pair
  @@map("class_documents")
  @@index([classId])
  @@index([documentId])
  @@index([classId, isVisible])
}

// Add relations to existing models
model Class {
  // ... existing fields
  documents   ClassDocument[]
}

model Document {
  // ... existing fields
  classDocuments ClassDocument[]
}
```

---

## API Endpoints

### Teacher Endpoints

#### GET /api/documents

List all documents for the authenticated teacher.

**Response**:

```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Introduction to Algebra",
      "filename": "algebra-intro.pdf",
      "status": "COMPLETED",
      "uploadedAt": "2026-02-28T10:00:00Z",
      "isShared": true,
      "sharedWith": [{ "classId": "uuid", "className": "Math 101", "isVisible": true }]
    }
  ],
  "total": 1
}
```

#### POST /api/documents/:documentId/share

Share a document with one or more classes.

**Request**:

```json
{
  "classIds": ["uuid-1", "uuid-2"]
}
```

**Response**:

```json
{
  "documentId": "uuid",
  "sharedWith": [
    { "classId": "uuid-1", "className": "Math 101", "isVisible": true },
    { "classId": "uuid-2", "className": "Math 102", "isVisible": true }
  ]
}
```

#### DELETE /api/documents/:documentId/share/:classId

Unshare a document from a class.

**Response**: 204 No Content

#### PATCH /api/documents/:documentId/visibility

Toggle visibility of a shared document.

**Request**:

```json
{
  "classId": "uuid",
  "isVisible": false
}
```

### Student Endpoints

#### GET /api/student/classes/:classId/documents

List all published documents for a class (student must be enrolled).

**Response**:

```json
{
  "class": {
    "id": "uuid",
    "name": "Math 101",
    "teacher": {
      "id": "uuid",
      "name": "Prof. Smith"
    }
  },
  "documents": [
    {
      "id": "uuid",
      "title": "Introduction to Algebra",
      "filename": "algebra-intro.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "publishedAt": "2026-02-28T10:00:00Z",
      "downloadUrl": null // Separate endpoint for URL
    }
  ]
}
```

#### GET /api/student/documents/:documentId/download-url

Get a temporary download URL for a document.

**Preconditions**:

- Student must be enrolled in a class that has this document shared
- Document must have `isVisible = true`

**Response**:

```json
{
  "downloadUrl": "https://storage.azure.net/...?sas_token",
  "expiresIn": 3600
}
```

---

## Use Cases

### UC-001: Share Document with Class (Teacher)

```
Actor: Teacher
Precondition: Teacher owns document, Teacher owns class

1. Teacher selects a document from their library
2. Teacher clicks "Share with Class"
3. System shows list of teacher's classes
4. Teacher selects classes to share with
5. System creates ClassDocument entries with isVisible = true
6. System sets publishedAt = now()
7. System returns updated document with sharing info

Postcondition: Document is visible to students in selected classes
```

### UC-002: View Class Resources (Student)

```
Actor: Student
Precondition: Student is enrolled in class

1. Student navigates to "My Classes"
2. Student selects a class
3. System verifies enrollment
4. System fetches all visible ClassDocuments for the class
5. System returns list of documents with metadata

Postcondition: Student sees list of shared documents
```

### UC-003: Download Document (Student)

```
Actor: Student
Precondition: Student enrolled in class, Document shared and visible

1. Student clicks "Download" on a document
2. Frontend requests download URL from backend
3. Backend verifies:
   a. Student is enrolled in class
   b. Document is shared with that class
   c. Document isVisible = true
4. Backend generates SAS URL (1 hour expiry)
5. Backend returns URL to frontend
6. Frontend opens URL in new tab / triggers download

Postcondition: Student can download file for 1 hour
```

---

## Frontend Components

### Teacher Side

#### DocumentsPage (existing, modified)

```
┌─────────────────────────────────────────────────────┐
│  My Documents                          [+ Upload]   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 Introduction to Algebra                     │ │
│  │    algebra-intro.pdf • 2.4 MB • Completed      │ │
│  │                                                │ │
│  │    Shared with:                                │ │
│  │    ┌─────────┐ ┌─────────┐ ┌───────────────┐ │ │
│  │    │ Math 101│ │ Math 102│ │ + Share with │ │ │
│  │    └─────────┘ └─────────┘ └───────────────┘ │ │
│  │                                                │ │
│  │    [Generate Exam] [Delete]                   │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### ShareDocumentModal

```
┌─────────────────────────────────────┐
│  Share "Introduction to Algebra"    │
│                                     │
│  Select classes:                    │
│  ┌───────────────────────────────┐ │
│  │ ☑ Math 101 (already shared)   │ │
│  │ ☑ Math 102 (already shared)   │ │
│  │ ☐ Physics 201                 │ │
│  │ ☐ Chemistry 101               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Cancel]              [Share]      │
└─────────────────────────────────────┘
```

### Student Side

#### ClassDetailPage (modifications)

```
┌─────────────────────────────────────────────────────┐
│  Math 101                              Prof. Smith   │
├─────────────────────────────────────────────────────┤
│  [Resources] [Exams] [Grades]                       │
├─────────────────────────────────────────────────────┤
│  Class Materials                                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 Introduction to Algebra        ↓ Download  │ │
│  │    Published Feb 28, 2026                      │ │
│  │    PDF • 2.4 MB                                │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 Advanced Calculus               ↓ Download  │ │
│  │    Published Feb 27, 2026                      │ │
│  │    PDF • 5.1 MB                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend (Priority: HIGH)

#### Step 1: Database Migration

- Add `ClassDocument` model to Prisma schema
- Run migration
- Update existing `Class` and `Document` entities

#### Step 2: Domain Layer

- Create `ClassDocument` entity
- Create `ClassDocumentId` value object
- Create repository interface `IClassDocumentRepository`

#### Step 3: Infrastructure Layer

- Implement `PrismaClassDocumentRepository`
- Add `shareDocument` and `unshareDocument` methods

#### Step 4: Application Layer

- Create `ShareDocumentWithClassUseCase`
- Create `UnshareDocumentUseCase`
- Create `GetClassDocumentsUseCase` (for students)
- Create `GetDocumentDownloadUrlUseCase` (for students)

#### Step 5: Routes Layer

- Add routes to existing `document.routes.ts`
- Add routes to `class.routes.ts` for student access

### Phase 2: Frontend (Priority: HIGH)

#### Step 1: API Client

- Add `shareDocument` and `unshareDocument` functions
- Add `getClassDocuments` and `getDownloadUrl` functions

#### Step 2: Teacher UI

- Modify `DocumentsPage` to show sharing status
- Create `ShareDocumentModal` component
- Add share/unshare actions

#### Step 3: Student UI

- Modify `ClassDetailPage` to add "Resources" tab
- Create `ClassResources` component
- Add download functionality with SAS URL

### Phase 3: Testing

#### Unit Tests

- `ClassDocument` entity creation and validation
- Repository methods
- Use cases

#### Integration Tests

- API endpoints
- Authorization (student can't access unshared documents)

#### E2E Tests

- Teacher shares document → Student sees document
- Student attempts to access unshared document → 403

---

## Security Considerations

### Authorization Matrix

| Action               | Teacher          | Student               |
| -------------------- | ---------------- | --------------------- |
| List own documents   | ✅               | ❌                    |
| Upload document      | ✅               | ❌                    |
| Share document       | ✅ (own docs)    | ❌                    |
| Unshare document     | ✅ (own docs)    | ❌                    |
| List class documents | ✅ (own classes) | ✅ (enrolled classes) |
| Download document    | ✅ (own docs)    | ✅ (shared & visible) |

### Validation Rules

```typescript
// ShareDocumentWithClassUseCase
validate() {
  // 1. Document must exist
  // 2. User must own document
  // 3. Class must exist
  // 4. User must own class (be teacher)
  // 5. Document must be COMPLETED status
}

// GetDocumentDownloadUrlUseCase
validate() {
  // 1. Document must exist
  // 2. Document must be COMPLETED
  // 3. Student must be enrolled in at least one class with this document
  // 4. ClassDocument.isVisible must be true
}
```

### SAS Token Security

- Same approach as current implementation
- Time-limited URLs (1 hour)
- Verify ownership/enrollment before generating

---

## Translations Required

### English (en/common.json)

```json
{
  "documents": {
    "shareWithClass": "Share with class",
    "unshare": "Unshare",
    "sharedWith": "Shared with",
    "notShared": "Not shared with any class",
    "selectClasses": "Select classes",
    "alreadyShared": "Already shared",
    "download": "Download",
    "publishedOn": "Published on"
  }
}
```

### Spanish (es/common.json)

```json
{
  "documents": {
    "shareWithClass": "Compartir con clase",
    "unshare": "Dejar de compartir",
    "sharedWith": "Compartido con",
    "notShared": "No compartido con ninguna clase",
    "selectClasses": "Seleccionar clases",
    "alreadyShared": "Ya compartido",
    "download": "Descargar",
    "publishedOn": "Publicado el"
  }
}
```

---

## Success Metrics

### MVP Success Criteria

- [ ] Teachers can share documents with classes
- [ ] Teachers can unshare documents
- [ ] Students can see shared documents in their classes
- [ ] Students can download shared documents
- [ ] Unauthorized access is blocked (403)

### Post-MVP Enhancements

- Folders/organization for documents
- Visibility toggle (draft/published)
- Date restrictions (available from/to)
- Download tracking (who downloaded what)
- Inline document preview (PDF viewer)

---

## Risks and Mitigations

| Risk                          | Impact | Mitigation                                |
| ----------------------------- | ------ | ----------------------------------------- |
| Students share download URLs  | Medium | SAS tokens expire in 1 hour               |
| Teacher accidentally unshares | Low    | Easy to re-share                          |
| Many documents slow list      | Low    | Pagination implemented                    |
| Document deleted while shared | Medium | Soft delete or prevent deletion if shared |

---

## Open Questions

1. **Q**: Should we prevent deletion of shared documents?
   **A**: Recommendation: Yes, require unsharing before deletion

2. **Q**: Should we track which students downloaded documents?
   **A**: Recommendation: Post-MVP feature (analytics)

3. **Q**: Should draft/published status be per-class or global?
   **A**: Recommendation: Per-class (same document can be published in one class, draft in another)

---

## Appendix: Similar Features in Production

### Moodle Resource Module

- Resources are activities in course sections
- Teachers can set visibility per resource
- Supports files, URLs, pages
- Completion tracking available

### Google Classroom

- Files attached to assignments or materials
- No separate "resource" module
- Simpler permission model

### Canvas Files

- Separate Files area per course
- Files can be unpublished
- Teachers can restrict to specific students

---

**Next Steps**:

1. Review this spec with stakeholders
2. Estimate effort (suggested: 2-3 days backend, 2 days frontend)
3. Create backend branch: `feature/class-resources-backend`
4. Create frontend branch: `feature/class-resources-frontend`
5. Follow ADR 0009 Clean Architecture for implementation
