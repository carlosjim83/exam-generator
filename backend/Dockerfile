# Backend Dockerfile for GitHub Actions CI/CD
# Multi-stage build with native module compilation for cross-platform support
# This Dockerfile is designed to be built from the monorepo root context

# ================================
# Stage 1: Builder (compiles TypeScript)
# ================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Copy patches for pnpm patch
COPY patches ./patches

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

WORKDIR /app/backend

# Generate Prisma Client and build TypeScript
RUN pnpm prisma generate
RUN pnpm build

# ================================
# Stage 2: Runner (Production)
# ================================
FROM node:20-alpine AS runner

# Install pnpm, dumb-init and build tools for native modules (bcrypt needs python, make, g++)
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache dumb-init python3 make g++ openssl

# Create app user (non-root for security)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy only package files needed for install
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./backend/

# Copy patches for pnpm patch
COPY --from=builder --chown=nodejs:nodejs /app/patches ./patches

# Install ALL dependencies (including dev for prisma CLI)
# This ensures native modules are compiled for the target platform
RUN pnpm install --frozen-lockfile

# Copy prisma schema for client generation
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma

# Generate Prisma Client in the target platform (AMD64 compatible)
RUN cd backend && pnpm prisma generate

# Copy built application files
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist

# Prune dev dependencies - this keeps only production deps
# Native modules are already compiled for the target platform
RUN pnpm prune --prod

# Create uploads directory with proper permissions
RUN mkdir -p ./backend/uploads && chown -R nodejs:nodejs ./backend

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["sh", "-c", "cd backend && node dist/server.js"]