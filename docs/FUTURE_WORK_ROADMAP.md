# Future Work Roadmap

## Purpose

This document captures the forward-looking engineering roadmap for `shothik-web`, with emphasis on:

- technical debt reduction
- scalability and architecture hardening
- feature delivery prioritization
- upgrade and migration planning
- disaster recovery and business continuity
- monitoring and alerting maturity
- documentation maintenance

## Executive Priorities

### Immediate Priorities

- harden standalone repo assumptions
- reduce build-time env fragility in API routes
- raise test coverage in critical route families
- complete repo-split execution for adjacent backend services

### Medium-Term Priorities

- standardize API route contracts and error shapes
- improve route-level observability and SLO tracking
- reduce module-scope SDK initialization
- strengthen payment and webhook resiliency

### Long-Term Priorities

- further decompose route-side orchestration into reusable service adapters
- reduce dependency surface where packages are only lightly used
- push more contract documentation into generated OpenAPI output

## Technical Debt Register

### 1. Module-Scope SDK Initialization

Observed debt:

- several API routes create Stripe or Convex clients at import time

Impact:

- build-time failures when env vars are absent
- more brittle testing and CI

Resolution:

- move client creation into lazy getter functions
- add env guards with explicit error handling

Priority:

- high

### 2. Mixed API Route Patterns

Observed debt:

- route handlers vary in validation depth, error formatting, and auth strategy

Impact:

- inconsistent operational behavior
- harder production debugging

Resolution:

- standardize request validation and error response helpers
- create route-level coding standards

Priority:

- high

### 3. Coverage Floor Too Low

Observed debt:

- current Vitest coverage thresholds are intentionally permissive

Impact:

- allows critical route logic to regress without enough signal

Resolution:

- raise coverage thresholds in phases
- require higher coverage for auth, payment, and critical tool routes

Priority:

- high

### 4. Extracted Repo Dependency Drift

Observed debt:

- standalone extraction surfaced dependencies that had been masked by monorepo hoisting

Impact:

- risk of hidden breakage during future split operations

Resolution:

- periodically diff runtime imports against direct dependency declarations

Priority:

- medium

### 5. E2E Coverage Gaps

Observed debt:

- Playwright config exists, but repo-scoped E2E journeys are still incomplete

Impact:

- core user workflows rely too heavily on unit/integration confidence only

Resolution:

- add smoke suites for auth, tools, payments, and Twin flows

Priority:

- high

## Scalability And Architectural Enhancements

### API Route Layer

- add shared request parsing and response formatting helpers
- introduce consistent problem-response structure
- classify routes by latency budgets and dependency criticality

### Data And Caching

- standardize Redis / Upstash usage patterns
- expand idempotency and caching around payment and heavy tool routes
- create measurable cache hit-rate KPIs

### Service Integration Layer

- consolidate outbound HTTP client logic
- unify timeout and retry strategies
- add circuit-breaker metrics for external service calls

### Frontend Runtime

- continue domain bucketing for `components/`, `hooks/`, and `lib/`
- isolate feature-heavy bundles for better load-time behavior
- review large client-only dependencies for code-splitting opportunities

## Feature Development Priorities

### Quarter 1

- standalone frontend repo stabilization
- route hardening for payments and publishing
- critical E2E smoke tests

### Quarter 2

- API contract normalization
- route observability and dashboard improvements
- structured deprecation/versioning policy for public and semi-public endpoints

### Quarter 3

- scale testing around Twin and multi-step workflows
- route performance profiling under concurrency
- external service failover improvements

### Quarter 4

- coverage threshold increase
- security posture review
- dependency reduction and modernization pass

## Technology Stack Upgrade Paths

### Next.js / React

- stay on the latest stable Next 16 patch line until Next 17 is production-ready
- re-evaluate React peer warnings from Swagger-related packages quarterly

### TypeScript

- remain on the latest stable `5.x` until ecosystem readiness for `6.x`

### Convex

- keep the frontend repo’s Convex package aligned with the deployed backend expectations
- evaluate breaking changes before upgrades affecting generated bindings

### Tooling

- keep Vitest, Playwright, ESLint, and Prettier current in controlled quarterly maintenance windows

## Disaster Recovery And Business Continuity

### Required Recovery Planning

- document environment recreation from secret stores
- keep a tested rollback path for frontend deploys
- maintain webhook replay procedures for payment systems
- maintain Convex deployment recovery instructions
- ensure Redis outage fallback behavior is documented

### Recovery Targets

- deploy rollback target: `< 15 minutes`
- critical route restoration target: `< 60 minutes`
- dashboard / health endpoint visibility target: immediate

### Business Continuity Practices

- no single engineer should own production-only deployment knowledge
- deployment procedures must be documented and rehearsed
- sandbox payment verification should be part of release readiness

## Monitoring And Alerting Enhancements

### Current Baseline

- health endpoints
- runtime metrics exposure
- analytics hooks

### Next Improvements

- p95/p99 dashboard by route family
- alerting on payment webhook failures
- alerting on degraded external dependency health
- route-level error budget tracking
- anomaly detection on tool route latency and failure spikes

### Recommended Alert Classes

- critical:
  - checkout failures
  - webhook failures
  - Convex outage
- warning:
  - degraded tool latency
  - Redis fallback usage spikes
  - build-time env validation regressions

## Documentation Maintenance Procedures

### Ownership

- frontend lead owns README and architecture updates
- platform / cloud engineer owns deployment, Docker, and environment sections
- QA or quality owner owns testing documentation updates

### Update Triggers

Update docs when:

- a new route family is added
- a required environment variable changes
- deployment steps change
- a payment provider or auth provider changes
- a dependency upgrade changes runtime expectations

### Minimum Update Schedule

- monthly quick review for environment and deployment docs
- quarterly full review for architecture, testing, and roadmap docs

## Quarterly Review Checklist

### Engineering

- review dependency drift
- review route failures and top incident categories
- review coverage movement

### Platform

- review Docker and deployment assumptions
- review secrets inventory
- review infra scaling assumptions

### Security

- review auth provider changes
- review webhook verification flows
- review secret rotation status

### Documentation

- verify README accuracy
- verify example commands still work
- archive stale implementation plans
