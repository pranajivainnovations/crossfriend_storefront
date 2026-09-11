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

# docker-compose has always passed this as a build arg, but it was never declared here — and Docker
# silently ignores an undeclared build arg. Server-side code falls back to the runtime
# MEDUSA_BACKEND_URL so nothing broke visibly, which is exactly why it went unnoticed.
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.pranajiva.in

# Google Analytics 4. Defaulted to the real production property, like the variables above.
#
# It was left empty at first, on the reasoning that a build given no ID should fail closed. That
# reasoning does not survive contact with how this app is actually deployed: deploy.sh builds the
# image with explicit --build-arg flags and never reads docker-compose.yml, so an empty default here
# is what every production build received. Failing closed only helps if somebody notices the
# closure, and nobody did — it shipped silently twice. A measurement ID is not a secret either; it
# is inlined into the client bundle and readable by anyone who opens DevTools. To build without
# analytics, say so explicitly:
#
#   docker build --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID= .
#
# It must be declared as an ARG to have any effect. `environment:` in docker-compose sets variables
# in the *runner* stage, which is far too late: NEXT_PUBLIC_* is inlined as a string literal during
# `npm run build` below, in the *builder* stage. Without this line the value resolves to an empty
# string, the `if (!id) return null` guard becomes statically true, and the minifier removes the
# script tag entirely — leaving a bundle that mentions dataLayer and consent but never loads gtag.js.
# That is precisely what happened on the first production build, and it is the same class of bug as
# the localhost canonical URL described above.
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=G-PGF5L9QMCQ

# Sanity, for the knowledge articles. Declared here rather than only in docker-compose for the same
# reason as everything above: NEXT_PUBLIC_* is inlined by the bundler during the build below, so a
# value supplied to the runner stage arrives far too late and the client reads undefined.
#
# Both have working defaults in src/lib/sanity/client.ts, so omitting them builds correctly against
# the real project. A project id is not a secret — it is in every request the browser makes to
# Sanity — and the dataset is public, so there is nothing here that needs hiding.
ARG NEXT_PUBLIC_SANITY_PROJECT_ID=q9n8m46w
ARG NEXT_PUBLIC_SANITY_DATASET=production

# Set environment variables for build
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID
ENV NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET
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

# ── OTP sign-in ───────────────────────────────────────────────────────────────
# Required at RUNTIME, supplied by docker-compose's `environment:` block:
#
#   OTP_PASSWORD_SALT   min 32 chars; /api/auth/otp/verify returns 503 without it
#   MEDUSA_BACKEND_URL  already set in compose; the OTP routes proxy to it
#
# Not declared as an ARG or ENV here, deliberately. Note the contrast with the
# NEXT_PUBLIC_* block in the builder stage above: those MUST be build args
# because the bundler inlines them into the client JS at compile time. This one
# is the mirror image — it has no NEXT_PUBLIC_ prefix, is never sent to the
# browser, and is read from process.env by the server route on each request. So
# a value set in compose takes effect on `up -d` with no rebuild, and a build
# arg would bake a secret into the image while still not being read at runtime.
#
# No empty ENV placeholder either: compose overrides it regardless, so it would
# only serve as an invitation to paste a secret into a layer that ships.
#
# Once set, do not change it — every existing customer's Medusa password is
# derived from this salt, and rotating it locks all of them out.

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


# ── Build provenance ──────────────────────────────────────────────────────────────────────────
# Declared in the RUNNER stage, deliberately, not the builder. The /api/build route reads these
# from process.env at request time, so they have to exist in the image that actually runs — a
# value set in the builder stage is discarded the moment the runner stage starts from a fresh
# base. (This is the mirror image of the NEXT_PUBLIC_* rule: those must be in the BUILDER stage
# because the bundler inlines them at compile time. Getting the two confused is what left GA
# missing from two production builds.)
#
# These are readable by anyone who can reach the endpoint. That is an accepted trade: a short
# commit hash from a private repo is not actionable on its own, and the alternative — a shared
# token in five more places — is exactly the kind of env plumbing that has already failed here.
ARG BUILD_COMMIT=unknown
ARG BUILD_BRANCH=unknown
ARG BUILD_TREE=unknown
ARG BUILD_TIME=unknown
ENV BUILD_COMMIT=$BUILD_COMMIT
ENV BUILD_BRANCH=$BUILD_BRANCH
ENV BUILD_TREE=$BUILD_TREE
ENV BUILD_TIME=$BUILD_TIME
# Start the server
CMD ["node", "server.js"]
