# 🤖 AI Agents Guidelines

## Purpose

This document defines **strict rules and best practices** for AI agents (like Claude, GitHub Copilot, Cursor, etc.) working on this codebase.

These rules exist because **we learned the hard way** what happens when you don't follow proper development workflows.

---

## 🚨 CRITICAL RULES - NO EXCEPTIONS

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

- Direct commits to `main` bypass CI/CD checks
- No code review opportunity
- Harder to revert if something breaks
- Breaks team collaboration patterns

---

### 2. **BRANCH NAMING CONVENTIONS**

Use semantic branch names:

- `feature/short-description` - New features
- `fix/bug-description` - Bug fixes
- `chore/task-description` - Maintenance tasks (deps, configs, etc.)
- `docs/what-changed` - Documentation updates
- `refactor/what-changed` - Code refactoring
- `test/what-added` - Test additions/improvements

**Examples:**

```bash
feature/runtime-env-vars
fix/google-oauth-redirect
chore/update-husky-config
docs/add-deployment-guide
refactor/extract-api-service
test/add-e2e-auth-tests
```

---

### 3. **COMMIT MESSAGE STANDARDS**

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance (no production code change)
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc. (no code change)
- `refactor:` - Code restructuring (no behavior change)
- `test:` - Adding or fixing tests
- `perf:` - Performance improvements
- `ci:` - CI/CD configuration changes
- `build:` - Build system or dependencies changes
- `revert:` - Revert a previous commit

**Good examples:**

```
feat(auth): add Google OAuth SSO support

fix(frontend): correct backend API URL in production build

chore(deps): update Next.js to 15.1.0

docs(deployment): add GHCR deployment instructions
```

**Bad examples:**

```
fixed stuff
WIP
updates
changes
asdf
```

---

### 4. **PULL REQUEST REQUIREMENTS**

Every PR must include:

1. **Clear title** following commit conventions
2. **Description** explaining:
   - What changed
   - Why it changed
   - How to test it
3. **Link to related issue** (if applicable)
4. **Screenshots** (for UI changes)
5. **Breaking changes** clearly marked

**PR Template** (use this format):

```markdown
## Summary

Brief description of what this PR does.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

How to test these changes:

1. Step 1
2. Step 2
3. Expected result

## Related Issues

Closes #123
Related to #456

## Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CI checks passing
- [ ] No breaking changes (or clearly documented)
```

---

## 🔧 TECHNICAL BEST PRACTICES

### 5. **ENVIRONMENT VARIABLES - RUNTIME vs BUILD TIME**

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

## 📝 NOTES FOR AI AGENTS

### When asked to make changes:

1. **ALWAYS ask before committing to main**
   - "Should I create a feature branch for this?"
   - "What should I name this branch?"

2. **ALWAYS verify the workflow**
   - "I'll create a branch called `feature/xyz`, is that correct?"
   - "Should I create a PR or just push the branch?"

3. **ALWAYS explain what you're doing**
   - "I'm creating a feature branch for runtime environment variables"
   - "I'm updating the Dockerfile to remove hardcoded URLs"

4. **ALWAYS wait for confirmation before pushing**
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

**Last Updated:** February 8, 2026  
**Version:** 1.0.0
