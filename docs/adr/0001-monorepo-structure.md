# ADR 0001: Monorepo Structure with pnpm + Turborepo

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need to decide how to organize the codebase for a full-stack application with:
- Frontend (Next.js)
- Backend (Fastify)
- Shared code (TypeScript types, utilities)

**Options considered**:
1. **Separate repositories** (frontend-repo, backend-repo)
2. **Monorepo with npm workspaces**
3. **Monorepo with pnpm workspaces + Turborepo**

---

## Decision

We will use **pnpm workspaces + Turborepo** in a monorepo structure.

**Structure**:
```
exam-generator/
├── frontend/
├── backend/
├── packages/shared/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Rationale

### Why Monorepo?
- ✅ Single source of truth for shared types
- ✅ Atomic commits across frontend and backend
- ✅ Easier refactoring (changes propagate immediately)
- ✅ Simplified CI/CD (one pipeline for everything)
- ✅ Better for learning (see full stack in one place)

### Why pnpm over npm/yarn?
- ✅ Faster installs (content-addressable storage)
- ✅ Disk space efficient (hard links, no duplication)
- ✅ Strict dependency resolution (no phantom dependencies)
- ✅ Better workspace support than npm

### Why Turborepo?
- ✅ Intelligent caching (rebuilds only what changed)
- ✅ Parallel task execution (build/test/lint faster)
- ✅ Remote caching (share cache with team/CI)
- ✅ Industry standard for modern monorepos
- ✅ Minimal configuration overhead (~20 lines)

---

## Consequences

### Positive
- Developer experience: `turbo dev` starts everything
- Fast builds: cache hits avoid redundant work
- Type safety: shared types are always in sync
- Professional tooling: demonstrates modern practices

### Negative
- Learning curve: developers must understand workspaces
- Tooling dependency: requires pnpm + turbo installed
- More complex initial setup (but better long-term)

### Neutral
- All team members must use pnpm (not npm/yarn)
- CI/CD must be configured for monorepo structure

---

## Alternatives Considered

### Separate Repositories
- ❌ Type synchronization requires publishing packages
- ❌ Cross-repo changes need multiple PRs
- ❌ More complex deployment coordination
- ✅ Independent versioning (not needed for this project)

### npm Workspaces (without Turborepo)
- ✅ Simpler (fewer tools)
- ❌ No caching (slow repeated builds)
- ❌ No intelligent parallelization
- ❌ Less professional for portfolio purposes

---

## Related Decisions
- See ADR 0002 for backend framework choice
- See ADR 0003 for database selection

---

## References
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
