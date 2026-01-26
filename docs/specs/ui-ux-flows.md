# User Interface Specification

**Version**: 1.0  
**Last Updated**: 2026-01-26

---

## Overview

This document specifies the user interface flows and screens for the Exam Generator application.

---

## User Roles & Access

### Teacher (Primary User - MVP)
- Full access to all features
- Can upload documents, generate exams, manage content

### Student (Future Feature)
- View assigned exams
- Take exams and submit answers
- View results and feedback

---

## Application Structure

```
┌─────────────────────────────────────────────────────┐
│  Public Routes (No Auth)                            │
├─────────────────────────────────────────────────────┤
│  /login          - Login page (local + OAuth)       │
│  /register       - Registration page                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Protected Routes (Authenticated Teachers)          │
├─────────────────────────────────────────────────────┤
│  /dashboard      - Teacher dashboard (home)         │
│  /documents      - Document library                 │
│  /documents/new  - Upload new document              │
│  /exams          - Exam library                     │
│  /exams/new      - Exam generator wizard           │
│  /exams/:id      - Exam review/edit                 │
│  /profile        - User profile settings            │
└─────────────────────────────────────────────────────┘
```

---

## Screen Specifications

### 1. Login Page (`/login`)

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│                   [LOGO] Exam Generator              │
│                                                      │
│   ┌────────────────────────────────────────────┐   │
│   │  Email                                      │   │
│   │  [_________________________________]        │   │
│   │                                             │   │
│   │  Password                                   │   │
│   │  [_________________________________]        │   │
│   │                                             │   │
│   │  [ ] Remember me    [Forgot password?]     │   │
│   │                                             │   │
│   │  [        Login        ]                   │   │
│   │                                             │   │
│   │  ─────────── or ────────────               │   │
│   │                                             │   │
│   │  [ Continue with Google    🔵 ]            │   │
│   │  [ Continue with GitHub    ⚫ ]            │   │
│   │  [ Continue with Microsoft 🟦 ]            │   │
│   │                                             │   │
│   │  Don't have an account? [Sign up]          │   │
│   └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Features**:
- Email/password form validation
- OAuth buttons with brand colors
- "Remember me" checkbox (7-day refresh token)
- Link to registration page
- Error messages (inline, red)
- Loading state on submit

---

### 2. Dashboard (`/dashboard`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  [Dashboard] Documents  Exams                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Welcome back, John! 👋                                      │
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐ │
│  │  📚 Documents   │ │  📝 Exams       │ │  ⏱️ Recent   │ │
│  │  ─────────────  │ │  ─────────────  │ │  ──────────  │ │
│  │      42         │ │      18         │ │  Activity    │ │
│  │  Total uploaded │ │  Generated      │ │  Last 7 days │ │
│  └─────────────────┘ └─────────────────┘ └──────────────┘ │
│                                                              │
│  Quick Actions                                               │
│  ┌──────────────────────────────┐ ┌────────────────────┐   │
│  │ ➕ Upload New Document       │ │ ✨ Generate Exam   │   │
│  └──────────────────────────────┘ └────────────────────┘   │
│                                                              │
│  Recent Documents                             [View all →]  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📄 Biology Chapter 3.pdf                             │  │
│  │    Uploaded 2 hours ago • 2.3 MB • Ready             │  │
│  │    [Generate Exam] [Download] [Delete]               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📄 Chemistry Notes.docx                              │  │
│  │    Uploaded yesterday • 1.8 MB • Ready               │  │
│  │    [Generate Exam] [Download] [Delete]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Recent Exams                                 [View all →]  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📝 Cell Division Quiz                                │  │
│  │    Created today • 10 questions • Biology Chapter 3  │  │
│  │    [View] [Edit] [Export] [Delete]                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Stats cards (total documents, exams, recent activity)
- Quick action buttons (prominent CTAs)
- Recent documents list (last 5)
- Recent exams list (last 5)
- Links to full libraries

---

### 3. Document Library (`/documents`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard [Documents] Exams                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  My Documents                          [➕ Upload Document]  │
│                                                              │
│  [Search documents...] [Filter: All ▼] [Sort: Recent ▼]     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📄 Biology Chapter 3.pdf                    ✅ Ready  │  │
│  │    2.3 MB • Uploaded 2 hours ago                      │  │
│  │    87 chunks indexed • Used in 3 exams                │  │
│  │    [Generate Exam] [Download] [⋮]                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📄 Chemistry Notes.docx                     ✅ Ready  │  │
│  │    1.8 MB • Uploaded yesterday                        │  │
│  │    64 chunks indexed • Used in 1 exam                 │  │
│  │    [Generate Exam] [Download] [⋮]                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📄 Physics Lecture.pdf                  🔄 Processing │  │
│  │    4.5 MB • Uploaded 5 minutes ago                    │  │
│  │    [Processing... 60%]                                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📄 Math Formulas.pdf                         ❌ Failed│  │
│  │    890 KB • Uploaded 3 days ago                       │  │
│  │    Error: No text found in document                   │  │
│  │    [Retry] [Delete]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Previous]  Page 1 of 3  [Next →]                        │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Upload button (prominent, top-right)
- Search bar (filters by title/filename)
- Filter dropdown (All/Ready/Processing/Failed)
- Sort dropdown (Recent/Oldest/Name A-Z/Size)
- Document cards with:
  - File icon + name
  - Status badge (Ready/Processing/Failed)
  - Metadata (size, upload date, chunk count)
  - Action buttons (Generate Exam, Download, More)
- Processing indicator (progress bar)
- Error messages for failed documents
- Pagination

---

### 4. Upload Document (`/documents/new`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard  Documents  Exams                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [← Back to Documents]                                       │
│                                                              │
│  Upload New Document                                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │           📁                                            │ │
│  │                                                         │ │
│  │     Drag & drop your document here                     │ │
│  │                or                                       │ │
│  │         [Choose File]                                   │ │
│  │                                                         │ │
│  │  Supported formats: PDF, DOCX                          │ │
│  │  Maximum size: 10 MB                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Document Title (optional)                                   │
│  [_________________________________________________]         │
│                                                              │
│  [Cancel]                                    [Upload]       │
└──────────────────────────────────────────────────────────────┘
```

**Upload in Progress**:
```
┌────────────────────────────────────────────────────┐
│  Uploading Biology Chapter 3.pdf                   │
│  ────────────────────────────────── 75%            │
│  2.3 MB • Uploading to cloud...                    │
│                                                     │
│  [Cancel Upload]                                   │
└────────────────────────────────────────────────────┘
```

**Upload Complete**:
```
┌────────────────────────────────────────────────────┐
│  ✅ Upload Complete!                                │
│                                                     │
│  Biology Chapter 3.pdf is now processing...        │
│  This usually takes 10-30 seconds.                 │
│                                                     │
│  [View Document] [Upload Another]                  │
└────────────────────────────────────────────────────┘
```

**Features**:
- Drag & drop zone (large, centered)
- File picker fallback
- File format validation (client-side)
- File size validation (client-side)
- Optional title field (defaults to filename)
- Upload progress bar
- Success/error states
- Quick actions after upload

---

### 5. Exam Generator Wizard (`/exams/new`)

**Step 1: Select Documents**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard  Documents  Exams                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [← Back to Exams]                                           │
│                                                              │
│  Generate New Exam                                           │
│                                                              │
│  ● Step 1: Select Documents  ○ Step 2: Configure Exam       │
│                                                              │
│  Choose which documents to use for this exam                 │
│  [Search documents...]                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ☑️ Biology Chapter 3.pdf                               │ │
│  │    87 chunks • 2.3 MB                                   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ☑️ Chemistry Notes.docx                                │ │
│  │    64 chunks • 1.8 MB                                   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ☐ Physics Lecture.pdf                                  │ │
│  │    120 chunks • 4.5 MB                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  2 documents selected                                        │
│                                                              │
│  [Cancel]                                     [Next Step →] │
└──────────────────────────────────────────────────────────────┘
```

**Step 2: Configure Exam**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard  Documents  Exams                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [← Back to Exams]                                           │
│                                                              │
│  Generate New Exam                                           │
│                                                              │
│  ✓ Step 1: Select Documents  ● Step 2: Configure Exam       │
│                                                              │
│  Exam Configuration                                          │
│                                                              │
│  Topic or Focus Area                                         │
│  [_________________________________________________]         │
│  e.g., "Cell division and mitosis"                           │
│                                                              │
│  Number of Questions                                         │
│  [─────●─────────────────────] 10 questions                 │
│  (1 - 50 questions)                                          │
│                                                              │
│  Question Type                                               │
│  (•) Multiple Choice    ( ) True/False    ( ) Short Answer  │
│                                                              │
│  Difficulty Level                                            │
│  (•) Mixed    ( ) Easy    ( ) Medium    ( ) Hard            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ℹ️ Selected Documents:                                  │ │
│  │ • Biology Chapter 3.pdf                                 │ │
│  │ • Chemistry Notes.docx                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [← Back]  [Cancel]                  [Generate Exam ✨]     │
└──────────────────────────────────────────────────────────────┘
```

**Generating State**:
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                       🤖                                     │
│                                                              │
│           Generating Your Exam...                            │
│                                                              │
│  ✓ Analyzing selected documents                             │
│  ✓ Finding relevant content about "Cell division"           │
│  → Creating 10 multiple-choice questions...                 │
│                                                              │
│  This usually takes 10-15 seconds.                           │
│                                                              │
│  [────────────────────── 60%]                               │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Multi-step wizard (2 steps)
- Step 1: Checkbox list of ready documents
- Step 2: Form with:
  - Topic/focus text input
  - Question count slider (1-50)
  - Question type radio buttons (MVP: only multiple-choice enabled)
  - Difficulty radio buttons
- Selected documents summary
- Loading state with progress indicator
- Auto-redirect to exam review on success

---

### 6. Exam Review/Edit (`/exams/:id`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard  Documents  [Exams]                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [← Back to Exams]                                           │
│                                                              │
│  Cell Division and Mitosis - Exam                 [Edit ✏️] │
│  Created today • 10 questions • Multiple Choice              │
│                                                              │
│  Source Documents:                                           │
│  • Biology Chapter 3.pdf                                     │
│                                                              │
│  [Export PDF] [Export JSON] [Duplicate] [Delete]            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Question 1                               [Easy 🟢]     │ │
│  │                                                         │ │
│  │ What is the primary purpose of mitosis?                │ │
│  │                                                         │ │
│  │ ○ A. To produce gametes                                │ │
│  │ ● B. To create two identical daughter cells           │ │
│  │ ○ C. To reduce chromosome number                       │ │
│  │ ○ D. To increase genetic variation                     │ │
│  │                                                         │ │
│  │ ✓ Correct Answer: B                                    │ │
│  │                                                         │ │
│  │ [Show Explanation ▼]                                   │ │
│  │ Mitosis is the process of cell division that produces │ │
│  │ two genetically identical daughter cells...            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Question 2                            [Medium 🟡]      │ │
│  │ ...                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Show all questions]                                        │
└──────────────────────────────────────────────────────────────┘
```

**Edit Mode**:
```
┌────────────────────────────────────────────────────────┐
│ Question 1                           [Easy ▼] [Delete] │
│                                                         │
│ [_________________________________________________]    │
│ What is the primary purpose of mitosis?                │
│                                                         │
│ A. [______________________________________________]    │
│ B. [______________________________________________]    │
│ C. [______________________________________________]    │
│ D. [______________________________________________]    │
│                                                         │
│ Correct Answer: [B ▼]                                  │
│                                                         │
│ Explanation:                                            │
│ [_________________________________________________]    │
│ [_________________________________________________]    │
│                                                         │
│ [Cancel] [Save Changes]                                │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Exam metadata header (title, date, question count)
- Source documents list
- Action buttons (Export, Duplicate, Delete)
- Question cards (collapsed by default)
- Each card shows:
  - Question number + difficulty badge
  - Question text
  - Options (correct one highlighted)
  - Expandable explanation
- Edit mode:
  - Inline editing
  - Change difficulty
  - Reorder questions (drag & drop - future)
  - Delete individual questions
- Save/cancel buttons in edit mode

---

### 7. Exam Library (`/exams`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  [≡] Exam Generator         [Search...]      [Profile ▼]    │
├──────────────────────────────────────────────────────────────┤
│  Dashboard  Documents  [Exams]                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  My Exams                                [✨ Generate Exam]  │
│                                                              │
│  [Search exams...] [Filter: All ▼] [Sort: Recent ▼]         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📝 Cell Division Quiz                                │  │
│  │    10 questions • Multiple Choice • Mixed difficulty │  │
│  │    Created today • From: Biology Chapter 3           │  │
│  │    [View] [Edit] [Export] [⋮]                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 📝 Chemical Reactions Test                           │  │
│  │    15 questions • Multiple Choice • Hard             │  │
│  │    Created 2 days ago • From: Chemistry Notes        │  │
│  │    [View] [Edit] [Export] [⋮]                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Previous]  Page 1 of 2  [Next →]                        │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Generate Exam button (prominent)
- Search bar
- Filter by question type/difficulty
- Sort options
- Exam cards with metadata
- Quick actions (View, Edit, Export, More)
- Pagination

---

## Design System

### Colors
- **Primary**: Blue (#3B82F6) - CTAs, links
- **Success**: Green (#10B981) - Ready status, correct answers
- **Warning**: Yellow (#F59E0B) - Processing status
- **Error**: Red (#EF4444) - Failed status, validation errors
- **Neutral**: Gray scale (#F3F4F6 to #1F2937)

### Typography
- **Headings**: Inter Bold (H1: 32px, H2: 24px, H3: 20px)
- **Body**: Inter Regular (16px)
- **Small**: Inter Regular (14px)
- **Monospace**: JetBrains Mono (code, IDs)

### Components (shadcn/ui)
- Button (primary, secondary, ghost)
- Card
- Input
- Textarea
- Select / Dropdown
- Checkbox
- Radio Group
- Slider
- Badge (status indicators)
- Dialog / Modal
- Toast (notifications)
- Progress Bar
- Tabs

### Spacing
- Base unit: 4px
- Small gap: 8px (2 units)
- Medium gap: 16px (4 units)
- Large gap: 32px (8 units)
- Container padding: 24px

---

## Responsive Behavior

### Desktop (>1024px)
- Sidebar navigation (collapsible)
- Multi-column layouts
- Hover states on cards/buttons

### Tablet (768px - 1024px)
- Simplified navigation (top bar)
- Single column layouts
- Touch-friendly targets (44px min)

### Mobile (<768px)
- Hamburger menu
- Stacked cards
- Bottom sheet for actions
- Simplified forms (fewer fields per screen)

---

## Accessibility

- **Keyboard Navigation**: All actions accessible via keyboard
- **Screen Readers**: Proper ARIA labels, semantic HTML
- **Color Contrast**: WCAG AA compliance (4.5:1 text, 3:1 UI)
- **Focus Indicators**: Visible focus rings
- **Alt Text**: Images and icons have descriptive text
- **Error Handling**: Clear, actionable error messages

---

## Related Documentation
- See `docs/specs/auth-flow.md` for authentication flows
- See `docs/specs/document-upload.md` for document processing
- See `docs/specs/exam-generation.md` for exam generation logic
- See `docs/architecture.md` for system overview

**Last Updated**: 2026-01-26
