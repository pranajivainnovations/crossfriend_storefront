# CrossFriend Storefront - Next.js Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (non-backend, safe to bake)
#
# NEXT_PUBLIC_* is inlined by the bundler during `npm run build` below — it is NOT read when the
# container starts. Setting it in the runner stage or in `docker compose environment:` has no
# effect on canonical URLs, og:url or the sitemap. It must be correct HERE, at build time.
#
# The default is the production domain, not localhost. It used to be http://localhost:8000, and
# because nothing on the deploy host exported the variable, every production build baked that in —
# so the live site published <link rel="canonical" href="http://localhost:8000/..."> on every page,
# telling Google the real content lived at an address it cannot reach. A wrong-but-real default is
# recoverable; a localhost default silently de-indexes the site.
ARG NEXT_PUBLIC_BASE_URL=https://crossfriend.in
ARG NEXT_PUBLIC_DEFAULT_REGION=in

# Set environment variables for build
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/store-config.js ./
COPY --from=builder /app/store.config.json ./

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000 || exit 1

# Start the server
CMD ["node", "server.js"]
