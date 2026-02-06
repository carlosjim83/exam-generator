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

- **PostgreSQL 16** - Relational database with pgvector extension
- **pgvector** - Vector similarity search for RAG
- **Azure OpenAI** - GPT-4o for text generation, text-embedding-3-small for embeddings
- **Azure Cache for Redis** - Job queue for BullMQ (Basic C0 tier)

### Infrastructure (Azure)

All infrastructure is managed with **Terraform** (Infrastructure as Code).

- **Azure Container Apps** - Serverless container hosting (backend + frontend)
- **Azure Blob Storage** - Document file storage
- **Azure PostgreSQL Flexible Server** - Managed PostgreSQL 16 with pgvector
- **Azure Cache for Redis** - Managed Redis for BullMQ (retiring 2028)
- **Azure Container Registry** - Private Docker registry
- **Azure Key Vault** - Secrets management
- **Azure Application Insights** - Application monitoring

**Cost Estimate**: ~€43-47/month (excluding OpenAI pay-per-use)

## 📁 Project Structure

```
exam-generator/
├── frontend/              # Next.js application
├── backend/               # Fastify API server
├── packages/
│   └── shared/            # Shared TypeScript types
├── terraform/             # Infrastructure as Code (Terraform/OpenTofu)
│   ├── main.tf            # Main orchestration file
│   ├── variables.tf       # Variable definitions
│   ├── outputs.tf         # Output values
│   ├── terraform.tfvars   # Configuration values (gitignored)
│   └── modules/           # Terraform modules (Redis, PostgreSQL, etc.)
├── docs/                  # Documentation (ADRs, specs, architecture)
│   ├── adr/               # Architecture Decision Records
│   ├── specs/             # Functional specifications
│   └── DEPLOYMENT.md      # Deployment guide
├── scripts/               # Utility scripts
├── docker-compose.yml     # Local development (PostgreSQL + Redis)
└── turbo.json             # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** (for local PostgreSQL + Redis)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and credentials

# Start local services (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
pnpm --filter backend prisma migrate dev

# Start all services (frontend + backend + worker)
pnpm dev
```

### Access (Local Development)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/documentation
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Access (Production)

- **Frontend**: `https://<your-frontend-app>.azurecontainerapps.io`
- **Backend API**: `https://<your-backend-app>.azurecontainerapps.io`

## 🧪 Testing

```bash
# Run all tests (unit + integration)
pnpm test

# Run tests in specific workspace
pnpm --filter backend test
pnpm --filter frontend test

# E2E tests (Playwright)
pnpm --filter frontend test:e2e

# Test coverage
pnpm --filter backend test:coverage
```

## 📚 Documentation

- **[Contributing Guide](./CONTRIBUTING.md)** - Development workflow and Git Flow strategy
- **[Architecture Decision Records](./docs/adr/)** - Why we made technical choices
- **[Functional Specifications](./docs/specs/)** - Detailed feature specs
- **[System Architecture](./docs/architecture.md)** - Diagrams and data flows
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Azure deployment instructions
- **[Terraform README](./terraform/README.md)** - Infrastructure as Code documentation

### Key ADRs

- [ADR-0001: Monorepo Structure with Turborepo](./docs/adr/0001-monorepo-structure.md)
- [ADR-0002: RAG Implementation with pgvector](./docs/adr/0002-rag-with-pgvector.md)
- [ADR-0003: BullMQ for Background Processing](./docs/adr/0003-bullmq-background-jobs.md)
- [ADR-0008: Redis Migration Strategy](./docs/adr/0008-redis-migration.md)

## 🔑 Environment Variables

See `backend/.env.example` for all required environment variables.

### Required for Local Development

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exam_generator

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Additional for Production

```bash
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=documents

# Redis (Azure)
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-key

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-api.azurecontainerapps.io/auth/google/callback
```

⚠️ **Never commit `.env` files or expose secrets in code**

## 🛠️ Development Workflow

This project follows **TDD (Test-Driven Development)**:

1. **Write test** (RED) - Define expected behavior
2. **Write code** (GREEN) - Minimal code to pass test
3. **Refactor** (REFACTOR) - Improve without breaking tests
4. **Commit** - Atomic commits with conventional commit messages

### Git Flow

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commit Convention

```bash
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
test(scope): add tests
refactor(scope): refactor code
chore(scope): update tooling
```

### Running Specific Services

```bash
# Frontend only
pnpm --filter frontend dev

# Backend only (API server)
pnpm --filter backend dev

# Worker only (BullMQ processor)
pnpm --filter backend worker

# Build all for production
pnpm build
```

## 📦 Deployment

### Infrastructure Setup (Terraform)

All Azure infrastructure is managed with Terraform/OpenTofu:

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
tofu init

# Review infrastructure plan
tofu plan

# Apply infrastructure changes
tofu apply

# Destroy infrastructure (careful!)
tofu destroy
```

See [terraform/README.md](./terraform/README.md) for detailed instructions.

### Application Deployment

**1. Build and push Docker images**

```bash
# Login to Azure Container Registry
az acr login --name <your-acr-name>

# Build and push backend
docker buildx build --platform linux/amd64 \
  -t <your-acr>.azurecr.io/exam-generator-backend:latest \
  -f Dockerfile.backend . --push

# Build and push frontend
docker buildx build --platform linux/amd64 \
  -t <your-acr>.azurecr.io/exam-generator-frontend:latest \
  -f Dockerfile.frontend . --push
```

**2. Update Container Apps**

```bash
# Update backend
az containerapp update \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --image <your-acr>.azurecr.io/exam-generator-backend:latest

# Update frontend
az containerapp update \
  --name exam-generator-frontend \
  --resource-group exam-generator-rg \
  --image <your-acr>.azurecr.io/exam-generator-frontend:latest
```

**3. Run database migrations**

```bash
# SSH into backend container or run locally with production DATABASE_URL
pnpm --filter backend prisma migrate deploy
```

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment guide.

## 🏗️ Architecture Highlights

### Clean Architecture Layers

```
backend/src/
├── application/        # Use cases (business logic)
├── domain/            # Domain entities and interfaces
├── infrastructure/    # External dependencies (DB, Queue, Storage, AI)
└── presentation/      # HTTP routes and controllers
```

### Background Job Processing

```
Document Upload → Azure Blob Storage
                ↓
           BullMQ Queue (Redis)
                ↓
           Worker Process
                ↓
    1. Extract text from PDF/DOCX
    2. Chunk text intelligently
    3. Generate embeddings (Azure OpenAI)
    4. Store in PostgreSQL (pgvector)
```

### RAG Implementation

```
User Query → Embed query (Azure OpenAI)
           ↓
    pgvector similarity search (cosine distance)
           ↓
    Retrieve top-K relevant chunks
           ↓
    Generate exam questions with context (GPT-4o)
```

## 🔒 Security

- **Authentication**: JWT tokens (access + refresh)
- **OAuth**: Google authentication via Passport.js
- **Secrets**: Stored in Azure Key Vault (production)
- **CORS**: Configured for frontend domain only
- **TLS**: All connections use TLS 1.2+
- **Validation**: Input validation with Zod schemas

## 🎓 Learning Goals

This project demonstrates:

- ✅ Full-stack TypeScript development (type-safe from DB to UI)
- ✅ Monorepo management with modern tools (pnpm + Turborepo)
- ✅ RAG implementation with vector databases (pgvector)
- ✅ AI integration (Azure OpenAI + Firebase Genkit)
- ✅ Background job processing (BullMQ + Redis)
- ✅ Infrastructure as Code (Terraform/OpenTofu)
- ✅ Cloud-native deployment (Azure Container Apps)
- ✅ Clean architecture and domain-driven design
- ✅ OAuth authentication flow (JWT + Google)
- ✅ Professional documentation (ADRs, specs, diagrams)
- ✅ Docker multi-stage builds for production
- ✅ TDD workflow with comprehensive tests

## 🚧 Known Limitations

- **Redis Retirement**: Azure Cache for Redis is retiring in 2028. Migration options are being evaluated (see ADR-0008).
- **Single Region**: Currently deployed only in Sweden Central (no geo-replication).
- **Manual Scaling**: Container Apps scale manually; auto-scaling not configured yet.

## 📊 Monitoring

- **Application Insights**: Tracks API performance, errors, and dependencies
- **Container App Logs**: Real-time logs via Azure Portal or CLI
- **Redis Metrics**: Monitor queue length and processing time

```bash
# View container app logs
az containerapp logs show \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --follow
```

## 🤝 Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Create feature branch: `git checkout -b feature/your-feature`
3. Write tests first (TDD)
4. Implement feature
5. Run tests: `pnpm test`
6. Commit: `git commit -m "feat(scope): description"`
7. Push: `git push origin feature/your-feature`
8. Open Pull Request to `develop` branch

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

**Student Project** - AI-Powered Development Course  
**Mentor**: Senior Architect (Google Developer Expert / Microsoft MVP)

---

**Philosophy**: _"Concepts over code. Understand what you build, don't just copy-paste."_

**Tech Debt is a Feature** - We document it, prioritize it, and address it systematically.
