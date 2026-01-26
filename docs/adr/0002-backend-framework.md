# ADR 0002: Fastify as Backend Framework

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need a Node.js backend framework for building a RESTful API with:
- Authentication (local + OAuth)
- File uploads
- Database integration (Prisma)
- AI API calls (Gemini)
- TypeScript support

**Options considered**:
1. **Next.js API Routes + tRPC** (integrated with frontend)
2. **Express.js** (classic, battle-tested)
3. **Fastify** (modern, fast, TypeScript-friendly)
4. **NestJS** (Angular-like, opinionated)
5. **Hono** (ultra-modern, edge-first)

---

## Decision

We will use **Fastify** as the backend framework.

---

## Rationale

### Why Fastify?

#### Performance
- ✅ ~2x faster than Express (benchmarks consistently show this)
- ✅ Built-in schema validation (Ajv) with zero overhead
- ✅ Async/await native (Express still uses callbacks internally)

#### Developer Experience
- ✅ Excellent TypeScript support (official types, generics for routes)
- ✅ Plugin architecture (clean separation of concerns)
- ✅ Built-in logging (pino - fastest logger)
- ✅ Extensive ecosystem (Prisma, Passport, CORS plugins)

#### Separation of Concerns
- ✅ Backend as independent service (can scale separately)
- ✅ Clear API contracts (REST endpoints, not RPC magic)
- ✅ Can be consumed by multiple clients (web, mobile, CLI)

#### Learning Value
- ✅ Industry-standard REST API patterns
- ✅ Modern Node.js framework (used by Microsoft, GitHub, etc.)
- ✅ Better for portfolio than "just Next.js API routes"

---

## Consequences

### Positive
- High performance API
- Type-safe request/response handling
- Clean architecture (backend fully decoupled)
- Professional folder structure (controllers, services, repositories)
- Easier to deploy independently

### Negative
- More initial setup than Next.js API routes
- Need to handle CORS configuration
- Separate deployment process (2 services instead of 1)
- No automatic type sharing with frontend (but we solve this with `packages/shared`)

### Neutral
- Requires learning Fastify ecosystem (plugins, hooks, decorators)
- Authentication needs manual configuration (vs NextAuth "magic")

---

## Alternatives Considered

### Next.js API Routes + tRPC
- ✅ End-to-end type safety (no API contracts needed)
- ✅ Single deployment (simpler)
- ❌ Backend tied to frontend (no independent scaling)
- ❌ Less professional separation (not REST standard)
- ❌ Limited to TypeScript clients only

### Express.js
- ✅ Most popular (huge community)
- ✅ Battle-tested (15+ years)
- ❌ Slower performance
- ❌ Callback-based (pre-async/await design)
- ❌ Poor TypeScript experience (requires many `@types/*` packages)
- ❌ No built-in validation

### NestJS
- ✅ Very structured (dependency injection, decorators)
- ✅ Great for large teams (opinionated patterns)
- ❌ Overkill for this project size
- ❌ Steep learning curve (Angular-like complexity)
- ❌ Slower than Fastify

### Hono
- ✅ Ultra-modern (edge-first, Cloudflare Workers)
- ✅ Very fast
- ❌ Too new (small ecosystem)
- ❌ Not ideal for traditional Node.js deployments (Azure App Service)

---

## Implementation Notes

### Folder Structure
```
backend/
├── src/
│   ├── routes/          # Route handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Data access (Prisma)
│   ├── plugins/         # Fastify plugins (auth, cors, etc.)
│   ├── schemas/         # JSON schemas (validation)
│   └── server.ts        # App entry point
├── tests/
├── prisma/
└── package.json
```

### Key Plugins
- `@fastify/cors` - CORS handling
- `@fastify/jwt` - JWT authentication
- `@fastify/multipart` - File uploads
- `@fastify/passport` - OAuth strategies

---

## Related Decisions
- See ADR 0001 for monorepo structure
- See ADR 0004 for authentication strategy
- See ADR 0006 for file storage

---

## References
- [Fastify Documentation](https://fastify.dev/)
- [Fastify vs Express Benchmarks](https://fastify.dev/benchmarks/)
- [Fastify TypeScript Guide](https://fastify.dev/docs/latest/Reference/TypeScript/)
