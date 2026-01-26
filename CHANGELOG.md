# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Fastify server with TypeScript and hot reload (tsx watch)
- CORS configuration for frontend communication
- Health check endpoint (`GET /health`)
- Environment variables configuration with validation
- Production build support (TypeScript compilation)
- Graceful shutdown handling (SIGINT/SIGTERM)
- Pino logger with pretty printing for development
- Vitest testing framework with v8 coverage provider
- Test scripts (test, test:ui, test:coverage, test:watch)
- Vitest configuration with 80% coverage thresholds
- Path aliases for imports (`@/` for src, shared types)
- Backend README with comprehensive documentation

---

## Release History

### [0.1.0] - 2026-01-26 - Initial Setup

#### Documentation Phase
- Created 7 Architecture Decision Records (ADRs)
  - ADR 0001: Monorepo structure with pnpm and Turborepo
  - ADR 0002: Backend framework selection (Fastify)
  - ADR 0003: Database choice (PostgreSQL + pgvector)
  - ADR 0004: Authentication strategy (Passport.js + JWT)
  - ADR 0005: AI provider selection (Google Gemini)
  - ADR 0006: File storage solution (Azure Blob Storage)
  - ADR 0007: RAG implementation approach (custom pipeline)
- Created 4 functional specifications
  - Authentication flow (local + OAuth)
  - Document upload and processing
  - Exam generation (RAG-based, multi-document support)
  - UI/UX flows (complete wireframes)
- System architecture diagram with Mermaid diagrams

#### Monorepo Setup Phase
- Initialized pnpm workspaces (frontend, backend, packages/*)
- Configured Turborepo with intelligent caching
- Added Prettier for code formatting
- Created shared types package with 229 lines of TypeScript definitions
- Setup Docker Compose for local PostgreSQL development
- Added comprehensive README with development workflow

#### Statistics
- **Total Commits**: 23 (all atomic, conventional commit format)
- **Documentation**: ~30,000 words across ADRs, specs, and README
- **Lines of Code**: 341 (shared types + configs)

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or updates
- `chore`: Build/tooling changes
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `perf`: Performance improvements

**Format**: `<type>(<scope>): <description>`

**Example**: `feat(auth): add JWT token generation service`

---

## Development Workflow

1. Create feature branch (optional for solo dev)
2. Write tests (TDD - Red phase)
3. Write minimal code to pass (TDD - Green phase)
4. Refactor (TDD - Refactor phase)
5. Commit atomically with conventional commit message
6. Update this CHANGELOG under `[Unreleased]`
7. Merge to main when feature is complete

---

## Next Release Planning

### [0.2.0] - Backend Core (In Progress)

**Target Features**:
- Fastify server setup with TypeScript
- Prisma schema and database migrations
- Authentication service (local + JWT)
- User registration and login endpoints
- Password hashing with bcrypt
- JWT token generation and validation

**Coming Soon**: See [TODO.md](./TODO.md) for full backlog

---

**Last Updated**: 2026-01-26
