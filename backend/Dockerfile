# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (production + dev for build)
RUN pnpm install --frozen-lockfile

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# ================================
# Stage 3: Runner (Production)
# ================================
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user (non-root for security)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema and generated client
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json for scripts
COPY --chown=nodejs:nodejs package.json ./

# Create uploads directory with proper permissions
RUN mkdir -p ./uploads && chown -R nodejs:nodejs ./uploads

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
CMD ["node", "dist/server.js"]
