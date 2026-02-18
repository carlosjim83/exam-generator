# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Force rebuild - v2026.02.18.02
# Install pnpm (use version from packageManager field)
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy workspace configuration (monorepo setup)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies for frontend workspace only
RUN pnpm install --frozen-lockfile --filter=exam-generator-frontend...

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

# Install pnpm (use version from packageManager field)
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend ./frontend

# Copy frontend source code
COPY frontend ./frontend

WORKDIR /app/frontend

# Set build-time environment variables
# NEXT_PUBLIC_* variables must be set at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with standalone output
RUN pnpm build

# ================================
# Stage 3: Runner (Production)
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

# Copy standalone output - Next.js standalone includes all necessary node_modules
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Debug: show what we got
RUN echo "=== Standalone structure ===" && find . -maxdepth 3 -type f -name "*.js" | head -20

# Verify structure
RUN echo "=== Checking standalone structure ===" && \
    ls -la /app/ && \
    echo "=== Checking for next.js ===" && \
    find /app -path "*/node_modules/next" -type d | head -5 && \
    echo "=== Checking server.js ===" && \
    find /app -name "server.js" -type f

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server
CMD ["server.js"]