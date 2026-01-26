# ExamGen SaaS - Frontend

Modern Next.js 15 application built with TypeScript, Tailwind CSS, and Screaming Architecture.

## 🏗️ Architecture

This project follows **Screaming Architecture** principles - the folder structure screams what the application does:

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles with Tailwind + CSS variables
│   ├── page.tsx                 # Home (redirects to dashboard)
│   └── dashboard/
│       └── page.tsx             # Dashboard page
│
├── features/                     # FEATURE-BASED ORGANIZATION
│   ├── dashboard/               # Dashboard feature
│   │   └── components/
│   │       ├── TopNavigation.tsx
│   │       ├── DashboardStats.tsx
│   │       ├── RecentDocuments.tsx
│   │       ├── RecentExams.tsx
│   │       └── QuickActions.tsx
│   ├── documents/               # Documents feature (future)
│   ├── exams/                   # Exams feature (future)
│   └── auth/                    # Authentication feature (future)
│
├── components/                   # SHARED UI COMPONENTS (shadcn/ui)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── input.tsx
│
└── lib/
    └── utils.ts                 # Utility functions (cn for className merging)
```

## 🎨 Design System

- **Base**: Tailwind CSS with custom CSS variables
- **Components**: shadcn/ui (headless, accessible, customizable)
- **Icons**: Lucide React
- **Colors**: Blue primary (#3B82F6), semantic colors for status (success, warning)

## 🚀 Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## 📦 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🧩 Features Implemented

### ✅ Dashboard (v1)
- Top navigation with search, links, and user menu
- Stats cards (Total Documents, Total Exams, Recent Activity)
- Recent Documents list with icons and actions
- Recent Exams grid with status badges
- Quick Actions sidebar with primary CTAs
- Pro Tip card with gradient background
- Fully responsive layout

### 🔜 Coming Soon
- Authentication pages (login, register)
- Document upload with drag & drop
- Exam generation wizard
- Document library with filters
- Student groups management
- Settings page

## 🎯 Why Screaming Architecture?

When you open the `features/` folder, you immediately see:
- `dashboard/` - Dashboard feature
- `documents/` - Document management
- `exams/` - Exam generation
- `auth/` - Authentication

You DON'T see generic folders like `components/`, `hooks/`, `utils/` at the top level. 

**The architecture SCREAMS what the application does.**

Each feature is self-contained:
- Components specific to that feature live inside the feature folder
- Shared components live in `components/ui/`
- Business logic will live in feature folders (hooks, services, types)

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 🔗 Backend Integration

This frontend will connect to the Fastify backend running on `http://localhost:3001`.

API client and authentication will be implemented in future features.

---

**Last updated**: 2026-01-26  
**Version**: 0.1.0 (Dashboard MVP)
