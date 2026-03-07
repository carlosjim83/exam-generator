# Frontend Dockerfile for GitHub Actions CI/CD
# Multi-stage build for Next.js standalone output
# This Dockerfile is designed to be built from the monorepo root context

# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy monorepo workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

# Copy shared packages
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend ./frontend

WORKDIR /app/frontend

# Set build-time environment variables
# NEXT_PUBLIC_* variables must be set at build time
# Default to production backend URL if not specified
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://exam-generator-backend.delightfulforest-a488ef6b.swedencentral.azurecontainerapps.io}

# Control OAuth mock behavior (default: false for production)
ARG NEXT_PUBLIC_ENABLE_OAUTH_MOCK
ENV NEXT_PUBLIC_ENABLE_OAUTH_MOCK=${NEXT_PUBLIC_ENABLE_OAUTH_MOCK:-false}

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with standalone output
RUN pnpm build

# ================================
# Stage 2: Runner (Production)
# ================================
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create nextjs user (non-root for security)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy Next.js standalone build output (includes server.js and minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Copy static files that standalone mode doesn't include automatically
# These are served at /_next/static/* by the Next.js server
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static/

# Copy public folder with static assets (logo.png, favicon, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public/

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server (standalone mode puts server.js in frontend/)
CMD ["node", "frontend/server.js"]