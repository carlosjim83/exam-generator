# TODO - Exam Generator Project Backlog

> **Working like Jira tickets**: Each section is an Epic, each item is a Story/Task

**Legend**:

- 🟢 **DONE** - Completed and committed
- 🟡 **IN PROGRESS** - Currently working on
- 🔴 **TODO** - Not started yet
- ⚪ **BLOCKED** - Waiting for dependencies
- 🔵 **OPTIONAL** - Nice to have, not MVP

---

## Epic 1: Project Setup & Documentation 🟢 DONE

### Stories:

- [x] **DOC-001**: Create all Architecture Decision Records (ADRs) - 7 ADRs
- [x] **DOC-002**: Create functional specifications - 4 specs
- [x] **DOC-003**: Create system architecture diagram
- [x] **DOC-004**: Create AGENTS.md for AI reference
- [x] **DOC-005**: Create comprehensive README
- [x] **INFRA-001**: Setup monorepo with pnpm workspaces
- [x] **INFRA-002**: Configure Turborepo
- [x] **INFRA-003**: Setup Docker Compose for PostgreSQL + pgvector
- [x] **INFRA-004**: Create shared types package
- [x] **INFRA-005**: Configure Prettier and .gitignore

**Result**: 23 atomic commits, ~30k words of documentation

---

## Epic 2: Backend Core (Authentication & Infrastructure) 🟡 IN PROGRESS

**Target**: Version 0.2.0

### BACK-001: Fastify Server Setup 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 1 hour  
**Dependencies**: None

**Tasks**:

- [ ] Create `backend/package.json` with dependencies
- [ ] Setup TypeScript configuration (`tsconfig.json`)
- [ ] Create Fastify server entrypoint (`src/server.ts`)
- [ ] Add dev script with hot reload (tsx watch)
- [ ] Add build script (tsc)
- [ ] Configure CORS plugin
- [ ] Configure environment variables (dotenv)
- [ ] Add health check endpoint (`GET /health`)
- [ ] Test server starts on port 3001

**Acceptance Criteria**:

- ✅ Server starts without errors
- ✅ Health endpoint returns 200 OK
- ✅ Hot reload works (change file → server restarts)
- ✅ TypeScript compiles without errors

---

### BACK-002: Vitest Testing Setup 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 30 min  
**Dependencies**: BACK-001

**Tasks**:

- [ ] Install Vitest and dependencies
- [ ] Create Vitest config (`vitest.config.ts`)
- [ ] Setup test utilities and helpers
- [ ] Create example test to verify setup
- [ ] Add test script to package.json
- [ ] Configure coverage thresholds (80% minimum)

**Acceptance Criteria**:

- ✅ `pnpm test` runs successfully
- ✅ Coverage reports generated
- ✅ Tests run in watch mode with `pnpm test:watch`

---

### BACK-003: Prisma Setup & Database Schema 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 2 hours  
**Dependencies**: BACK-001

**Tasks**:

- [ ] Install Prisma and Prisma Client
- [ ] Initialize Prisma (`prisma init`)
- [ ] Create database schema (`schema.prisma`):
  - [ ] User model (id, email, passwordHash, name, role, provider, etc.)
  - [ ] Document model (id, title, filename, blobUrl, status, userId, etc.)
  - [ ] Chunk model (id, content, embedding vector(768), position, documentId)
  - [ ] Exam model (id, title, topic, userId, createdAt)
  - [ ] Question model (id, examId, question, options, correctAnswer, explanation)
  - [ ] RefreshToken model (id, token, userId, expiresAt)
- [ ] Configure pgvector extension in schema
- [ ] Create initial migration
- [ ] Run migration on local database
- [ ] Generate Prisma Client
- [ ] Test connection with simple query

**Acceptance Criteria**:

- ✅ Schema matches documented architecture
- ✅ Migration runs successfully
- ✅ Prisma Client generates TypeScript types
- ✅ Can query database from code

---

### BACK-004: Authentication Service (TDD) 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 3 hours  
**Dependencies**: BACK-002, BACK-003

**TDD Approach** (Write tests FIRST):

#### Test Suite 1: Password Hashing

- [ ] Write test: `should hash password with bcrypt`
- [ ] Write test: `should verify correct password`
- [ ] Write test: `should reject incorrect password`
- [ ] Implement: `hashPassword()` and `verifyPassword()`

#### Test Suite 2: JWT Token Generation

- [ ] Write test: `should generate access token with user payload`
- [ ] Write test: `should generate refresh token`
- [ ] Write test: `should verify valid access token`
- [ ] Write test: `should reject expired token`
- [ ] Write test: `should reject invalid token`
- [ ] Implement: `generateAccessToken()`, `generateRefreshToken()`, `verifyToken()`

#### Test Suite 3: User Registration

- [ ] Write test: `should register new user with valid data`
- [ ] Write test: `should reject duplicate email`
- [ ] Write test: `should hash password before storing`
- [ ] Write test: `should return user without password`
- [ ] Implement: `registerUser()` service method

#### Test Suite 4: User Login

- [ ] Write test: `should login with correct credentials`
- [ ] Write test: `should reject invalid email`
- [ ] Write test: `should reject incorrect password`
- [ ] Write test: `should return access and refresh tokens`
- [ ] Implement: `loginUser()` service method

**Acceptance Criteria**:

- ✅ All tests pass (RED → GREEN → REFACTOR)
- ✅ Test coverage ≥ 80% for auth service
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens signed with RS256

---

### BACK-005: Auth API Routes 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 2 hours  
**Dependencies**: BACK-004

**Routes to Implement**:

#### POST /api/auth/register

- [ ] Write integration test: successful registration
- [ ] Write integration test: duplicate email error (409)
- [ ] Write integration test: validation errors (400)
- [ ] Implement route handler
- [ ] Add JSON schema validation (Fastify schema)
- [ ] Return user + tokens

#### POST /api/auth/login

- [ ] Write integration test: successful login
- [ ] Write integration test: invalid credentials (401)
- [ ] Write integration test: missing fields (400)
- [ ] Implement route handler
- [ ] Add JSON schema validation
- [ ] Set httpOnly cookies for tokens

#### POST /api/auth/refresh

- [ ] Write integration test: successful token refresh
- [ ] Write integration test: invalid refresh token (401)
- [ ] Write integration test: expired refresh token (401)
- [ ] Implement route handler
- [ ] Validate refresh token from cookie
- [ ] Generate new access token

#### POST /api/auth/logout

- [ ] Write integration test: successful logout
- [ ] Implement route handler
- [ ] Blacklist refresh token (or delete from DB)
- [ ] Clear cookies

#### GET /api/auth/me

- [ ] Write integration test: return current user (authenticated)
- [ ] Write integration test: reject unauthenticated (401)
- [ ] Implement route handler
- [ ] Use auth middleware

**Acceptance Criteria**:

- ✅ All routes tested with integration tests
- ✅ Proper HTTP status codes
- ✅ Error handling with clear messages
- ✅ Validation errors return field-specific messages

---

### BACK-006: Authentication Middleware 🔴 TODO

**Priority**: P0 (Critical)  
**Estimate**: 1 hour  
**Dependencies**: BACK-004

**Tasks**:

- [ ] Write test: `should authenticate valid JWT token`
- [ ] Write test: `should reject missing token (401)`
- [ ] Write test: `should reject invalid token (401)`
- [ ] Write test: `should reject expired token (401)`
- [ ] Write test: `should attach user to request object`
- [ ] Implement middleware: `authenticateRequest()`
- [ ] Register as Fastify plugin
- [ ] Add `request.user` type definition

**Acceptance Criteria**:

- ✅ Middleware tested thoroughly
- ✅ Can be applied to protected routes
- ✅ TypeScript types for `request.user`

---

### BACK-007: Rate Limiting 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 30 min  
**Dependencies**: BACK-005

**Tasks**:

- [ ] Install `@fastify/rate-limit`
- [ ] Configure rate limits:
  - Login: 5 attempts per 15min per IP
  - Register: 3 attempts per hour per IP
  - Token refresh: 10 per minute per user
- [ ] Add rate limit headers to responses
- [ ] Test rate limiting works

**Acceptance Criteria**:

- ✅ Rate limits enforced
- ✅ Returns 429 Too Many Requests when exceeded
- ✅ Headers show remaining attempts

---

## Epic 3: Document Management 🔴 TODO

**Target**: Version 0.3.0

### BACK-008: Azure Blob Storage Integration 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 2 hours  
**Dependencies**: BACK-006

**Tasks**:

- [ ] Install `@azure/storage-blob`
- [ ] Create StorageService class
- [ ] Write test: generate upload URL (SAS token, write-only, 10min expiry)
- [ ] Write test: generate download URL (SAS token, read-only, 1hr expiry)
- [ ] Write test: delete blob
- [ ] Write test: check blob exists
- [ ] Implement StorageService methods
- [ ] Add error handling for Azure API errors

**Acceptance Criteria**:

- ✅ Can generate signed URLs
- ✅ SAS tokens have correct permissions and expiry
- ✅ All methods tested with mocks (no real Azure calls in tests)

---

### BACK-009: Document Upload Routes 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 2 hours  
**Dependencies**: BACK-008

**Routes**:

#### POST /api/documents/upload-url

- [ ] Write test: generate upload URL for valid file
- [ ] Write test: reject invalid MIME type (400)
- [ ] Write test: reject file too large (413)
- [ ] Write test: require authentication (401)
- [ ] Implement route handler
- [ ] Validate filename, mimeType, sizeBytes
- [ ] Generate documentId (UUID)
- [ ] Return upload URL + documentId

#### POST /api/documents/confirm-upload

- [ ] Write test: confirm upload and create document record
- [ ] Write test: reject if file not found in Azure (404)
- [ ] Write test: create document with status PROCESSING
- [ ] Implement route handler
- [ ] Verify file exists in Azure (HEAD request)
- [ ] Create Document record in database
- [ ] Trigger async processing (placeholder for now)

**Acceptance Criteria**:

- ✅ Upload flow works end-to-end (get URL → upload → confirm)
- ✅ Document record created with correct metadata
- ✅ Only authenticated users can upload

---

### BACK-010: Document List & Details Routes 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 1 hour  
**Dependencies**: BACK-009

**Routes**:

#### GET /api/documents

- [ ] Write test: return user's documents
- [ ] Write test: filter by status (query param)
- [ ] Write test: pagination works
- [ ] Write test: only return own documents (not other users')
- [ ] Implement route handler

#### GET /api/documents/:id

- [ ] Write test: return document details
- [ ] Write test: include chunk count
- [ ] Write test: reject if user doesn't own document (403)
- [ ] Implement route handler

#### GET /api/documents/:id/download

- [ ] Write test: redirect to Azure download URL
- [ ] Write test: reject if user doesn't own document (403)
- [ ] Implement route handler

#### DELETE /api/documents/:id

- [ ] Write test: delete document and blob
- [ ] Write test: cascade delete chunks
- [ ] Write test: reject if user doesn't own document (403)
- [ ] Implement route handler

**Acceptance Criteria**:

- ✅ All routes protected (require auth)
- ✅ Authorization checks (user owns resource)
- ✅ Pagination works correctly

---

### BACK-011: Document Processing (Text Extraction) 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 2 hours  
**Dependencies**: BACK-009

**Tasks**:

- [ ] Install `pdf-parse` and `mammoth`
- [ ] Create DocumentProcessingService
- [ ] Write test: extract text from PDF
- [ ] Write test: extract text from DOCX
- [ ] Write test: reject unsupported file type
- [ ] Write test: handle corrupt files
- [ ] Implement text extraction methods
- [ ] Update document status on success/failure

**Acceptance Criteria**:

- ✅ Extracts text from PDF and DOCX
- ✅ Handles errors gracefully
- ✅ Updates document status (PROCESSING → READY/FAILED)

---

### BACK-012: Text Chunking 🔴 TODO

**Priority**: P1 (High)  
**Estimate**: 1 hour  
**Dependencies**: BACK-011

**Tasks**:

- [ ] Install `langchain/text_splitter`
- [ ] Write test: split text into chunks (1000 chars, 200 overlap)
- [ ] Write test: handle short text (< 1000 chars)
- [ ] Write test: preserve semantic boundaries (paragraphs)
- [ ] Implement chunking function
- [ ] Store chunks in database with position

**Acceptance Criteria**:

- ✅ Text split into reasonable chunks
- ✅ Chunks stored with position (order preserved)
- ✅ Overlap configured correctly

---

---

### BACK-014: Complete Document Processing Pipeline ⚪ BLOCKED

**Priority**: P1 (High)  
**Estimate**: 2 hours  
**Dependencies**: BACK-011, BACK-012, BACK-013

**Tasks**:

- [ ] Integrate all processing steps:
  1. Download from Azure
  2. Extract text
  3. Chunk text
  4. Generate embeddings
  5. Store chunks + embeddings
  6. Update document status
- [ ] Write integration test for full pipeline
- [ ] Add error handling and rollback
- [ ] Log processing progress
- [ ] (Optional) Add BullMQ for async processing

**Acceptance Criteria**:

- ✅ Full pipeline runs end-to-end
- ✅ Document status updates correctly
- ✅ Errors logged and document marked as FAILED

---

## Epic 4: Exam Generation (RAG) 🔴 TODO

**Target**: Version 0.4.0

### BACK-015: Vector Similarity Search ⚪ BLOCKED

**Priority**: P0 (Critical)  
**Estimate**: 2 hours  
**Dependencies**: BACK-013

**Tasks**:

- [ ] Create VectorSearchService
- [ ] Write test: find similar chunks (cosine similarity)
- [ ] Write test: search across multiple documents
- [ ] Write test: filter by similarity threshold (0.7+)
- [ ] Write test: return top-K results
- [ ] Implement similarity search with pgvector
- [ ] Add HNSW index for performance

**Acceptance Criteria**:

- ✅ Returns relevant chunks for query embedding
- ✅ Results sorted by similarity (highest first)
- ✅ Performance < 100ms for 5K chunks

---

### BACK-016: Exam Generation Service ⚪ BLOCKED

**Priority**: P0 (Critical)  
**Estimate**: 3 hours  
**Dependencies**: BACK-015

**Tasks**:

- [ ] Create ExamGenerationService
- [ ] Write test: generate query embedding from topic
- [ ] Write test: retrieve relevant chunks
- [ ] Write test: build prompt with context
- [ ] Write test: call Gemini API for generation
- [ ] Write test: parse and validate JSON response
- [ ] Write test: store exam in database
- [ ] Implement full exam generation pipeline
- [ ] Add retry logic for API failures

**Acceptance Criteria**:

- ✅ Generates exam from multiple documents
- ✅ Returns structured JSON (questions with options)
- ✅ Validates generated exam format
- ✅ Handles API errors gracefully

---

### BACK-017: Exam API Routes ⚪ BLOCKED

**Priority**: P0 (Critical)  
**Estimate**: 2 hours  
**Dependencies**: BACK-016

**Routes**:

#### POST /api/exams/generate

- [ ] Write test: generate exam from multiple documents
- [ ] Write test: validate documentIds belong to user
- [ ] Write test: validate all documents are READY
- [ ] Write test: return 10 questions with explanations
- [ ] Implement route handler

#### GET /api/exams

- [ ] Write test: list user's exams
- [ ] Write test: pagination
- [ ] Write test: filter by documentId
- [ ] Implement route handler

#### GET /api/exams/:id

- [ ] Write test: return exam with all questions
- [ ] Write test: reject if user doesn't own exam (403)
- [ ] Implement route handler

#### PATCH /api/exams/:id

- [ ] Write test: update exam title
- [ ] Write test: update questions
- [ ] Write test: reject if user doesn't own exam (403)
- [ ] Implement route handler

#### DELETE /api/exams/:id

- [ ] Write test: delete exam and questions
- [ ] Write test: reject if user doesn't own exam (403)
- [ ] Implement route handler

**Acceptance Criteria**:

- ✅ All routes protected and authorized
- ✅ Exam generation works end-to-end
- ✅ Can edit generated exams

---

## Epic 5: OAuth Authentication 🔴 TODO

**Target**: Version 0.5.0

### BACK-018: Passport.js Setup ⚪ BLOCKED

**Priority**: P2 (Medium)  
**Estimate**: 2 hours  
**Dependencies**: BACK-006

**Tasks**:

- [ ] Install `@fastify/passport` and OAuth strategies
- [ ] Configure Passport.js plugin
- [ ] Setup session serialization/deserialization
- [ ] Add OAuth routes structure

---

### BACK-019: Google OAuth ⚪ BLOCKED

**Priority**: P2 (Medium)  
**Estimate**: 2 hours  
**Dependencies**: BACK-018

**Tasks**:

- [ ] Install `passport-google-oauth20`
- [ ] Configure Google strategy
- [ ] Implement routes: `/api/auth/google`, `/api/auth/google/callback`
- [ ] Write test: successful OAuth flow
- [ ] Write test: find or create user
- [ ] Handle errors (rejected by Google, etc.)

---

### BACK-020: GitHub OAuth ⚪ BLOCKED

**Priority**: P2 (Medium)  
**Estimate**: 1 hour  
**Dependencies**: BACK-018

(Similar to Google OAuth)

---

### BACK-021: Microsoft OAuth ⚪ BLOCKED

**Priority**: P2 (Medium)  
**Estimate**: 1 hour  
**Dependencies**: BACK-018

(Similar to Google OAuth)

---

## Epic 6: Frontend Application 🔴 TODO

**Target**: Version 0.6.0

### FRONT-001: Next.js Setup 🔴 TODO

### FRONT-002: Tailwind + shadcn/ui Setup 🔴 TODO

### FRONT-003: Authentication UI (Login, Register) 🔴 TODO

### FRONT-004: Dashboard UI 🔴 TODO

### FRONT-005: Document Library UI 🔴 TODO

### FRONT-006: Document Upload UI 🔴 TODO

### FRONT-007: Exam Generator Wizard UI 🔴 TODO

### FRONT-008: Exam Review UI 🔴 TODO

_(Full frontend breakdown coming soon)_

---

## Epic 7: Testing & Polish 🔴 TODO

**Target**: Version 0.7.0

### TEST-001: E2E Tests (Playwright) ⚪ BLOCKED

### TEST-002: Load Testing ⚪ BLOCKED

### TEST-003: Security Audit ⚪ BLOCKED

---

## Epic 8: Deployment 🔴 TODO

**Target**: Version 1.0.0

### DEPLOY-001: Azure Infrastructure Setup ⚪ BLOCKED

### DEPLOY-002: CI/CD Pipeline (GitHub Actions) ⚪ BLOCKED

### DEPLOY-003: Production Environment Variables ⚪ BLOCKED

### DEPLOY-004: Monitoring & Logging ⚪ BLOCKED

---

## Optional Features (Post-MVP) 🔵

### OPT-001: True/False Questions 🔵

### OPT-002: Short Answer Questions 🔵

### OPT-003: Exam Export (PDF/JSON) 🔵

### OPT-004: Student View (Take Exams) 🔵

### OPT-005: Exam Analytics 🔵

### OPT-006: Question Bank 🔵

---

**Last Updated**: 2026-01-26  
**Current Sprint**: Epic 2 - Backend Core (Authentication)  
**Next Up**: BACK-001 (Fastify Server Setup)
