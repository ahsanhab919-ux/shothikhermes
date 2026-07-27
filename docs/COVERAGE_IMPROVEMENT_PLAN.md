# Coverage Improvement Plan

## Purpose

This document defines the staged test coverage improvement strategy for `shothik-web`.

It exists because the current baseline is acceptable for an initial extracted repo, but not yet strong enough for long-term API route precision and security guarantees.

## Current Baseline

Latest measured baseline from local CI-aligned coverage run:

- statements: `44.07%`
- branches: `37.02%`
- functions: `45.76%`
- lines: `45.20%`

Current enforced thresholds in Vitest are still lower than the desired long-term standard.

## Target State

### Global Targets

- statements: `80%+`
- lines: `80%+`
- functions: `80%+`
- branches: `70%+`

### Critical Module Targets

- auth modules: `95%`
- payment routes and helpers: `95%`
- security helpers: `95%`
- health and monitoring routes: `90%`
- API validation utilities: `90%`

## Incremental Milestones

### Milestone 1

Target:

- statements: `50%`
- lines: `50%`
- functions: `50%`
- branches: `40%`

Focus areas:

- API route utilities
- auth flow helpers
- health endpoints
- shared UI actions already under test

### Milestone 2

Target:

- statements: `60%`
- lines: `60%`
- functions: `60%`
- branches: `50%`

Focus areas:

- payment route tests
- Twin auth and permission paths
- document parsing config and metrics
- rate limiting and idempotency helpers

### Milestone 3

Target:

- statements: `70%`
- lines: `70%`
- functions: `70%`
- branches: `60%`

Focus areas:

- publishing APIs
- plagiarism session routes
- service integration adapters
- high-risk route fallback logic

### Milestone 4

Target:

- statements: `80%`
- lines: `80%`
- functions: `80%`
- branches: `70%`

Focus areas:

- broad route contract coverage
- E2E smoke parity for all critical journeys
- mutation testing on the most safety-critical modules

## Coverage Gate Strategy

### Near Term

- keep current thresholds enforced in CI
- fail the build if thresholds regress
- require new route families to add tests when introduced

### Medium Term

- raise thresholds by `5%` increments per milestone
- do not raise thresholds until flaky tests are stabilized

### Long Term

- set module-specific stricter thresholds for:
  - auth
  - payments
  - security
  - route validation

## Priority Areas For New Tests

### Highest Priority

- `app/api/stripe/*`
- `app/api/razorpay/*`
- `app/api/bkash/*`
- `lib/auth.ts`
- `lib/agent-auth.ts`
- `lib/security/*`
- `lib/api-validation.ts`
- `app/api/tools/paraphrase/route.ts`
- `app/api/tools/plagiarism/*`

### High Priority

- `app/api/twin/*`
- `app/api/publish/*`
- `lib/infrastructure/redis.ts`
- `services/*`

### Medium Priority

- large UI modules with low coverage but lower operational risk
- non-critical content pages

## Mutation Testing Plan

Mutation testing should be introduced after Milestone 2.

Initial target modules:

- `lib/auth.ts`
- `lib/api-validation.ts`
- `lib/security/idempotency.ts`
- `lib/security/owasp-compliance.ts`
- payment route helpers

Suggested tooling:

- Stryker for TypeScript / JavaScript

Rollout plan:

1. pilot mutation testing on one auth helper module
2. measure mutation score and test runtime cost
3. expand to security and payment logic only
4. keep mutation testing out of the default fast CI path until it is stable

## Reporting Standards

- publish HTML coverage artifact in CI
- summarize coverage deltas in pull requests
- highlight modules with the largest uncovered line counts
- track quarterly milestone completion in engineering reviews

## Ownership

- frontend maintainers own UI and route test growth
- platform/security reviewer owns auth, security, and payment coverage targets
- release owner ensures threshold changes are communicated before enforcement
