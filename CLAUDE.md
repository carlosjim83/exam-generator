# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI-powered exam generator** using RAG (Retrieval-Augmented Generation) for teachers to create exams from uploaded documents. It's a monorepo with pnpm workspaces and Turborepo.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Fastify, TypeScript, Prisma 6 (with pgvector), BullMQ, Firebase Genkit
- **Database**: PostgreSQL 16 with pgvector extension
- **Queue**: Redis (BullMQ)
- **AI**: Azure OpenAI (GPT-4o, text-embedding-3-small)
- **Infrastructure**: Azure Container Apps, Azure Blob Storage, Terraform/OpenTofu

## Common Commands

```bash
# Install dependencies
pnpm install

# Start local services (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
pnpm --filter backend prisma migrate dev

# Start all services (frontend + backend + worker)
pnpm dev

# Start individual services
pnpm --filter frontend dev     # Next.js on localhost:3000
pnpm --filter backend dev      # API on localhost:3001
pnpm --filter backend worker   # BullMQ worker

# Build and test
pnpm build
pnpm test
pnpm lint
pnpm type-check
pnpm validate  # lint + type-check + test

# Run tests for specific workspace
pnpm --filter backend test
pnpm --filter frontend test
pnpm --filter frontend test:e2e  # Playwright E2E tests
```

## Architecture

### Backend: Clean Architecture with DDD

```
backend/src/
├── domain/           # Entities, value objects, repository interfaces
├── application/      # Use cases (business logic)
├── infrastructure/   # Prisma repos, external services, AI
├── routes/           # Fastify route handlers
└── config/           # Container configuration
```

### Frontend: Screaming Architecture / Feature-Sliced

```
frontend/
├── app/              # Next.js App Router (routing only)
├── features/         # Self-contained feature modules
│   ├── auth/
│   ├── classes/
│   ├── exams/
│   ├── documents/
│   └── ...
├── components/ui/    # Shared shadcn/ui components
└── lib/              # Utilities, i18n, API clients
```

### Key Path Aliases (Backend)

Use these instead of relative imports:

- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@config/*` → `src/config/*`
- `@routes/*` → `src/routes/*`

### Key API Routes

| Base Path     | Description                           |
| ------------- | ------------------------------------- |
| `/auth`       | Local auth (register, login, refresh) |
| `/auth/oauth` | Google OAuth                          |
| `/documents`  | Document upload, processing           |
| `/exams`      | Exam generation                       |
| `/classes`    | Classes, invitations, enrollments     |
| `/students`   | Student exams, answers                |
| `/dashboard`  | Statistics                            |

## Development Rules (from AGENTS.md)

### NEVER do:

- Commit directly to `main`
- Mix backend and frontend in one PR
- Use relative imports in backend (use path aliases)
- Hardcode URLs or secrets

### ALWAYS do:

- Create feature branches: `feature/description`, `fix/description`
- Follow conventional commits: `feat(scope): message`, `fix(scope): message`
- Run `pnpm validate` before pushing
- Consult ADRs in `docs/adr/` before architectural changes
- Create separate PRs for backend and frontend

### Feature Development Workflow

1. Write spec in `docs/specs/`
2. Create backend branch: `feature/xxx-backend`
3. Create frontend branch: `feature/xxx-frontend`
4. Implement backend first, then frontend
5. Each PR should be independently reviewable

### Docker Image Tagging

Use specific tags, not `latest`:

```yaml
image: ghcr.io/user/app:main-abc1234
```

## Environment Variables

Copy from examples:

- `backend/.env.example` → `backend/.env`

Required: `DATABASE_URL`, `AZURE_OPENAI_*`, `REDIS_*`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

## Database

Prisma schema is in `backend/prisma/schema.prisma`. Run migrations after schema changes:

```bash
pnpm --filter backend prisma migrate dev
```

## Testing

The project uses TDD. Tests are co-located with components:

- Backend: `backend/tests/`
- Frontend: `frontend/features/*/__tests__/`

## Local Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/documentation
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Critical Gotchas

### Fastify Response Schema Filtering

**⚠️ CRITICAL**: Fastify uses `fast-json-stringify` which **filters out any properties not defined in the response schema**. This is a common source of bugs.

**Symptom**: Backend logs show 10 questions, frontend receives empty array. Backend sends `{exam: {id, title, questions: [...]}}`, frontend receives `{exam: {id, title}}`.

**Cause**: The `schema.response.200.properties` doesn't include all fields being sent.

**Fix**: When adding fields to API responses, **ALWAYS** update the Fastify schema:

```typescript
// backend/src/routes/some.routes.ts
fastify.get(
  '/api/endpoint',
  {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            // ❌ WRONG: Missing 'questions' will be filtered out
            exam: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
            },
            // ✅ CORRECT: All fields explicitly defined
            exam: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      text: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  handler
);
```

**Rule**: If you add a field to a response, you MUST add it to the schema. Fastify does not allow extra properties by default.
