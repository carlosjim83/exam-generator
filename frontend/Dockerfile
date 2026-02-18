# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Force rebuild - v2026.02.18.03
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
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with standalone output
RUN pnpm build

# Debug: check what's in standalone
RUN echo "=== Standalone contents ===" && find .next/standalone -type f -name "*.js" | head -20

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

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Copy public and static files if they exist
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public/ || true
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static/ || true

# Debug: show final structure
RUN echo "=== Final structure ===" && ls -la && find . -name "server.js" && find . -name "package.json"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# CMD with fallback - try multiple locations for server.js
CMD ["sh", "-c", "node server.js || node ./server.js || node ./frontend/server.js || exit 1"]