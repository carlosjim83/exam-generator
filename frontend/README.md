# Frontend - Exam Generator

Next.js 15 frontend application for the Exam Generator platform.

## 🚀 Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Query** (TanStack Query)
- **Zustand** (state management)

## 📁 Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   └── styles/           # Global styles
├── public/               # Static assets
└── tests/                # Unit and E2E tests
```

## 🛠️ Development

```bash
# Install dependencies (from root)
pnpm install

# Run development server
pnpm --filter frontend dev

# Build for production
pnpm --filter frontend build

# Run tests
pnpm --filter frontend test

# Run E2E tests
pnpm --filter frontend test:e2e
```

## 🌐 Environment Variables

Create `.env.local` in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

**Coming soon**: Full setup with Next.js, Tailwind, and shadcn/ui
