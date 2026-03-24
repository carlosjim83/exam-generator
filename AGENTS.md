# 🤖 AI Agents Guidelines

## Purpose

This document defines **strict rules and best practices** for AI agents (like Claude, GitHub Copilot, Cursor, etc.) working on this codebase.

These rules exist because **we learned the hard way** what happens when you don't follow proper development workflows.

---

## 🚨 CRITICAL RULES - NO EXCEPTIONS

### 0. **NEVER RUN APP WITH `pnpm dev` - USE DOCKER**

**❌ PROHIBITED:**

```bash
cd backend && pnpm dev
cd backend && ts-node src/index.ts
npm run dev
```

**✅ REQUIRED:**

```bash
# Use Docker Compose for local development
docker-compose up

# Or run specific services
docker-compose up backend postgres redis

# Or use already running containers
# The app is already running in Docker containers
```

**Database Access:**

- PostgreSQL: `exam-gen-postgres` container running at `localhost:5433`
- Redis: `exam-gen-redis` container running at `localhost:6379`
- Backend: Already running in Docker

**Why?**

- Local environment is Docker-based
- Database runs in container, not local PostgreSQL
- Using `pnpm dev` will fail to connect to `localhost:5433`
- Maintain consistency across all environments

---

### 1. **NEVER COMMIT DIRECTLY TO `main`**

**❌ PROHIBITED:**

```bash
git checkout main
git add .
git commit -m "changes"
git push origin main
```

**✅ REQUIRED WORKFLOW:**

```bash
# 1. Create a feature branch from main
git checkout main
git pull origin main
git checkout -b feature/descriptive-name

# 2. Make changes and commit to the branch
git add .
git commit -m "feat: descriptive commit message"
git push origin feature/descriptive-name

# 3. Create a Pull Request via GitHub
gh pr create --title "Descriptive PR title" --body "Description"

# 4. Wait for CI checks to pass
# 5. Merge PR via GitHub (squash and merge recommended)
# 6. Delete branch after merge
```

**Why?**

- Easier to read and understand imports
- No need to count `../../../` levels
- Refactoring-friendly (moving files doesn't break imports)
- Consistent across the codebase

---

### 10. **I18N TRANSLATIONS - MANDATORY FOR ALL UI TEXT**

**❌ PROHIBITED:**

```typescript
// Hardcoded strings in components
<button>Submit</button>
<h1>My Classes</h1>
<p>No exams found</p>
```

**✅ REQUIRED:**

```typescript
// Use translation keys with namespaces
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');

<button>{t('common:actions.submit')}</button>
<h1>{t('student:classes.title')}</h1>
<p>{t('student:exams.noExams')}</p>
```

**Translation File Structure:**

```
frontend/lib/i18n/locales/
├── en/
│   ├── common.json      # Shared translations
│   ├── dashboard.json   # Dashboard specific
│   ├── student.json     # Student features
│   └── classes.json     # Classes feature
└── es/
    ├── common.json
    ├── dashboard.json
    ├── student.json
    └── classes.json
```

**Rules:**

1. **ALWAYS add both EN and ES translations** for every new text
2. **Use namespaces**: `common:`, `dashboard:`, `student:`, `classes:`, etc.
3. **Organize hierarchically**:
   ```json
   {
     "navigation": {
       "myClasses": "My Classes",
       "joinClass": "Join Class"
     },
     "classes": {
       "title": "My Classes",
       "noClasses": "No classes yet",
       "actions": {
         "join": "Join",
         "leave": "Leave"
       }
     }
   }
   ```
4. **NEVER use raw strings** in JSX - always use `t('key')`
5. **Test both languages** before committing

**Why?**

- App must be fully bilingual (EN/ES)
- Hardcoded text breaks user experience for Spanish users
- No way to fix without code changes and redeployment
- Violates i18n best practices

---

### 11. **ENVIRONMENT VARIABLES - RUNTIME vs BUILD TIME**

**Problem we had:**

- Hardcoded URLs in Dockerfile
- `NEXT_PUBLIC_*` variables baked into Next.js build
- Impossible to change configuration without rebuilding images

**✅ SOLUTION GOING FORWARD:**

**Backend (NestJS):**

- Use `process.env.VARIABLE_NAME` - These are **runtime** variables
- Configure in Azure Container Apps environment settings
- Can be changed without rebuilding

**Frontend (Next.js):**

- `NEXT_PUBLIC_*` variables are **BUILD TIME** only
- Use **runtime configuration** via API endpoints or server-side props
- Avoid hardcoding URLs in Dockerfiles

**Example of runtime config for frontend:**

```typescript
// app/config/route.ts (API endpoint)
export async function GET() {
  return Response.json({
    apiUrl: process.env.API_URL, // Server-side only
  });
}

// Client-side fetch
const config = await fetch('/config').then((r) => r.json());
const apiUrl = config.apiUrl;
```

---

### 6. **DOCKER IMAGE TAGGING**

**❌ AVOID:**

```yaml
image: ghcr.io/user/app:latest
```

**✅ USE SPECIFIC TAGS:**

```yaml
# Tag with commit SHA
image: ghcr.io/user/app:main-abc1234

# Tag with branch + SHA
image: ghcr.io/user/app:feature-new-stuff-abc1234

# Tag with version
image: ghcr.io/user/app:v1.2.3
```

**Why?**

- `:latest` is cached and doesn't trigger updates
- Specific tags allow rollbacks
- Easier to debug which version is deployed

---

### 7. **TESTING BEFORE PUSHING**

Before pushing **ANY** code:

```bash
# 1. Run linter
pnpm lint

# 2. Run type checking
pnpm type-check

# 3. Run tests
pnpm test

# 4. Or run all at once
pnpm validate
```

**Husky pre-commit hooks will enforce this**, but verify manually first.

---

### 8. **SECRETS MANAGEMENT**

**❌ NEVER:**

- Commit secrets to git
- Hardcode API keys in code
- Share secrets in chat/issues
- Use production secrets in development

**✅ ALWAYS:**

- Use environment variables
- Store secrets in Azure Key Vault (production)
- Use `.env.local` for development (gitignored)
- Rotate secrets if exposed
- Use different secrets for dev/staging/prod

---

### 9. **IMPORT PATHS - USE PATH ALIASES**

**❌ AVOID relative imports:**

```typescript
import { ExamAssignment } from '../../../domain/entities/ExamAssignment.js';
import { IExamRepository } from '../../../domain/repositories/IExamRepository.js';
import { UserId } from '../../../domain/value-objects/UserId.js';
```

**✅ USE path aliases:**

```typescript
import { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';
```

**Available aliases (backend):**

- `@/*` → `src/*`
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@config/*` → `src/config/*`
- `@routes/*` → `src/routes/*`
- `@middleware/*` → `src/middleware/*`
- `@tests/*` → `tests/*`

**Why?**

- Easier to read and understand imports
- No need to count `../../../` levels
- Refactoring-friendly (moving files doesn't break imports)
- Consistent across the codebase

---

## 📋 WORKFLOW CHECKLIST

Before starting work:

```bash
☐ Pull latest main
☐ Create feature branch
☐ Verify branch name follows convention
```

While working:

```bash
☐ Make small, focused commits
☐ Write clear commit messages
☐ Test changes locally
☐ Run linter and type checker
```

Before creating PR:

```bash
☐ All tests passing
☐ No linter errors
☐ Type checking passing
☐ Updated documentation (if needed)
☐ Added/updated tests (if needed)
```

After PR created:

```bash
☐ CI checks passing
☐ Resolved review comments
☐ Squashed commits (if requested)
☐ Ready to merge
```

After merge:

```bash
☐ Delete feature branch
☐ Pull latest main
☐ Verify deployment (if auto-deployed)
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Development to Production

1. **Feature Development**

   ```bash
   feature/xyz → PR → main
   ```

2. **Main triggers CI/CD**
   - Builds Docker images
   - Pushes to GHCR with tag `main-<sha>`
   - **Does NOT auto-deploy** (manual step)

3. **Manual Deployment**

   ```bash
   # Deploy backend
   ./scripts/deploy-backend.sh

   # Deploy frontend
   ./scripts/deploy-frontend.sh
   ```

4. **Verification**
   - Check health endpoints
   - Verify logs
   - Test critical user flows

---

## 🐛 WHEN THINGS GO WRONG

### Deployed broken code to production?

```bash
# 1. Find previous working revision
az containerapp revision list --name app-name --resource-group rg-name

# 2. Rollback
az containerapp revision activate \
  --name app-name \
  --resource-group rg-name \
  --revision app-name--0000XXX

# 3. Fix the issue in a new branch
git checkout -b fix/critical-issue

# 4. Create PR with fix
# 5. Deploy fix after CI passes
```

### Need to hotfix production urgently?

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-issue

# 2. Make MINIMAL changes to fix the issue
# 3. Test thoroughly locally
# 4. Create PR with "HOTFIX:" prefix
# 5. Get expedited review
# 6. Merge and deploy ASAP
```

### Accidentally committed to main?

```bash
# If not pushed yet
git reset --soft HEAD~1  # Undo commit but keep changes
git checkout -b feature/proper-branch
git commit -m "proper message"
git push origin feature/proper-branch

# If already pushed (DON'T DO THIS unless emergency)
# Contact team lead to discuss revert strategy
```

---

## 🎓 LEARNING RESOURCES

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [The Twelve-Factor App](https://12factor.net/)
- [Azure Container Apps Best Practices](https://learn.microsoft.com/en-us/azure/container-apps/best-practices)

---

## 🏗️ ARCHITECTURE PRINCIPLES

### 10. **ARCHITECTURE DECISION RECORDS (ADRs)**

Before making significant architectural changes, **ALWAYS** consult existing ADRs:

- [ADR 0001: Monorepo Structure](docs/adr/0001-monorepo-structure.md) - pnpm workspaces + Turborepo
- [ADR 0002: Fastify Backend Framework](docs/adr/0002-backend-framework.md) - Fastify vs Express vs NestJS
- [ADR 0003: PostgreSQL + pgvector](docs/adr/0003-database-choice.md) - Database and vector embeddings
- [ADR 0004: Authentication Strategy](docs/adr/0004-authentication-strategy.md) - JWT, OAuth, RBAC
- [ADR 0005: AI Provider](docs/adr/0005-ai-provider.md) - OpenAI GPT-4o
- [ADR 0006: File Storage](docs/adr/0006-file-storage.md) - Azure Blob Storage
- [ADR 0007: RAG Implementation](docs/adr/0007-rag-implementation.md) - Document parsing, embeddings, similarity search
- [ADR 0008: Redis Migration](docs/adr/0008-redis-migration.md) - BullMQ queue with Redis
- [ADR 0009: Clean Architecture with DDD](docs/adr/0009-clean-architecture.md) - Domain entities, repositories, use cases

**When implementing features:**

1. Follow Clean Architecture (ADR 0009): Domain → Application → Infrastructure → Routes
2. Use path aliases (Section 9): `@domain/*`, `@application/*`, `@infrastructure/*`
3. Create entities with business logic in `@domain/entities/`
4. Define repository interfaces in `@domain/repositories/`
5. Implement use cases in `@application/use-cases/`
6. Implement repositories in `@infrastructure/persistence`

### 11. **DOMAIN-DRIVEN DESIGN PATTERNS**

**Entities:**

- `@domain/entities/` - Rich domain models with business rules
- Always include validation logic in constructors
- Use value objects for IDs and domain primitives

**Value Objects:**

- `@domain/value-objects/` - Immutable objects identified by attributes
- Examples: `UserId`, `ExamId`, `Email`, `Percentage`
- Always validate in constructor and expose via getters

**Use Cases:**

- `@application/use-cases/` - Application orchestration layer
- One use case = one business transaction
- Coordinate domain entities and repositories
- Return domain entities, not DTOs

**Repositories:**

- Interface in `@domain/repositories/`
- Implementation in `@infrastructure/persistence/`
- Use Prisma for PostgreSQL queries
- Map database records to domain entities

---

### 12. **TESTING - MOTHER OBJECT PATTERN**

**Use the Mother Object pattern for test data:**

```typescript
// ✅ DO: Create a Mother Object for test entities
// tests/helpers/mothers/SubscriptionMother.ts
import {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
} from '@domain/entities/Subscription.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class SubscriptionMother {
  static createFree(
    overrides: Partial<{
      teacherId: string;
      id: string;
    }> = {}
  ): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(overrides.id ?? '123e4567-e89b-42d3-a456-426614174000'),
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      tier: SubscriptionTier.FREE,
      billingCycle: 'MONTHLY',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createPro(
    overrides: Partial<{
      teacherId: string;
      stripeCustomerId: string;
    }> = {}
  ): Subscription {
    const freeSub = this.createFree(overrides);
    return {
      ...freeSub,
      tier: SubscriptionTier.PRO,
      stripeCustomerId: overrides.stripeCustomerId ?? 'stripe-cust-123',
    } as Subscription;
  }
}

// ✅ Usage in tests:
const subscription = SubscriptionMother.createFree({ teacherId: 'my-uuid' });
const proSubscription = SubscriptionMother.createPro();
```

**Rules:**

1. **Organize Mothers by domain concept**: `tests/helpers/mothers/` folder
2. **One Mother per entity**: `SubscriptionMother.ts`, `UsageMetricsMother.ts`
3. **Sensible defaults**: All required fields must have valid defaults
4. **Override pattern**: Accept a partial object for customization
5. **Factory methods**: Use descriptive names like `createFree()`, `createPro()`, `createWithExpiredPeriod()`
6. **UUID values**: Use real UUID format for IDs (entities validate UUIDs)
7. **No external dependencies**: Mother objects should be pure TypeScript

**Why?**

- Tests become more readable: `SubscriptionMother.createFree()` vs 15 lines of entity creation
- Easy to create test variations: `SubscriptionMother.createPro({ teacherId: 'custom' })`
- Consistent test data across all tests
- Changes to entity structure only require updating one place
- Avoids invalid test data that causes false positives/negatives

---

### 13. **TESTING - MOCK INTERFACES CORRECTLY**

**✅ DO: Mock repository interfaces with vi.fn()**

```typescript
// tests/unit/application/use-cases/classes/CreateClassUseCase.test.ts
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';

const mockClassRepository = {
  existsByCode: vi.fn(),
  save: vi.fn(),
  countByTeacherId: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;
```

**❌ DON'T: Use any or loose typing**

```typescript
// ❌ BAD - loses type safety
const mockClassRepository: any = {
  existsByCode: vi.fn(),
};

// ❌ BAD - incomplete mock
const mockClassRepository = {
  save: vi.fn(),
  // Missing existsByCode! TypeScript won't catch this
};
```

### 14. **SPECS-DRIVEN DEVELOPMENT**

**Workflow for New Features:**

1. **Create Spec Document First**
   - Write comprehensive spec in `docs/specs/` directory
   - Define requirements, entities, use cases, API endpoints
   - Include database schema, UI mockups, testing strategy
   - Get spec approved before writing code

2. **Create Separate Branches for Backend and Frontend**

   ```
   backend:  feature/classes-and-invitations-backend
   frontend: feature/classes-and-invitations-frontend
   ```

3. **Create Separate Pull Requests**
   - Backend PR: Only backend changes (domain, application, infrastructure, routes)
   - Frontend PR: Only frontend changes (components, pages, hooks)
   - Each PR must be independently reviewable and testable

4. **PR Scope Guidelines**
   - **Backend PR includes:**
     - Domain entities and value objects
     - Repository interfaces and implementations
     - Use cases
     - Database schema changes (migrations)
     - API routes and schemas
     - Unit tests
   - **Frontend PR includes:**
     - Page components
     - Feature-specific components
     - API client functions
     - Type definitions (shared)
     - E2E tests if applicable

5. **Spec Template** (use for every new feature):

   ```markdown
   # Spec: [Feature Name]

   ## Overview

   Brief description

   ## Requirements

   - Functional requirements
   - Non-functional requirements

   ## Domain Model

   - Entities
   - Value Objects
   - Relationships

   ## Use Cases

   - Use case 1
   - Use case 2

   ## API Endpoints

   - GET /endpoint
   - POST /endpoint

   ## Database Schema

   - Table definitions
   - Indexes
   - Migrations

   ## UI Components

   - Page layouts
   - Component hierarchy

   ## Testing Strategy

   - Unit tests
   - Integration tests
   - E2E tests

   ## Acceptance Criteria

   - [ ] Requirement 1 satisfied
   - [ ] Requirement 2 satisfied
   ```

6. **No Mixing PRs**
   - ❌ Never mix backend + frontend in one PR
   - ❌ Never mix multiple features in one PR
   - ✅ One PR = One logical feature + One layer (backend OR frontend)

7. **Spec Location**
   - All specs in `docs/specs/[feature-name].md`
   - Reference spec in PR description: `[Spec Link](../../docs/specs/feature-name.md)`

---

## 🚫 CRITICAL: NO MONOLITHIC PRs

**When working on features:**

1. ❌ DON'T create one PR with backend + frontend mixed together
2. ✅ DO create separate branches: `feature/xxx-backend` and `feature/xxx-frontend`
3. ✅ DO create separate PRs for backend and frontend
4. ✅ DO reference the spec in both PRs
5. ✅ DO ensure each PR can be reviewed independently

**Why?**

- Backend PR can be merged before frontend (or vice versa)
- Smaller, focused PRs are easier to review
- If backend PR needs changes, doesn't block frontend PR
- Follows single responsibility principle at PR level

---

## 📝 NOTES FOR AI AGENTS

### When asked to make changes:

1. **CONSULT ADRs FIRST**
   - Always check existing Architecture Decision Records
   - Don't reinvent patterns already established
   - Follow Clean Architecture principles (ADR 0009)

2. **ALWAYS ask before committing to main**
   - "Should I create a feature branch for this?"
   - "What should I name this branch?"

3. **ALWAYS verify the workflow**
   - "I'll create a branch called `feature/xyz`, is that correct?"
   - "Should I create a PR or just push the branch?"

4. **ALWAYS explain what you're doing**
   - "I'm creating a feature branch for runtime environment variables"
   - "I'm updating the Dockerfile to remove hardcoded URLs"

5. **ALWAYS wait for confirmation before pushing**
   - "Ready to push these changes. Should I proceed?"
   - "I've committed locally. Want me to push and create a PR?"

---

## ✅ ADOPTION DATE

**Effective Date:** February 8, 2026

**Reason:** After deploying broken code to `main` multiple times due to:

- Hardcoded URLs causing DNS errors
- Next.js build-time variables causing cache issues
- No PR review process catching issues early

**All future work MUST follow these guidelines.**

---

## 🔄 DOCUMENT UPDATES

This document should be updated when:

- New patterns emerge
- Tools/workflows change
- Team grows and needs more structure
- Lessons learned from incidents

**Last Updated:** February 15, 2026
**Version:** 1.2.0 (Added Specs-Driven Development: separate branches/PRs for backend/frontend)
