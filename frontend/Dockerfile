# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Force rebuild - v2026.02.08.01
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

# Build Next.js application
RUN pnpm build

# DEBUG: List contents of standalone output to verify structure
RUN echo "=== Contents of .next/standalone ===" && \
    ls -laR /app/frontend/.next/standalone/ && \
    echo "=== Checking for server.js ===" && \
    find /app/frontend/.next -name "server.js" -type f && \
    echo "=== Full tree structure ===" && \
    find /app/frontend/.next/standalone -type f | head -20

# Create public directory if it doesn't exist (optional static assets)
RUN mkdir -p /app/frontend/public

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

# CRITICAL: Copy monorepo structure to make pnpm symlinks work correctly

# Step 1: Copy entire standalone output preserving monorepo structure
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone /tmp/standalone

# Step 2: Detect structure and copy appropriately
RUN if [ -f /tmp/standalone/frontend/server.js ]; then \
        echo "✅ Monorepo structure detected"; \
        # Copy everything from standalone root (includes node_modules with .pnpm)
        cp -r /tmp/standalone/* ./; \
        # Now /app/frontend/ contains the app, /app/node_modules contains shared deps
    elif [ -f /tmp/standalone/server.js ]; then \
        echo "✅ Flat structure detected"; \
        cp -r /tmp/standalone/* ./; \
    else \
        echo "❌ ERROR: Could not find server.js in standalone output"; \
        ls -laR /tmp/standalone; \
        exit 1; \
    fi && \
    rm -rf /tmp/standalone

# Step 3: Copy public assets to the correct location based on structure
COPY --from=builder /app/frontend/public ./frontend/public

# Step 4: Copy .next/static files to the correct location
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

# Step 5: Copy the actual workspace node_modules (fixes broken symlinks from standalone)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/node_modules ./frontend/node_modules

# Step 6: Copy root node_modules (overwrites if already exists from standalone)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# DEBUG: Verify structure is correct
RUN echo "=== Files in /app ===" && \
    ls -la /app/ && \
    echo "=== Checking server.js ===" && \
    find /app -name "server.js" -type f && \
    echo "=== Checking .next directory ===" && \
    ls -la /app/frontend/.next/ 2>/dev/null || ls -la /app/.next/ 2>/dev/null || echo "❌ .next not found"

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
# In monorepo builds, server.js is at /app/frontend/server.js  
# In flat builds, server.js is at /app/server.js
CMD ["sh", "-c", "if [ -f /app/frontend/server.js ]; then cd /app/frontend && node server.js; else node server.js; fi"]
