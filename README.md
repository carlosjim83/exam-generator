# Exam Generator

AI-powered exam generator using RAG (Retrieval-Augmented Generation) for teachers to create exams from uploaded documents.

## 🎯 Features

- 📄 **Document Upload**: Upload PDF and DOCX files to Azure Blob Storage
- 🧠 **AI Processing**: Automatic text extraction, chunking, and embedding generation with Google Gemini
- 🔍 **RAG-based Generation**: Vector similarity search across multiple documents
- 📝 **Smart Exam Creation**: Generate multiple-choice questions with explanations
- ✏️ **Manual Review**: Edit and refine AI-generated questions
- 🔐 **Secure Authentication**: Local login + OAuth (Google, GitHub, Microsoft)

## 🏗️ Tech Stack

### Monorepo
- **pnpm workspaces** - Fast, efficient package management
- **Turborepo** - Intelligent build caching and task orchestration

### Frontend
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components

### Backend
- **Fastify** - Fast, low-overhead web framework
- **TypeScript** - Type safety
- **Prisma** - Type-safe ORM
- **Passport.js** - Authentication strategies

### Database & AI
- **PostgreSQL** - Relational database
- **pgvector** - Vector similarity search
- **Google Gemini API** - Embeddings and text generation

### Infrastructure
- **Azure Blob Storage** - Document file storage
- **Docker** - Local development (PostgreSQL)

## 📁 Project Structure

```
exam-generator/
├── frontend/           # Next.js application
├── backend/            # Fastify API server
├── packages/
│   └── shared/         # Shared TypeScript types
├── docs/               # Documentation (ADRs, specs, architecture)
├── docker-compose.yml  # Local PostgreSQL with pgvector
└── turbo.json          # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** (for local PostgreSQL)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and credentials

# Start PostgreSQL (with pgvector extension)
docker-compose up -d

# Run database migrations
pnpm --filter backend prisma migrate dev

# Start all services (frontend + backend)
pnpm dev
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 🧪 Testing

```bash
# Run all tests (unit + integration)
pnpm test

# Run tests in specific workspace
pnpm --filter backend test
pnpm --filter frontend test

# E2E tests (Playwright)
pnpm --filter frontend test:e2e
```

## 📚 Documentation

- **[AGENTS.md](./AGENTS.md)** - Quick reference for AI assistants
- **[Architecture Decision Records](./docs/adr/)** - Why we made technical choices
- **[Functional Specifications](./docs/specs/)** - Detailed feature specs
- **[System Architecture](./docs/architecture.md)** - Diagrams and data flows

## 🔑 Environment Variables

See [.env.example](./.env.example) for all required environment variables.

**Required for development**:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://ai.google.dev/)
- `JWT_SECRET` - Generate with `openssl rand -base64 32`

**Optional (for full features)**:
- `AZURE_STORAGE_ACCOUNT_NAME` - Azure Blob Storage
- `AZURE_STORAGE_ACCOUNT_KEY` - Azure access key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` - OAuth

## 🛠️ Development Workflow

This project follows **TDD (Test-Driven Development)**:

1. **Write test** (RED) - Define expected behavior
2. **Write code** (GREEN) - Minimal code to pass test
3. **Refactor** (REFACTOR) - Improve without breaking tests
4. **Commit** - Atomic commits with conventional commit messages

### Commit Convention

```bash
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
test(scope): add tests
chore(scope): update tooling
```

## 📦 Deployment

### Azure (Recommended)

- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service (Node.js)
- **Database**: Azure Database for PostgreSQL (with pgvector)
- **Storage**: Azure Blob Storage

See [deployment guide](./docs/deployment.md) for detailed instructions.

## 🎓 Learning Goals

This project demonstrates:
- ✅ Full-stack TypeScript development
- ✅ Monorepo management with modern tools
- ✅ RAG implementation with vector databases
- ✅ AI integration (Gemini API)
- ✅ Cloud infrastructure (Azure)
- ✅ TDD and clean architecture
- ✅ OAuth + local authentication
- ✅ Professional documentation (ADRs, specs)

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

Student from AI-powered development course  
Mentor: Senior Architect (GDE/MVP)

---

**Philosophy**: "Concepts over code. Understand what you build, don't just copy-paste."
