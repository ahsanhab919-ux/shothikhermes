# Hermes Environment Checklist

## Purpose

This checklist defines the environment required to let Hermes work against
`shothik-web` continuously without falling back to placeholder values.

It is intentionally stricter than `.env.example`:

- it separates truly blocking runtime env from optional feature env
- it includes env that is referenced in code but not fully documented elsewhere
- it calls out one non-project dependency: Hermes itself also needs a working
  model/provider credential

## Important Constraint

Project env alone is not enough.

Hermes also needs its own runtime/provider credential configured in the Hermes
dashboard or Hermes config. If Hermes shows:

- `No API key configured for provider 'custom'`
- `Gateway Status: Stopped`

then the project env may be correct while Hermes still cannot work
continuously.

## Tier 0: Blocking Env For Continuous Hermes Work

These should be real values, not placeholders.

### App routing and origin

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL_WITH_PREFIX`

### Convex / shared backend identity

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`

### Current auth path still validated in code

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

### LLM provider

At least one must be real:

- `KIMI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

Related tuning:

- `KIMI_BASE_URL`
- `KIMI_MODEL`
- `OPENAI_MODEL`
- `ANTHROPIC_MODEL`

### Payments baseline

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Database / migration path

- `DATABASE_URL`

This is especially important because the repo already contains InsForge and
server-side database migration work.

## Tier 1: Strongly Recommended For Real Workspace Operation

These are not always startup-blocking, but Hermes will hit degraded behavior or
feature failures without them.

### Redis / idempotency / queue-related reliability

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional fallback path:

- `REDIS_URL`
- `REDIS_TOKEN`

### InsForge current migration path

- `NEXT_PUBLIC_INSFORGE_URL`
- `NEXT_PUBLIC_INSFORGE_ANON_KEY`

### Operational security

- `METRICS_ADMIN_KEY`
- `IP_ALLOWLIST`
- `API_KEY_SALT`
- `SESSION_SECRET`

### Convex auth / token helpers

- `CONVEX_SITE_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `CONVEX_JWT_PUBLIC_KEY_N`
- `CONVEX_JWKS_URL`
- `JWT_PRIVATE_KEY`
- `CONVEX_DEPLOY_KEY`

## Tier 2: Feature Modules To Configure Only If Enabled

### PublishDrive

- `PUBLISHDRIVE_ENABLED`
- `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED`
- `NEXT_PUBLIC_PUBLISHDRIVE_API_URL`
- `PUBLISHDRIVE_API_KEY`
- `PUBLISHDRIVE_WEBHOOK_SECRET`

### Razorpay

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Legacy/public variant referenced in UI:

- `NEXT_PUBLIC_RAZOR_KEY`

### bKash

- `BKASH_APP_KEY`
- `BKASH_APP_SECRET`
- `BKASH_BASE_URL`
- `BKASH_PASSWORD`
- `BKASH_USERNAME`
- `CREDIT_PURCHASE_SECRET`

### Stripe catalog and webhook expansion

- `STRIPE_CREDITS_WEBHOOK_SECRET`
- `STRIPE_STARS_WEBHOOK_SECRET`
- `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`
- `STRIPE_PRICE_CREDITS_100`
- `STRIPE_PRICE_CREDITS_500`
- `STRIPE_PRICE_CREDITS_1000`
- `STRIPE_PRICE_CREDITS_5000`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_RESEARCHER_MONTHLY`
- `STRIPE_PRICE_RESEARCHER_YEARLY`
- `STRIPE_PRICE_STUDENT_MONTHLY`
- `STRIPE_PRICE_STUDENT_YEARLY`
- `NEXT_PUBLIC_STRIPE_MODE`

### Document parsing / OCR

- `LITEPARSE_ENABLED`
- `LITEPARSE_MODE`
- `LITEPARSE_OCR_LANGUAGE`
- `LITEPARSE_OCR_SERVER_URL`
- `LITEPARSE_DPI`
- `LITEPARSE_MAX_PAGES`
- `LITEPARSE_NUM_WORKERS`
- `LITEPARSE_DISABLE_OCR`
- `NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED`
- `CALIBRE_SERVICE_URL`

### Research / paraphrase / sheet / slide service routing

- `NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX`
- `NEXT_PUBLIC_PARAPHRASE_SOCKET_URL`
- `NEXT_PUBLIC_PARAPHRASE_API_URL`
- `NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX`
- `NEXT_PUBLIC_SHEET_REDIRECT_PREFIX`
- `NEXT_PUBLIC_SHEET_SERVICE_URL`
- `NEXT_PUBLIC_SLIDE_REDIRECT_PREFIX`
- `NEXT_PUBLIC_SLIDE_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `SHEET_SERVICE_URL`
- `NLP_SERVICE_URL`
- `NLP_INFERENCE_URL`

### Plagiarism / detector / analysis services

- `PLAGIARISM_API_URL`
- `PLAGIARISM_ENGINE_URL`
- `NEXT_PUBLIC_PLAGIARISM_REDIRECT_PREFIX`
- `AI_DETECTOR_URL`
- `AI_DETECTOR_SERVICE_URL`

### Gemini / alternate LLM integration path

- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`

### Letta / Twin / memory features

- `LETTA_API_KEY`
- `LETTA_BASE_URL`
- `LETTA_EMBEDDING`
- `LETTA_MODEL`
- `SECOND_ME_VAULT_SECRET`
- `TWIN_VOICE_MAX_REPAIR_ATTEMPTS`
- `TWIN_VOICE_MAX_TOTAL_MS`

### Social / geolocation / notifications

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_GEOLOCATION_KEY`
- `NEXT_PUBLIC_GOOGLE_GEOLOCATION_KEY`
- `NEXT_PUBLIC_YOUTUBE_API_KEY`
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`
- `RESEND_API_KEY`

### MCP / Stitch / agent-adjacent integrations

- `NEXT_PUBLIC_MCP_SERVER_URL`
- `NEXT_PUBLIC_STITCH_BASE_URL`
- `NEXT_PUBLIC_STITCH_API_KEY`
- `NEXT_PUBLIC_STITCH_TIMEOUT_MS`
- `MCP_ENABLED`

### Marketing / misc public service hooks

- `NEXT_PUBLIC_PAYMENT_SYSTEM_URL`
- `NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX`
- `NEXT_PUBLIC_ANIMATION_SERVICE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_WRITING_STUDIO_ENABLED`
- `NEXT_PUBLIC_WRITING_STUDIO_API_URL`
- `NEXT_PUBLIC_ENABLE_PARAPHRASE_SIMPLIFIED`

### Admin / bootstrap / diagnostics

- `ADMIN_EMAILS`
- `BOOTSTRAP_ADMIN_ENABLED`
- `LOG_LEVEL`
- `HOST`
- `PORT`

### External webhooks

- `ZOHO_WEBHOOK_URL`
- `ZOHO_WEBHOOK_SECRET`

## Recommended `.env.local` Completion Order

1. Fill Tier 0 completely.
2. Configure the Hermes provider/API key separately in Hermes itself.
3. Fill Tier 1 for stable workspace execution.
4. Enable Tier 2 variables only for the product modules you want Hermes to
   work on now.

## Fastest Realistic Baseline

If the immediate goal is to let Hermes execute Phase 0 and Phase 1 work without
placeholder drift, start with these as real values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL_WITH_PREFIX`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- one real LLM key among `KIMI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_INSFORGE_URL`
- `NEXT_PUBLIC_INSFORGE_ANON_KEY`

And outside the repo env:

- a real Hermes provider/model credential configured in Hermes itself

## Why This Exists

The repo contains three different env surfaces:

- documented env in `.env.example`
- validated env in `lib/config/env-validation.ts`
- additional feature env referenced directly in application code

Hermes needs the union of those surfaces to avoid placeholder-led false starts.
