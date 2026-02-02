# Exam Generator

AI-powered exam generator using RAG (Retrieval-Augmented Generation) for teachers to create exams from uploaded documents.

## 🎯 Features

- 📄 **Document Upload**: Upload PDF and DOCX files to Azure Blob Storage
- 🧠 **AI Processing**: Automatic text extraction, chunking, and embedding generation with Azure OpenAI
- 🔍 **RAG-based Generation**: Vector similarity search across multiple documents using pgvector
- 📝 **Smart Exam Creation**: Generate multiple-choice questions with explanations
- ✏️ **Manual Review**: Edit and refine AI-generated questions
- 🔐 **Secure Authentication**: JWT-based auth + OAuth (Google)
- ⚡ **Background Processing**: Async document processing with BullMQ workers

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
- **Prisma** - Type-safe ORM with pgvector support
- **Passport.js** - Authentication strategies
- **BullMQ** - Background job processing with Redis
- **Firebase Genkit** - AI workflow orchestration

### Database & AI

- **PostgreSQL** - Relational database
- **pgvector** - Vector similarity search extension
- **Azure OpenAI** - GPT-4o for text generation, text-embedding-3-small for embeddings
- **Redis** - Job queue and caching

### Infrastructure (Azure)

- **Azure Container Apps** - Serverless container hosting
- **Azure Blob Storage** - Document file storage
- **Azure PostgreSQL Flexible Server** - Managed PostgreSQL with pgvector
- **Azure Redis Cache** - Managed Redis for BullMQ
- **Azure Container Registry** - Private Docker registry

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

### Access (Local Development)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/documentation
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379 (if running locally)

### Access (Production)

- **Frontend**: https://exam-generator-frontend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io
- **Backend API**: https://exam-generator-backend.kindforest-d0a6102e.swedencentral.azurecontainerapps.io

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

- **[Architecture Decision Records](./docs/adr/)** - Why we made technical choices
- **[Functional Specifications](./docs/specs/)** - Detailed feature specs
- **[System Architecture](./docs/architecture.md)** - Diagrams and data flows
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Azure deployment instructions

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

**Required for local development**:

- `DATABASE_URL` - PostgreSQL connection string
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate with `openssl rand -base64 32`

**Required for production**:

- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` - Redis for BullMQ
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage
- `FRONTEND_URL` - CORS configuration

**Optional (for OAuth)**:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` - Google OAuth

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

### Production (Azure Container Apps)

The application is deployed on Azure using:

- **Frontend**: Azure Container Apps (Next.js container)
- **Backend**: Azure Container Apps (Fastify container with BullMQ worker)
- **Database**: Azure PostgreSQL Flexible Server with pgvector extension
- **Storage**: Azure Blob Storage for documents
- **Cache**: Azure Redis Cache for BullMQ job queue
- **Registry**: Azure Container Registry for Docker images

**Deployment Process**:

```bash
# Build and push Docker images
docker buildx build --platform linux/amd64 -t examgeneratorcj.azurecr.io/exam-generator-backend:v13 -f Dockerfile.backend . --push
docker buildx build --platform linux/amd64 -t examgeneratorcj.azurecr.io/exam-generator-frontend:v3 -f Dockerfile.frontend . --push

# Update Container Apps
az containerapp update --name exam-generator-backend --resource-group exam-generator-rg --image examgeneratorcj.azurecr.io/exam-generator-backend:v13
az containerapp update --name exam-generator-frontend --resource-group exam-generator-rg --image examgeneratorcj.azurecr.io/exam-generator-frontend:v3
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 🎓 Learning Goals

This project demonstrates:

- ✅ Full-stack TypeScript development
- ✅ Monorepo management with modern tools (pnpm + Turborepo)
- ✅ RAG implementation with vector databases (pgvector)
- ✅ AI integration (Azure OpenAI + Firebase Genkit)
- ✅ Background job processing (BullMQ + Redis)
- ✅ Cloud-native deployment (Azure Container Apps)
- ✅ Clean architecture and domain-driven design
- ✅ OAuth authentication flow
- ✅ Professional documentation (ADRs, specs)
- ✅ Docker multi-stage builds for production

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

Student from AI-powered development course  
Mentor: Senior Architect (GDE/MVP)

---

**Philosophy**: "Concepts over code. Understand what you build, don't just copy-paste."
