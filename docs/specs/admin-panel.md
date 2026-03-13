# Spec: Admin Panel with AdminJS

**Version**: 2.0
**Last Updated**: 2026-03-08
**Status**: Draft

---

## Overview

Admin panel for production data management using **AdminJS** - an auto-generated admin interface. Allows administrators to view, edit, create, and delete all entities in the database without writing any CRUD code.

AdminJS automatically generates the entire admin UI based on the Prisma schema, including:

- ✅ CRUD operations for all entities
- ✅ Filtering and search
- ✅ Pagination
- ✅ Relationships display
- ✅ Bulk operations
- ✅ Authentication/Authorization

This is NOT a replacement for Prisma Studio (which is used for local development), but a production-ready administrative interface integrated into the main application.

---

## Architecture Decision

### Why AdminJS?

| Feature           | Manual Implementation         | AdminJS                      |
| ----------------- | ----------------------------- | ---------------------------- |
| CRUD endpoints    | Write ~50+ endpoints manually | **Auto-generated**           |
| Use cases         | Write ~40+ use cases          | **Auto-generated**           |
| Tests             | Write ~40+ tests              | **Minimal** (test auth only) |
| Filtering/Sorting | Manual implementation         | **Built-in**                 |
| Relationships     | Manual implementation         | **Built-in**                 |
| Pagination        | Manual implementation         | **Built-in**                 |
| Bulk operations   | Manual implementation         | **Built-in**                 |
| Time to implement | 10-15 days                    | **2-3 days**                 |
| Maintenance       | High (sync with schema)       | **Auto-syncs with Prisma**   |

---

## Requirements

### Functional Requirements

All provided **OUT OF THE BOX by AdminJS**:

- ✅ Admin users can view all records for any entity (User, Class, Exam, etc.)
- ✅ Admin users can edit any field of any record
- ✅ Admin users can create new records for any entity
- ✅ Admin users can delete records (with confirmation)
- ✅ Admin users can filter and search across records
- ✅ Admin users can view entity relationships (e.g., Class → Students)
- ✅ Admin users can perform bulk operations (e.g., delete multiple records)
- ✅ Admin users can view system metrics (total users, exams, classes, etc.)

### Non-Functional Requirements

- ✅ Admin panel must be accessible only to users with `ADMIN` role
- ⚠️ Admin panel uses **separate authentication** (session-based) from main app (JWT)
- ✅ Admin panel is responsive (desktop/tablet)
- ✅ Admin panel logs database changes via Prisma triggers (created_at, updated_at)

### Security Requirements

- ✅ Admin role check via AdminJS authentication
- ✅ Session-based authentication with secure cookies
- ✅ Rate limiting via Fastify middleware
- ✅ IP whitelist option for admin access (optional, configurable via env)

---

## Domain Model

### New Value: `UserRole.ADMIN`

We need to add `ADMIN` to the existing `UserRole` enum:

```prisma
enum UserRole {
  TEACHER
  STUDENT
  ADMIN  // <-- ADD THIS
}
```

### Entities Managed (All Auto-Generated)

AdminJS will create CRUD interfaces for ALL Prisma models:

```
User Management:
├─ User
├─ UserPreferences

Class Management:
├─ Class
├─ StudentEnrollment
├─ Invitation

Exam Management:
├─ Exam
├─ Question
├─ ClassExam
├─ ExamAssignment
├─ StudentAnswer

Document Management:
├─ Document
├─ DocumentChunk
├─ ClassDocument
```

---

## Implementation Plan

### Phase 1: Database Migration (Backend)

**Time**: 30 minutes

**Tasks**:

1. Add `ADMIN` to `UserRole` enum in Prisma schema
2. Create migration to recreate enum
3. Test migration locally

**Details**:

```prisma
// prisma/schema.prisma
enum UserRole {
  TEACHER
  STUDENT
  ADMIN  // <-- ADD THIS
}
```

```sql
-- Migration file
CREATE TYPE "UserRole_new" AS ENUM ('TEACHER', 'STUDENT', 'ADMIN');

ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new"
  USING "role"::"UserRole_new";

DROP TYPE "UserRole";

ALTER TYPE "UserRole_new" RENAME TO "UserRole";
```

---

### Phase 2: AdminJS Installation and Setup (Backend)

**Time**: 1-2 hours

**Tasks**:

1. Install AdminJS packages
2. Create AdminJS configuration
3. Integrate with Fastify

**Packages**:

```bash
cd backend
pnpm add adminjs @adminjs/fastify @adminjs/prisma @fastify/session connect-pg-simple
```

**Files to create**:

```
backend/src/
├── admin/
│   ├── index.ts            # AdminJS configuration
│   └── auth.ts             # Authentication logic
└── server.ts               # Register AdminJS router
```

**Configuration**:

```typescript
// backend/src/admin/index.ts
import AdminJS from 'adminjs';
import AdminJSFastify from '@adminjs/fastify';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
AdminJS.registerAdapter({ Database, Resource });

export const admin = new AdminJS({
  resources: [
    { resource: { model: getModelByName('User'), client: prisma } },
    { resource: { model: getModelByName('Class'), client: prisma } },
    { resource: { model: getModelByName('Exam'), client: prisma } },
    { resource: { model: getModelByName('Question'), client: prisma } },
    { resource: { model: getModelByName('ClassExam'), client: prisma } },
    { resource: { model: getModelByName('ExamAssignment'), client: prisma } },
    { resource: { model: getModelByName('StudentAnswer'), client: prisma } },
    { resource: { model: getModelByName('Document'), client: prisma } },
    { resource: { model: getModelByName('DocumentChunk'), client: prisma } },
    { resource: { model: getModelByName('ClassDocument'), client: prisma } },
    { resource: { model: getModelByName('StudentEnrollment'), client: prisma } },
    { resource: { model: getModelByName('Invitation'), client: prisma } },
    { resource: { model: getModelByName('UserPreferences'), client: prisma } },
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Exam Generator',
  },
});
```

```typescript
// backend/src/admin/auth.ts
import type { PrismaClient } from '@prisma/client';

export const authenticate = async (email: string, password: string, prisma: PrismaClient) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // For LOCAL auth: verify password
  if (user.provider === 'LOCAL' && user.password) {
    const bcrypt = (await import('bcrypt')).default;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
  }

  // For OAuth users: any password works (they already authenticated via OAuth)
  // This is a simplified approach. For production, you might want separate admin credentials.

  return {
    email: user.email,
    id: user.id,
    role: user.role,
  };
};
```

---

### Phase 3: Register AdminJS Router (Backend)

**Time**: 30 minutes

**Task**: Integrate AdminJS with Fastify

```typescript
// backend/src/server.ts (add at the end)
import { admin } from './admin/index.js';
import { AdminJSFastify } from '@adminjs/fastify';
import { authenticate } from './admin/auth.js';
import { env } from './config/env.js';
import Connect from 'connect-pg-simple';
import FastifySession from '@fastify/session';

// Register session plugin
const ConnectSession = Connect(FastifySession as any);
const sessionStore = new ConnectSession({
  conObject: process.env.DATABASE_URL,
  tableName: 'admin_session',
  createTableIfMissing: true,
});

await fastify.register(FastifySession, {
  store: sessionStore,
  secret: env.ADMINJS_COOKIE_SECRET,
  saveUninitialized: true,
  cookie: {
    httpOnly: env.NODE_ENV === 'production',
    secure: env.NODE_ENV === 'production',
  },
});

// Register AdminJS router
await AdminJSFastify.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      return await authenticate(email, password, prisma);
    },
    cookiePassword: env.ADMINJS_COOKIE_SECRET,
    cookieName: 'adminjs',
  },
  fastify,
  {
    store: sessionStore,
    secret: env.ADMINJS_COOKIE_SECRET,
    cookie: {
      httpOnly: env.NODE_ENV === 'production',
      secure: env.NODE_ENV === 'production',
    },
  }
);
```

---

### Phase 4: AdminJS Customization (Optional but Recommended)

**Time**: 1-2 hours

**Tasks**:

1. Hide sensitive fields (password, providerId, etc.)
2. Customize resource labels
3. Add custom resource actions (optional)

```typescript
// backend/src/admin/index.ts (customize resources)
export const admin = new AdminJS({
  resources: [
    {
      resource: { model: getModelByName('User'), client: prisma },
      options: {
        id: 'User',
        navigation: {
          name: 'User Management',
          icon: 'User',
        },
        listProperties: ['email', 'firstName', 'lastName', 'role', 'provider', 'createdAt'],
        editProperties: ['email', 'firstName', 'lastName', 'role', 'provider', 'providerId'],
        filterProperties: ['email', 'firstName', 'lastName', 'role', 'provider'],
        properties: {
          password: {
            isVisible: false, // Hide password
          },
          providerId: {
            isVisible: {
              list: false,
              filter: false,
              show: true,
              edit: true,
            },
          },
        },
      },
    },
    // ... customize other resources similarly
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Exam Generator',
  },
});
```

---

### Phase 5: Custom Actions (Optional)

**Time**: 1-2 hours (optional)

Example: Add "Fix User Provider" action to quickly fix OAuth issues

```typescript
// backend/src/admin/actions/fix-provider.ts
import { ActionContext } from 'adminjs';
import { PrismaClient } from '@prisma/client';

export const fixUserProvider = {
  action: {
    name: 'fixProvider',
    type: 'record',
    handler: async (request: ActionContext, context: any) => {
      const { record, params, translateMessage } = context;

      return {
        notice: {
          message: 'This would fix the provider in production',
          type: 'success',
        },
        redirectUrl: `/admin/User/${params.recordId}/show`,
      };
    },
  },
  icon: 'Gear',
  label: 'Fix Provider',
};

// Add to User resource options
customActions: [fixUserProvider],
```

---

### Phase 6: CLI Script for Initial Admin User

**Time**: 30 minutes

**Task**: Create script to create first admin user

```typescript
// backend/scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  if (!email || !password) {
    console.error(
      'Usage: node dist/scripts/create-admin.js <email> <password> [firstName] [lastName]'
    );
    process.exit(1);
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Password validation
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error('❌ Error: User with email already exists');
    process.exit(1);
  }

  // Check if ADMIN role exists
  const testUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!testUser && !(await prisma.user.findFirst())) {
    console.error('⚠️  Note: Creating first ever user, ADMIN role may not exist in enum yet');
    console.error('⚠️  Please run the migration first: pnpm prisma:migrate dev');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'ADMIN',
      provider: 'LOCAL',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.firstName} ${user.lastName}`);
  console.log(`Role: ADMIN`);
  console.log(`Provider: LOCAL`);
  console.log(`ID: ${user.id}`);
  console.log('');
  console.log('You can now login with email:', user.email);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to package.json:

```json
{
  "scripts": {
    "create-admin": "tsx scripts/create-admin.ts"
  }
}
```

---

### Phase 7: Environment Variables

**Time**: 15 minutes

**Add to `.env`**:

```env
# AdminJS Session
ADMINJS_COOKIE_SECRET=<min-32-characters-secret-string>
```

**Add to Azure Container Apps** (Production):

```
ADMINJS_COOKIE_SECRET=<secure-random-string>
```

Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Phase 8: Testing

**Time**: 1 hour

**Tasks**:

1. Test authentication flow
2. Test CRUD operations
3. Test filtering/search
4. Test relationships
5. Test delete with cascade

**Manual testing checklist**:

- ☐ Navigate to `/admin`
- ☐ Login with admin credentials
- ☐ View User list (filter by role, search by email)
- ☐ Create new User
- ☐ Edit User (change role to ADMIN)
- ☐ Delete User (cascade delete confirmed)
- ☐ View Class list (navigate to relationship from User)
- ☐ Navigate back to main app

---

### Phase 9: Deployment

**Time**: 30 minutes

**Tasks**:

1. Build Docker image
2. Push to GHCR
3. Update Azure Container Apps
4. Verify `/admin` is accessible
5. Create first admin user in production

**Deployment steps**:

```bash
# 1. Build and push
cd backend
docker build -t ghcr.io/carlosjim83/exam-generator-backend:main-$(git rev-parse --short HEAD) .
docker push ghcr.io/carlosjim83/exam-generator-backend:main-$(git rev-parse --short HEAD)

# 2. Update Azure Container App
az containerapp update \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --image ghcr.io/carlosjim83/exam-generator-backend:main-$(git rev-parse --short HEAD)

# 3. Set ADMINJS_COOKIE_SECRET in env vars
az containerapp update \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --set-env-vars ADMINJS_COOKIE_SECRET=<your-secret>

# 4. Create admin user
az containerapp exec \
  --name exam-generator-backend \
  --resource-group exam-generator-rg \
  --command "/bin/sh"

# Inside container
node dist/scripts/create-admin.js admin@example.com SecurePass123! Admin User
```

---

## Acceptance Criteria

### Backend

- [ ] `UserRole` enum includes `ADMIN` value
- [ ] Database migration created and tested
- [ ] AdminJS packages installed
- [ ] AdminJS configuration created (`admin/index.ts`)
- [ ] Authentication logic created (`admin/auth.ts`)
- [ ] AdminJS router registered in `server.ts`
- [ ] Session store configured with Postgres
- [ ] Sensitive fields hidden (password)
- [ ] CLI script `create-admin` created and tested
- [ ] Environment variables documented
- [ ] Local testing completed
- [ ] Production deployment completed
- [ ] First admin user created in production

### Frontend

- [ ] No frontend changes needed (AdminJS is server-side only)

---

## Risk Analysis

| Risk                     | Impact | Mitigation                                    |
| ------------------------ | ------ | --------------------------------------------- |
| AdminJS session leak     | Medium | Secure cookies, httpOnly, HTTPS only          |
| Accidental data deletion | High   | Cascade deletes are irreversible, careful use |
| AdminJS vulnerability    | Medium | Keep dependencies updated                     |
| Session store issues     | Low    | Postgres table is persistent                  |
| Admin plugin conflicts   | Low    | AdminJS uses separate rootPath `/admin`       |

---

## Open Questions

1. **Should AdminJS use JWT auth or session auth?**
   - Decision: Session auth with Postgres store (as shown in examples)
   - Reason: Simpler integration, no need to share JWT between apps

2. **Should we use the same auth as main app (JWT) or separate AdminJS auth?**
   - Decision: Separate AdminJS auth (simpler, as per official examples)
   - Future: Could integrate with JWT if needed

3. **Should we use the same user table for admin panel?**
   - Decision: Yes, share `users` table, check `user.role === 'ADMIN'`

4. **Should we create custom actions for admin tasks?**
   - Decision: No (start with out-of-the-box), add later if needed

---

## Related Documentation

- [AdminJS Fastify Plugin](https://docs.adminjs.co/installation/plugins/fastify)
- [AdminJS Prisma Adapter](https://docs.adminjs.co/Adapters/prisma)
- [AdminJS GitHub](https://github.com/SoftwareBrothers/adminjs)
- [ADR 0009: Clean Architecture with DDD](../../docs/adr/0009-clean-architecture.md)
- [AGENTS.md](../../AGENTS.md)

---

## Time Estimate

| Phase                       | Time      |
| --------------------------- | --------- |
| Phase 1: Database Migration | 30 min    |
| Phase 2: AdminJS Setup      | 1-2h      |
| Phase 3: Register Router    | 30 min    |
| Phase 4: Customization      | 1-2h      |
| Phase 5: Custom Actions     | 1-2h      |
| Phase 6: CLI Script         | 30 min    |
| Phase 7: Env Variables      | 15 min    |
| Phase 8: Testing            | 1h        |
| Phase 9: Deployment         | 30 min    |
| **TOTAL**                   | **6-10h** |

**NOTE: All CRUD operations are auto-generated, no manual endpoint/use case/test writing required.**

---

**Last Updated**: 2026-03-08
**Version**: 2.0 (Switched to AdminJS)
