# Backend - Exam Generator API

Fastify-based REST API server with TypeScript, providing authentication, document management, and AI-powered exam generation.

## Tech Stack

- **Framework**: Fastify 4.x (high-performance web framework)
- **Language**: TypeScript (strict mode, ES2022)
- **Database**: PostgreSQL + pgvector (via Prisma ORM)
- **Auth**: Passport.js (local + OAuth) + JWT
- **Testing**: Vitest (unit + integration tests)
- **AI**: Google Gemini API (embeddings + text generation)
- **Storage**: Azure Blob Storage (document files)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── repositories/    # Data access layer (Prisma)
│   ├── middleware/      # Custom middleware (auth, validation)
│   ├── utils/           # Helper functions
│   └── server.ts        # Application entry point
├── prisma/              # Database schema and migrations
├── tests/               # Integration tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 16 with pgvector extension

### Setup

```bash
# Install dependencies (from project root)
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values (DATABASE_URL, JWT_SECRET, etc.)

# Run database migrations
pnpm --filter backend prisma migrate dev

# Start development server (with hot reload)
pnpm --filter backend dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Start server with hot reload (tsx watch)
pnpm build            # Compile TypeScript to dist/
pnpm start            # Run production build

# Testing
pnpm test             # Run tests in watch mode
pnpm test run         # Run tests once
pnpm test:ui          # Open Vitest UI
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm type-check       # TypeScript type checking (no emit)
pnpm lint             # ESLint (when configured)
```

## Testing Strategy

We follow **Test-Driven Development (TDD)**:

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while keeping tests green

### Test Structure

- **Unit Tests**: `src/**/*.test.ts` (tests for services, utils)
- **Integration Tests**: `tests/**/*.test.ts` (tests for API endpoints)
- **Coverage Threshold**: 80% (lines, functions, branches, statements)

### Example Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should hash password correctly', async () => {
    const password = 'myPassword123';
    const hashed = await authService.hashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt format
  });
});
```

### Running Specific Tests

```bash
# Run tests for a specific file
pnpm test src/services/auth.service.test.ts

# Run tests matching a pattern
pnpm test auth

# Run with coverage for specific file
pnpm test:coverage --reporter=text src/services/auth.service.test.ts
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication (Coming Soon)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/google` - OAuth login (Google)
- `GET /auth/github` - OAuth login (GitHub)
- `GET /auth/microsoft` - OAuth login (Microsoft)

### Documents (Coming Soon)

- `GET /documents` - List user documents
- `POST /documents` - Upload new document
- `GET /documents/:id` - Get document details
- `DELETE /documents/:id` - Delete document

### Exams (Coming Soon)

- `GET /exams` - List user exams
- `POST /exams/generate` - Generate new exam (RAG)
- `GET /exams/:id` - Get exam details
- `PATCH /exams/:id` - Update exam
- `DELETE /exams/:id` - Delete exam

## Environment Variables

See `.env.example` for all required environment variables.

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens

**Optional** (for full functionality):
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage
- `GEMINI_API_KEY` - Google Gemini API
- OAuth client IDs and secrets (Google, GitHub, Microsoft)

## Architecture Decisions

All technical decisions are documented in `docs/adr/`. Key decisions:

- **ADR 0002**: Why Fastify? (Performance, TypeScript support, plugin ecosystem)
- **ADR 0003**: Why PostgreSQL + pgvector? (Relational + vector search in one DB)
- **ADR 0004**: Why Passport.js + JWT? (Flexibility for local + OAuth strategies)
- **ADR 0007**: Why custom RAG? (Learning value vs. using LangChain)

## Contributing

1. Create a feature branch (optional for solo dev)
2. Write tests first (TDD approach)
3. Implement feature
4. Ensure all tests pass: `pnpm test run`
5. Ensure coverage meets threshold: `pnpm test:coverage`
6. Commit with conventional commit format: `feat(scope): description`
7. Update CHANGELOG.md under `[Unreleased]`

## License

Private project for educational purposes.

---

**Last Updated**: 2026-01-26
