# Contributing to Exam Generator

This document explains the development workflow and Git Flow strategy for this project.

## 📋 Branch Strategy (Git Flow)

We follow a simplified Git Flow model with two main branches:

### Main Branches

- **`main`** - Production-ready code. Always stable and deployable.
  - Protected branch (requires pull request)
  - Tagged with version numbers (v1.0.0, v1.1.0, etc.)
  - Automatically deployed to Azure production environment
- **`develop`** - Integration branch for features. Next release candidate.
  - All feature branches merge here first
  - Should be stable and pass all tests
  - Periodically merged to `main` for releases

### Supporting Branches

- **`feature/*`** - New features or enhancements
  - Branch from: `develop`
  - Merge to: `develop`
  - Naming: `feature/user-profile`, `feature/pdf-upload`
- **`bugfix/*`** - Bug fixes for develop branch
  - Branch from: `develop`
  - Merge to: `develop`
  - Naming: `bugfix/login-error`, `bugfix/missing-validation`
- **`hotfix/*`** - Urgent fixes for production
  - Branch from: `main`
  - Merge to: `main` AND `develop`
  - Naming: `hotfix/security-patch`, `hotfix/critical-bug`
- **`release/*`** - Prepare for production release
  - Branch from: `develop`
  - Merge to: `main` AND `develop`
  - Naming: `release/1.1.0`, `release/2.0.0`

## 🔄 Development Workflow

### 1. Starting a New Feature

```bash
# Switch to develop and pull latest changes
git checkout develop
git pull origin develop

# Create a new feature branch
git checkout -b feature/my-new-feature

# Work on your feature...
# Make atomic commits with conventional commit messages
git add .
git commit -m "feat(scope): add user profile page"

# Push to remote
git push -u origin feature/my-new-feature
```

### 2. Finishing a Feature

```bash
# Update from develop before merging
git checkout develop
git pull origin develop

# Merge feature branch (use --no-ff to preserve branch history)
git merge --no-ff feature/my-new-feature

# Push to remote
git push origin develop

# Delete feature branch
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

### 3. Creating a Release

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# Update version numbers in package.json
# Update CHANGELOG.md with release notes
# Run final tests and fixes

# Commit release preparation
git commit -am "chore(release): prepare v1.1.0"

# Merge to main
git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/1.1.0
git push origin develop

# Delete release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

### 4. Applying a Hotfix

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Apply the fix
# Update version (e.g., 1.1.0 -> 1.1.1)
git commit -am "fix(security): patch XSS vulnerability"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-security-fix
git tag -a v1.1.1 -m "Hotfix v1.1.1 - Security patch"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-security-fix
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-security-fix
git push origin --delete hotfix/critical-security-fix
```

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no feature or bug fix)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, tooling, dependencies

### Examples

```bash
feat(auth): add Google OAuth login
fix(upload): handle large PDF files correctly
docs(readme): update deployment instructions
test(exam): add unit tests for exam generation
chore(deps): upgrade Next.js to v15
```

## ✅ Pull Request Checklist

Before creating a pull request:

- [ ] All tests pass (`pnpm test`)
- [ ] Code follows the project's style guidelines
- [ ] Commit messages follow conventional commits
- [ ] Documentation is updated (if needed)
- [ ] No console.logs or debug code
- [ ] Branch is up to date with `develop`

## 🧪 Testing Requirements

- **Unit tests**: All new functions/services must have unit tests
- **Integration tests**: API endpoints must have integration tests
- **Coverage**: Maintain minimum 80% code coverage
- **E2E tests**: Critical user flows must have E2E tests

Run tests before pushing:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm --filter frontend test:e2e
```

## 🚀 Deployment

### Development Environment

The `develop` branch can be deployed to a staging environment:

```bash
# Manual deployment (if needed)
git checkout develop
git pull origin develop

# Build and test
pnpm build
pnpm test

# Deploy to staging (commands here)
```

### Production Environment

Only `main` branch is deployed to production:

1. Create a release branch
2. Test thoroughly
3. Merge to `main`
4. Tag the release
5. Automatic deployment triggers (Azure Container Apps)

## 📊 Branch Protection Rules

### `main` branch

- Requires pull request before merging
- Requires status checks to pass
- Requires up-to-date branch before merging
- No direct pushes allowed

### `develop` branch

- Requires pull request before merging (recommended)
- Requires status checks to pass
- Direct pushes allowed for maintainers (with caution)

## 🆘 Common Scenarios

### Fixing a bug in production

Use hotfix workflow (see section 4 above)

### Merging conflicts from develop

```bash
git checkout feature/my-feature
git fetch origin
git merge origin/develop
# Resolve conflicts
git commit
git push
```

### Reverting a bad commit

```bash
# Find the commit hash
git log --oneline

# Revert the commit (creates a new commit)
git revert <commit-hash>
git push
```

## 📚 Resources

- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## 🙋 Questions?

If you have questions about the workflow, open an issue or contact the maintainers.
