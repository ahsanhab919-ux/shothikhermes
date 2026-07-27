# Test Case Documentation

## Purpose

This document defines the testing strategy for `shothik-web` and is intended for:

- frontend developers
- API route maintainers
- production engineers
- cloud and release engineers

It covers current test mechanisms, required test categories, quality gates, and the recommended path to raise confidence over time.

## Current Test Tooling

### Unit And Integration

- Vitest
- Testing Library
- JSDOM

Primary config:

- [vitest.config.ts](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/vitest.config.ts)

Test setup:

- [test/setup.ts](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/test/setup.ts)

### End-To-End

- Playwright

Config:

- [playwright.config.ts](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/playwright.config.ts)

Note:

- the extracted repo now points Playwright to local `./e2e`
- E2E scenarios should be added progressively for critical workflows

## Commands

### Type Safety

```bash
pnpm type-check
```

### Unit / Integration

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### E2E

```bash
pnpm exec playwright test
```

## Test Categories

## Unit Test Specifications

Unit tests should cover:

- pure utilities in `lib/`
- local data mappers
- validators
- auth/token parsing helpers
- formatting and parsing helpers
- configuration guards
- isolated React hooks with deterministic behavior

Unit tests must verify:

- valid input behavior
- invalid input handling
- null / undefined / empty edge cases
- serialization and formatting correctness
- error messages for rejected inputs

### Required Unit Test Targets

| Area | Examples | Minimum Expectation |
| --- | --- | --- |
| Validation helpers | request/body/schema validation | valid + invalid branches |
| Auth helpers | bearer token extraction, agent key checks | malformed token coverage |
| Security helpers | PII sanitization, idempotency utilities | false positive / false negative checks |
| Data transforms | response shaping, route formatting | schema-stable output |
| Tool helpers | cache and retry logic | timeout and fallback behavior |

## Integration Test Scenarios

Integration tests should focus on:

- API route handler behavior
- route-to-service orchestration
- route-to-Convex contracts
- database or external adapter boundaries
- auth and authorization gates

### Required API Route Integration Scenarios

For every critical route family, test:

- valid request -> expected `2xx`
- malformed JSON -> `400`
- validation failure -> `4xx`
- unauthorized request -> `401`
- forbidden request -> `403` when applicable
- upstream dependency failure -> `5xx` or `503`
- timeout handling -> deterministic error response

### Critical Route Families

| Route Family | Why Critical | Required Coverage |
| --- | --- | --- |
| `/api/tools/*` | core product features | body validation, auth, upstream failure, response shape |
| `/api/stripe/*` | financial operations | auth, idempotency, webhook verification, provider failure |
| `/api/razorpay/*` | financial operations | key config, provider failure, callback handling |
| `/api/bkash/*` | financial operations | callback integrity, credential handling |
| `/api/twin/*` | agent and identity workflows | auth, permissions, side-effect correctness |
| `/api/publish/*` | book/export flows | Convex lookup, service integration, binary handling |
| `/api/health*` | observability | liveness, deep checks, metrics auth |

## End-To-End Test Cases

E2E tests should cover user-visible critical workflows.

### Priority 1 Flows

- sign in and sign up
- paraphrase a document
- plagiarism analysis from input text
- grammar correction flow
- writing studio load and save
- payment checkout initiation
- Twin registration / profile flow

### Priority 2 Flows

- publishing manuscript validation
- book export and conversion initiation
- API docs accessibility
- dashboard/account navigation
- shared content / public pages

### E2E Assertions

- page loads without fatal runtime error
- auth redirects behave correctly
- API-backed actions show expected user feedback
- no broken route transitions
- no console error spike for critical flows

## Performance Test Requirements

Performance testing should be tracked for route families and user journeys separately.

### Acceptable Thresholds

| Metric | Target | Alert Threshold |
| --- | --- | --- |
| API route p95 latency | `< 800ms` for internal logic-only routes | `> 1500ms` |
| Tool route p95 latency | `< 2500ms` excluding external model latency | `> 5000ms` |
| Health route latency | `< 300ms` | `> 1000ms` |
| SSR page TTFB | `< 1000ms` for standard authenticated pages | `> 2000ms` |
| Error rate | `< 0.1%` for health and config routes | `> 1%` |

### Required Performance Scenarios

- malformed request flood against protected routes
- repeated cacheable requests
- concurrent Twin/task access patterns
- concurrent payment callback simulation
- service timeout behavior for NLP / AI detector / Calibre calls

## Security Test Cases

Security tests should cover:

- bearer token parsing
- unauthorized request rejection
- role and permission enforcement
- webhook signature verification
- idempotency behavior for payment routes
- input sanitization and PII redaction
- SSR/server-only secret leakage checks

### Required Security Assertions

- no secret values returned in JSON responses
- no stack traces exposed to clients
- invalid signatures return `401` or `403`
- duplicate mutation requests are blocked or deduplicated
- agent keys cannot bypass unrelated user authorization rules

## Test Data Requirements

### Unit / Integration Fixtures

Maintain reusable fixtures for:

- authenticated user request headers
- agent key requests
- malformed JSON payloads
- mock Convex responses
- mock service failures
- payment callback payloads

### Environment Setup

For CI and local integration tests, define:

- `NEXT_PUBLIC_CONVEX_URL`
- `STRIPE_SECRET_KEY`
- route-specific optional provider keys if exercised in tests

Use sandbox or placeholder values where live providers are not required.

## Automated Testing Pipeline

### Required Pipeline Stages

1. dependency install
2. lint
3. type-check
4. unit / integration tests
5. coverage report
6. production build validation
7. optional Playwright smoke tests for release branches

### Current Repository Workflow

The initial GitHub Actions workflow lives at:

- [ci.yml](file:///Users/macos/Downloads/shothik-platfrom1%204/fresh-repos/shothik-web/.github/workflows/ci.yml)

Current enforced checks:

- `pnpm install --frozen-lockfile`
- `pnpm type-check`
- `pnpm test:coverage`
- `pnpm build`

Current optional manual check:

- Playwright smoke suite when `./e2e` contains tests and the workflow is manually dispatched

### Recommended CI Commands

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm test:coverage
NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud STRIPE_SECRET_KEY=sk_test_placeholder pnpm build
```

## Coverage Requirements And Reporting Standards

### Current Enforced Thresholds

Current Vitest thresholds:

- lines: `40`
- functions: `40`
- branches: `30`
- statements: `40`

### Recommended Target Thresholds

These should be the engineering target, even if the config is raised in phases:

- global lines / functions / statements: `80%`
- global branches: `70%`
- critical API route helper modules: `95%`
- payment, auth, and idempotency logic: `95%`
- health and monitoring routes: `90%`

### Reporting Standards

- store HTML coverage reports in CI artifacts
- publish summary percentages in pull request checks
- flag drops larger than `2%` from the baseline
- treat uncovered critical route branches as merge blockers

## Code Review Quality Gates For Tests

Every API route change should include:

- updated unit or integration tests when behavior changes
- explicit validation of non-`200` status paths
- auth / permission coverage where relevant
- timeout or upstream-failure coverage for external service routes

## Quarterly Review Cycle

Every quarter:

- review missing tests for new route groups
- re-evaluate performance thresholds
- update fixture quality
- raise coverage floors where practical
- archive flaky tests or fix them immediately
