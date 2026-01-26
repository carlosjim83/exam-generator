# AGENTS.md - Exam Generator Project

## 🎯 Project Overview

**Exam Generator** is a full-stack application that allows teachers to upload documents (PDFs, DOCX) and automatically generate exams using AI-powered Retrieval-Augmented Generation (RAG).

### Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Fastify + TypeScript + Prisma
- **Database**: PostgreSQL + pgvector (for embeddings)
- **Auth**: Passport.js (local strategy + OAuth: Google/GitHub/Microsoft)
- **AI**: Google Gemini API (embeddings + text generation)
- **Storage**: Azure Blob Storage (document files)
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Development**: TDD approach with strict test coverage

---

## 📁 Project Structure

```
exam-generator/
├── AGENTS.md                    # This file
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   ├── specs/                   # Functional specifications
│   └── architecture.md          # System architecture diagram
├── frontend/                    # Next.js application
├── backend/                     # Fastify API server
├── packages/
│   └── shared/                  # Shared TypeScript types
├── package.json                 # Root package.json (workspaces)
├── pnpm-workspace.yaml          # pnpm workspace config
├── turbo.json                   # Turborepo configuration
└── docker-compose.yml           # Local development (PostgreSQL)
```

---

## 🏗️ Architecture Overview

### High-Level Flow

1. **Teacher uploads document** → Frontend sends to Backend
2. **Backend processes**:
   - Stores file in Azure Blob Storage
   - Extracts text from PDF/DOCX
   - Splits into chunks
   - Generates embeddings via Gemini API
   - Stores chunks + embeddings in PostgreSQL (pgvector)
3. **Teacher requests exam generation**:
   - Backend performs similarity search on embeddings
   - Retrieves relevant chunks
   - Sends chunks + prompt to Gemini API
   - Returns structured exam (JSON)
4. **Frontend displays exam** for review/editing

### Key Components

- **Auth Service**: JWT-based auth with Passport.js (local + OAuth)
- **Document Service**: Upload, parsing, chunking, embedding
- **Exam Service**: RAG-based generation using Gemini
- **Storage Service**: Azure Blob Storage integration
- **Vector Search**: pgvector similarity search

---

## 🔐 Authentication Flow

- **Local**: Email/password (bcrypt hashing, JWT tokens)
- **OAuth**: Google, GitHub, Microsoft (Azure AD)
- **Session**: JWT stored in httpOnly cookies
- **Roles**: `teacher`, `student` (future: admin)

---

## 🧪 Testing Strategy (TDD)

### Backend
- **Unit tests**: Vitest for services, repositories
- **Integration tests**: Fastify route testing with test database
- **Coverage**: Minimum 80% (enforced in CI)

### Frontend
- **Unit tests**: Vitest + React Testing Library for components
- **E2E tests**: Playwright for critical user flows
- **Coverage**: Minimum 70%

### TDD Workflow
1. Write test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor (REFACTOR)
4. Repeat

---

## 📦 Deployment (Azure)

- **Frontend**: Azure Static Web Apps or App Service
- **Backend**: Azure App Service (Node.js) or Container Instances
- **Database**: Azure Database for PostgreSQL (with pgvector extension)
- **Storage**: Azure Blob Storage
- **CI/CD**: GitHub Actions → Azure

---

## 🚀 Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL (Docker)
docker-compose up -d

# Run migrations
pnpm --filter backend prisma migrate dev

# Start all services (Turborepo)
pnpm dev

# Run tests
pnpm test
```

---

## 📚 Documentation

- **ADRs**: See `docs/adr/` for all architectural decisions
- **Specs**: See `docs/specs/` for functional requirements
- **Architecture**: See `docs/architecture.md` for system diagrams

---

## 🎓 Learning Goals

This project demonstrates:
- ✅ Full-stack TypeScript development
- ✅ Monorepo management with modern tools
- ✅ RAG implementation with vector databases
- ✅ AI integration (Gemini API)
- ✅ Cloud infrastructure (Azure)
- ✅ TDD and clean architecture principles
- ✅ OAuth + local authentication strategies
- ✅ Proper documentation (ADRs, specs)

---

## 👨‍💻 Development Philosophy

> "Concepts over code. Understand what you build, don't just copy-paste."

- **No shortcuts**: Every feature is tested, documented, and architected properly
- **Future-proof**: Decisions are documented (ADRs) for future reference
- **Professional**: This is not a tutorial project, it's enterprise-grade software

---

**Last updated**: 2026-01-26
**Maintainer**: Student from AI-powered development course
**Mentor**: Senior Architect (GDE/MVP)
