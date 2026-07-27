# Environment Variables

## Purpose

This document explains which environment variables are used by `shothik-web`, which ones are public vs server-only, and which are required by specific feature areas.

Source of truth for placeholders:

- [.env.example](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.env.example)

## Public vs Server-only

### Public (browser-exposed)

Any variable prefixed with `NEXT_PUBLIC_` is embedded into the client bundle and is readable by anyone using the site.

Rules:

- do not put secrets here
- treat these as public configuration, not credentials

### Server-only

Variables without `NEXT_PUBLIC_` are available only to the Node runtime and server route handlers.

Rules:

- secrets belong here only
- store secrets in a secret manager (Vercel, GitHub Secrets, AWS/GCP secret store), not in files
- never commit `.env.local`

## Core Required Variables

### Routing and app identity

**Public**

- `NEXT_PUBLIC_APP_URL`
  - canonical origin of the frontend app
- `NEXT_PUBLIC_API_URL`
  - external API origin for rewrites and service calls
- `NEXT_PUBLIC_API_URL_WITH_PREFIX`
  - used by some modules that expect a base URL with an existing prefix

### Convex

**Public**

- `NEXT_PUBLIC_CONVEX_URL`

**Server-only**

- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`

Note:

- the codebase currently uses `NEXT_PUBLIC_CONVEX_URL` in some server handlers and proxy logic, so it must be present in CI and build contexts.

### Auth (current vs target)

**Current**

The repo currently still validates Clerk keys in env validation. Until migration is complete, keep these configured.

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public)
- `CLERK_SECRET_KEY` (server-only)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (public)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (public)

**Target (planned)**

These exist for the planned Better Auth migration and are not fully wired yet:

- `BETTER_AUTH_URL` (server-only recommended)
- `NEXT_PUBLIC_BETTER_AUTH_URL` (public)
- `BETTER_AUTH_SECRET` (server-only)
- `DATABASE_URL` (server-only)

## Feature-specific Variables

### Payments

**Stripe**

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (public)
- `STRIPE_SECRET_KEY` (server-only)
- webhook secrets (server-only):
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_CREDITS_WEBHOOK_SECRET`
  - `STRIPE_STARS_WEBHOOK_SECRET`
  - `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`
- `CREDIT_PURCHASE_SECRET` (server-only)

**Razorpay**

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public)
- `RAZORPAY_KEY_ID` (server-only)
- `RAZORPAY_KEY_SECRET` (server-only)

### Publishing (PublishDrive)

- `PUBLISHDRIVE_ENABLED` (server-only)
- `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED` (public)
- `NEXT_PUBLIC_PUBLISHDRIVE_API_URL` (public)
- `PUBLISHDRIVE_API_KEY` (server-only)
- `PUBLISHDRIVE_WEBHOOK_SECRET` (server-only)

### Document parsing (LiteParse)

Server-only flags and tuning:

- `LITEPARSE_ENABLED`
- `LITEPARSE_MODE`
- `LITEPARSE_OCR_LANGUAGE`
- `LITEPARSE_OCR_SERVER_URL`
- `LITEPARSE_DPI`
- `LITEPARSE_MAX_PAGES`
- `LITEPARSE_NUM_WORKERS`
- `LITEPARSE_DISABLE_OCR`

Also used by UI/metrics:

- `NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED` (public)

### External AI (LLM)

At least one is required by env validation:

- `KIMI_API_KEY` (server-only)
- `OPENAI_API_KEY` (server-only)
- `ANTHROPIC_API_KEY` (server-only)

Model and base URL tuning:

- `KIMI_BASE_URL`
- `KIMI_MODEL`
- `OPENAI_MODEL`
- `ANTHROPIC_MODEL`

### Redis / caching / idempotency

**Upstash**

- `UPSTASH_REDIS_REST_URL` (server-only)
- `UPSTASH_REDIS_REST_TOKEN` (server-only)

**Generic Redis**

- `REDIS_URL` (server-only)
- `REDIS_TOKEN` (server-only)

### Observability

**PostHog**

- `NEXT_PUBLIC_POSTHOG_HOST` (public)
- `NEXT_PUBLIC_POSTHOG_KEY` (public)

**Sentry**

- `NEXT_PUBLIC_SENTRY_DSN` (public)

### Admin / ops security

- `METRICS_ADMIN_KEY` (server-only)
- `IP_ALLOWLIST` (server-only)

## Local Setup

```bash
cp .env.example .env.local
```

Keep `.env.local` uncommitted.

## CI Notes

CI may need placeholder values for build-time evaluation of certain modules.

The safe baseline is:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `STRIPE_SECRET_KEY` (placeholder)
- auth placeholders depending on current validation paths
