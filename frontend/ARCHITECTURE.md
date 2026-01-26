# Screaming Architecture - Frontend Structure

## 🏛️ Philosophy

> "The architecture should scream the intent of the system."  
> — Robert C. Martin (Uncle Bob)

When you open this codebase, you should **immediately understand** what the application does WITHOUT reading a single line of code.

## 📁 Folder Structure

```
frontend/
│
├── app/                          # Next.js App Router (routing only)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── dashboard/
│       └── page.tsx             # Dashboard route
│
├── features/                     # ⭐ FEATURES (Core of Screaming Architecture)
│   │
│   ├── dashboard/               # Dashboard feature
│   │   ├── components/          # Dashboard-specific components
│   │   │   ├── TopNavigation.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentDocuments.tsx
│   │   │   ├── RecentExams.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── hooks/               # (future) Dashboard-specific hooks
│   │   ├── services/            # (future) Dashboard-specific services
│   │   └── types/               # (future) Dashboard-specific types
│   │
│   ├── documents/               # Document management feature
│   │   ├── components/          # (future) Document upload, list, preview
│   │   ├── hooks/               # (future) useDocumentUpload, useDocuments
│   │   ├── services/            # (future) DocumentService (API calls)
│   │   └── types/               # (future) Document, DocumentMetadata types
│   │
│   ├── exams/                   # Exam generation feature
│   │   ├── components/          # (future) Exam wizard, preview, edit
│   │   ├── hooks/               # (future) useExamGeneration
│   │   ├── services/            # (future) ExamService (API calls)
│   │   └── types/               # (future) Exam, Question types
│   │
│   └── auth/                    # Authentication feature
│       ├── components/          # (future) LoginForm, RegisterForm
│       ├── hooks/               # (future) useAuth, useUser
│       ├── services/            # (future) AuthService (API calls)
│       └── types/               # (future) User, AuthToken types
│
├── components/                   # Shared UI components (shadcn/ui)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── input.tsx
│
└── lib/                         # Shared utilities
    └── utils.ts                 # Helper functions
```

## 🎯 Key Principles

### 1. **Feature-First Organization**

Each feature is **self-contained** and includes everything it needs:

```
features/documents/
├── components/       # UI components for this feature
├── hooks/           # Custom hooks for this feature
├── services/        # API calls and business logic
└── types/           # TypeScript types for this feature
```

**Why?** When you need to work on documents, you open `features/documents/` and you have EVERYTHING related to documents in one place.

### 2. **Screaming Intent**

**❌ BAD (Generic Structure)**:
```
src/
├── components/       # What kind of components?
├── hooks/           # Hooks for what?
├── services/        # Services for what?
└── utils/           # Utils for what?
```

**✅ GOOD (Screaming Architecture)**:
```
features/
├── dashboard/       # AH! This app has a dashboard
├── documents/       # AH! It manages documents
├── exams/           # AH! It generates exams
└── auth/            # AH! It has authentication
```

You can immediately see: **This is an exam generation system with document management.**

### 3. **Shared vs. Feature-Specific**

**Shared** (`components/ui/`):
- Generic UI components (Button, Card, Badge)
- Used across MULTIPLE features
- No business logic

**Feature-Specific** (`features/dashboard/components/`):
- Components tied to ONE feature
- May contain business logic
- Tightly coupled to feature requirements

**Example**:
- `components/ui/Button.tsx` → Generic button (shared)
- `features/dashboard/components/QuickActions.tsx` → Dashboard-specific (not reusable)

### 4. **Colocation**

Keep things close to where they're used:

```
features/documents/
├── components/
│   ├── DocumentUploadForm.tsx
│   └── DocumentPreview.tsx
├── hooks/
│   └── useDocumentUpload.ts      # ← Hook used ONLY by DocumentUploadForm
├── services/
│   └── document.service.ts       # ← Service used ONLY by document hooks
└── types/
    └── document.types.ts         # ← Types used ONLY in documents feature
```

**Why?** When you delete the `documents` feature, you delete ONE folder. No orphaned files scattered across the codebase.

## 🆚 Comparison: Traditional vs. Screaming Architecture

### Traditional Structure:
```
src/
├── components/
│   ├── Button.tsx
│   ├── DocumentList.tsx
│   ├── ExamCard.tsx
│   ├── LoginForm.tsx
│   └── DashboardStats.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   └── useExams.ts
├── services/
│   ├── auth.service.ts
│   ├── document.service.ts
│   └── exam.service.ts
└── types/
    ├── auth.types.ts
    ├── document.types.ts
    └── exam.types.ts
```

**Problems**:
- ❌ Can't tell what the app does by looking at folder names
- ❌ Files scattered across multiple folders
- ❌ Hard to find related code
- ❌ Difficult to delete features (files in 5 different folders)

### Screaming Architecture:
```
features/
├── auth/
│   ├── components/
│   │   └── LoginForm.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── services/
│   │   └── auth.service.ts
│   └── types/
│       └── auth.types.ts
├── documents/
│   ├── components/
│   │   └── DocumentList.tsx
│   ├── hooks/
│   │   └── useDocuments.ts
│   ├── services/
│   │   └── document.service.ts
│   └── types/
│       └── document.types.ts
└── exams/
    ├── components/
    │   └── ExamCard.tsx
    ├── hooks/
    │   └── useExams.ts
    ├── services/
    │   └── exam.service.ts
    └── types/
        └── exam.types.ts
```

**Benefits**:
- ✅ **Screams intent**: "This is an exam generator with auth and documents"
- ✅ **Colocation**: Everything for `auth` is in `features/auth/`
- ✅ **Easy to navigate**: Need auth code? Open `features/auth/`
- ✅ **Easy to delete**: Delete `features/documents/`, done!
- ✅ **Scalable**: Add new features without touching existing ones

## 🚀 How to Add a New Feature

Let's say you want to add a "Student Groups" feature:

1. **Create feature folder**:
   ```bash
   mkdir -p features/student-groups/{components,hooks,services,types}
   ```

2. **Add components**:
   ```tsx
   // features/student-groups/components/GroupList.tsx
   export function GroupList() { /* ... */ }
   ```

3. **Add types**:
   ```tsx
   // features/student-groups/types/group.types.ts
   export interface StudentGroup {
     id: string;
     name: string;
     students: Student[];
   }
   ```

4. **Add hooks**:
   ```tsx
   // features/student-groups/hooks/useGroups.ts
   export function useGroups() { /* ... */ }
   ```

5. **Add services**:
   ```tsx
   // features/student-groups/services/group.service.ts
   export class GroupService { /* ... */ }
   ```

6. **Create route**:
   ```tsx
   // app/groups/page.tsx
   import { GroupList } from '@/features/student-groups/components/GroupList';
   
   export default function GroupsPage() {
     return <GroupList />;
   }
   ```

**Done!** The feature is self-contained and doesn't pollute other parts of the codebase.

## 📚 Real-World Examples

### Spotify (hypothetical Screaming Architecture):
```
features/
├── music-player/    # Play, pause, skip, volume
├── playlists/       # Create, edit, share playlists
├── discover/        # Recommendations, new releases
├── library/         # Saved songs, albums, artists
└── social/          # Follow friends, share songs
```

### Twitter (hypothetical):
```
features/
├── timeline/        # Tweet feed, infinite scroll
├── compose/         # Create tweets, upload media
├── notifications/   # Mentions, likes, retweets
├── messages/        # Direct messages
└── search/          # Search tweets, users, topics
```

### Our ExamGen SaaS:
```
features/
├── dashboard/       # Overview, stats, recent activity
├── documents/       # Upload, manage, preview docs
├── exams/           # Generate, edit, publish exams
├── auth/            # Login, register, OAuth
└── settings/        # Profile, preferences, billing
```

## 🎓 Learning Resources

- [Screaming Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

**Remember**: The goal is NOT to have the "perfect" structure. The goal is to have a structure that **makes your intent obvious** and **makes development faster**.

If your structure is working against you, change it. Architecture serves developers, not the other way around.
