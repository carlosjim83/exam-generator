# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Force rebuild - v2026.02.18.05
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
# outputFileTracingRoot in next.config.ts ensures all monorepo deps are included
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

# Copy standalone output - with outputFileTracingRoot, this includes all necessary dependencies
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Copy public assets if directory exists
RUN mkdir -p public
RUN if [ -d /app/frontend/public ]; then cp -r /app/frontend/public/* ./public/ 2>/dev/null || true; fi

# Copy static files to the correct location for standalone mode
# The standalone server looks for files at ./frontend/.next/static/ (relative to WORKDIR /app)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static/

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
# The standalone structure may have server.js at different locations depending on monorepo setup
CMD ["sh", "-c", "if [ -f ./server.js ]; then node ./server.js; elif [ -f ./frontend/server.js ]; then cd /app/frontend && node server.js; else echo 'ERROR: server.js not found' && find /app -name 'server.js' && exit 1; fi"]