# Spec: Class Resources Management

## Overview

A comprehensive system for teachers to share documents with classes and students to view shared materials. This replaces the current fragmented approach with a clean, intuitive interface inspired by industry-standard LMS platforms.

## Problem Statement

Current implementation has several issues:

1. **Share modal** doesn't allow unshare - can only add classes, not remove
2. **No visibility management** - can publish/unshare but no UI for it
3. **No teacher-centric view** - teachers can't see all their shared documents in one place
4. **Fragmented UX** - share icon shows badge but no details about which classes have visibility

## Research: How Other LMS Handle This

### Google Classroom

- **Classwork tab** - Central location for all materials
- Each item shows: title, post date, visibility (draft/published)
- Teachers can edit or delete any time
- **Organized by topics** (like folders)
- Materials can be scheduled for future publish

### Canvas

- **Modules** - Container for course content
- Items have states: Published, Unpublished, Scheduled
- Eye icon shows/hides visibility
- **Files tab** also exists with full file management
- Can set availability windows

### Moodle

- **Resources** with "Edit settings" -> "Show/Hide"
- Eye icon for visibility toggle
- Can restrict access by date, grade, etc.
- Activity completion tracking

### Blackboard

- **Content Collection** with visibility per item
- "Adaptive release" for conditional visibility
- Draft mode for teacher-only view

### Common Patterns

1. **Visibility toggle** (eye icon or switch) - one click to publish/unpublish
2. **Status badges** - Draft, Published, Scheduled
3. **Bulk actions** - Select multiple items, apply action
4. **Context menus** - Edit, Delete, Move, Hide/Show
5. **Two-level access**:
   - Teacher sees all (draft + published)
   - Student sees only published

---

## Domain Model

### Entities (Already exist, confirming)

```
ClassDocument {
  id: ClassDocumentId
  classId: ClassId
  documentId: DocumentId
  isVisible: boolean          // Published for students
  publishedAt: Date | null     // When it became visible
  orderIndex: number           // Display order in class
  createdAt: Date
  updatedAt: Date
}
```

### States

```
DocumentShareState:
  - NOT_SHARED        // Document exists, not shared with any class
  - SHARED_DRAFT      // Shared with class, not visible to students
  - SHARED_PUBLISHED  // Shared with class, visible to students
```

---

## User Stories

### Teacher Stories

#### US-T1: View My Shared Documents

**As a teacher**, I want to see all documents I've shared across all my classes, so I can manage them centrally.

**Acceptance Criteria:**

- Show list of all shared documents grouped by document
- For each document: title, # of classes shared with, visibility status
- Can expand to see which classes have access
- Show badge: "3 classes (2 published, 1 draft)"

#### US-T2: Share Document with Classes

**As a teacher**, I want to share a document with one or more classes, so my students can access it.

**Acceptance Criteria:**

- Select document from my library
- Open share modal
- See all my classes with checkboxes
- See which classes already have access (checked, disabled with badge)
- See visibility status for each already-shared class
- Can toggle visibility for already-shared classes
- Can add new classes to share with
- Can set initial visibility (Published immediately or Draft)

#### US-T3: Unshare Document from Class

**As a teacher**, I want to remove a document from a class, so students can no longer access it.

**Acceptance Criteria:**

- From document library: see shared classes, click "Remove" button
- From share modal: see shared classes, click X or "Remove" button
- Confirmation dialog before removing
- Removal preserves document in my library
- Student immediately loses access

#### US-T4: Publish/Unpublish Shared Document

**As a teacher**, I want to control when students can see a shared document, so I can prepare materials ahead of time.

**Acceptance Criteria:**

- Toggle visibility with one click (eye icon or switch)
- Status changes: Draft → Published → Draft
- Published shows published date
- Draft shows "Not visible to students"
- Changes take effect immediately for students

#### US-T5: Manage Class Resources Page

**As a teacher**, I want to see all resources for a specific class in one place, so I can organize class materials.

**Acceptance Criteria:**

- View all documents shared with this class
- See visibility status for each document
- Quick actions: Publish/Unpublish, Remove
- Drag to reorder (future: orderIndex)
- Can add new documents directly from this page

### Student Stories

#### US-S1: View Class Materials

**As a student**, I want to see all published materials for my class, so I can study and complete assignments.

**Acceptance Criteria:**

- Only see PUBLISHED documents (isVisible = true)
- Sorted by publishedAt (newest first) or orderIndex
- Show: title, file type icon, file size, published date
- Click to download
- Clear "No materials yet" state when empty

---

## UI Components

### 1. Document Library (Teacher)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📄 My Library                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Final Exam Syllabus.pdf                    [Share] [Download] │  │
│  │    2.4 MB · Uploaded Jan 15                                       │  │
│  │    🔗 Shared with 2 classes:                                      │  │
│  │       · Math 101 (✓ Published)                                    │  │
│  │       · Physics 201 ( ○ Draft)                              [Edit] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Chapter 1 Notes.pdf                                  [Share] │  │
│  │    1.1 MB · Uploaded Jan 10                                       │  │
│  │    🔗 Not shared with any class                              [Edit] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Share Modal (Enhanced)

```
┌──────────────────────────────────────────────────────────┐
│  Share "Final Exam Syllabus.pdf"                    [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Select classes to share with:                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ☑ Math 101                    Already shared       │  │
│  │     Code: MATH101 · 24 students                     │  │
│  │     [👁 Published] · Published Jan 15               │  │
│  │                                         [Remove]    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ☑ Physics 201                 Already shared       │  │
│  │     Code: PHYS201 · 18 students                    │  │
│  │     [ ○ Draft] · Not visible to students           │  │
│  │                                         [Remove]    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ☐ Chemistry 101               Not shared           │  │
│  │     Code: CHEM101 · 30 students                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ☐ Biology 101                  Not shared           │  │
│  │     Code: BIO101 · 22 students                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  For newly shared classes:                               │
│  [ ✓ ] Make visible to students immediately             │
│                                                          │
│                    [Cancel]  [Save Changes]              │
└──────────────────────────────────────────────────────────┘
```

### 3. Class Resources Page (Teacher View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📚 Math 101 > Resources                                               │
│                                                    [+ Add Document]     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Final Exam Syllabus.pdf                    [👁 Published]       │  │
│  │    2.4 MB · Published Jan 15               [Unpublish] [Remove] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Chapter 1 Notes.pdf                          [ ○ Draft]      │  │
│  │    1.1 MB · Not visible                 [Publish] [Remove]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Class Resources Page (Student View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📚 Math 101 > Materials                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Final Exam Syllabus.pdf                              [⬇️]   │  │
│  │    2.4 MB · PDF · Published Jan 15                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Chapter 1 Notes.pdf                                  [⬇️]   │  │
│  │    1.1 MB · PDF · Published Jan 10                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  No more materials.                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Existing (Confirmed Working)

- `POST /api/documents/:documentId/share` - Share with classes
- `DELETE /api/documents/:documentId/share/:classId` - Unshare from class
- `GET /api/documents/:documentId/shares` - Get shared classes with visibility
- `GET /api/classes/:classId/documents` - Get student-visible documents

### New (Need to Add)

- `PATCH /api/documents/:documentId/share/:classId` - Update visibility ✅ (Done)
- `GET /api/classes/:classId/documents/teacher` - Get all shared documents (teacher view, includes drafts)

---

## Implementation Phases

### Phase 1: Core Visibility Management ✅ (Done)

- [x] Backend: Update visibility use case
- [x] Backend: Tests for visibility update
- [x] Backend: PATCH endpoint
- [ ] Frontend: API service function

### Phase 2: Share Modal Enhancement (Next)

- [ ] ShareModal: Show already-shared classes with visibility status
- [ ] ShareModal: Add visibility toggle for each shared class
- [ ] ShareModal: Add "Remove" button for each shared class
- [ ] ShareModal: Unshare confirmation dialog

### Phase 3: Teacher Class Resources Page

- [ ] New page: `/teacher/classes/[id]/resources`
- [ ] List all documents shared with this class
- [ ] Quick actions: Publish/Unpublish, Remove
- [ ] Add document button opens share modal pre-filtered to this class

### Phase 4: Document Library Enhancement

- [ ] Show shared status for each document
- [ ] Expandable row showing which classes have access
- [ ] Quick edit from library view

### Phase 5: Polish

- [ ] Animations and transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design

---

## Open Questions

1. **Reordering**: Should teachers be able to reorder documents within a class?
   - Database has `orderIndex` field
   - Drag and drop UI would be nice

2. **Scheduled Publishing**: Should we support "publish on date"?
   - Would need job scheduler
   - Out of scope for now

3. **Bulk Actions**: Select multiple documents and share/unshare?
   - Future enhancement

4. **Student View Path**: Where in navigation?
   - Currently: Classes → Select Class → Materials tab
   - Works, but consider dedicated "Materials" section

---

## Notes for Implementation

- Use existing components: Dialog, Button, Badge, Checkbox
- Visibility toggle: Use Switch or Toggle component
- Consider using a table for document lists instead of cards (more compact, sortable)
- Cache share information to avoid refetching on every modal open
- Optimistic UI updates for better UX
