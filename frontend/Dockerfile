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

# Step 1: Copy Next.js standalone output first (includes server.js, package.json, .next/, node_modules with broken symlinks)
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Step 2: Copy public assets
COPY --from=builder /app/frontend/public ./public

# Step 3: Copy .next/static files
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

# Step 4: Copy frontend workspace node_modules with correct symlinks
COPY --from=builder --chown=nextjs:nodejs /app/frontend/node_modules ./frontend/node_modules

# Step 5: Copy root node_modules containing .pnpm directory
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Step 6: CRITICAL FIX - Create symlinks for runtime dependencies that server.js needs
# The server.js runs from /app/ and looks for modules in /app/node_modules
# But Next.js runtime dependencies (next, react, react-dom) are in /app/frontend/node_modules
# Solution: Create symlinks from /app/node_modules to /app/frontend/node_modules for these packages
RUN ln -sf ../frontend/node_modules/next ./node_modules/next && \
    ln -sf ../frontend/node_modules/react ./node_modules/react && \
    ln -sf ../frontend/node_modules/react-dom ./node_modules/react-dom

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
CMD ["node", "server.js"]
