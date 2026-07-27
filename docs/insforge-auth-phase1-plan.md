# InsForge Auth Phase 1 Plan

## Scope

Phase 1 covers native InsForge authentication for chat session ownership.
The immediate goal is to let chat routes and client auth state resolve users
through InsForge first, while keeping the legacy bridge available only as a
short-term fallback during migration.

## Core Objectives

1. Establish native InsForge SSR auth for sign-in, sign-up, sign-out, and refresh.
2. Ensure chat API requests can reach route handlers with valid InsForge session cookies.
3. Keep existing security controls, linting rules, and TypeScript standards intact.
4. Require automated tests and a peer review checkpoint before any deployment.

## Milestones And Target Dates

### Milestone 1: Auth Foundation
- Target date: 2026-07-14
- Status: Completed
- Deliverables:
  - Shared InsForge browser/server helpers
  - Native auth route handlers
  - Auth provider hydration through InsForge with legacy fallback
  - Proxy support for InsForge-backed chat requests

### Milestone 2: Test Coverage And Validation
- Target date: 2026-07-15
- Status: Completed
- Deliverables:
  - Unit tests for auth user normalization
  - Integration-style route tests for sign-in and sign-up handlers
  - Server auth fallback tests
  - Verification evidence from lint, type-check, and targeted Vitest runs

### Milestone 3: Native Chat Ownership Cutover
- Target date: 2026-07-16
- Status: Completed (repo changes ready, waiting for review/deploy sequencing)
- Deliverables:
  - Remove remaining chat-path dependency on the legacy external ID bridge
  - Update schema and persistence logic toward native InsForge user ownership
  - Validate conversation/message access control under native auth

### Milestone 4: Review Gate Before Deployment
- Target date: before any production release
- Status: In progress
- Deliverables:
  - Peer review of auth, proxy, and chat ownership changes
  - Test summary attached to the review
  - Explicit sign-off on migration risks and rollback approach

## Testing Standard

Every auth migration slice must include:
- ESLint pass for changed files
- TypeScript `--noEmit` pass
- Unit tests for new normalization or helper logic
- Integration-style tests for route handlers where behavior changes

## Current Risks

1. The repo now contains a staged migration that promotes `auth_user_id` to the canonical chat owner and preserves `legacy_user_id` only for compatibility; it still needs coordinated deploy plus migration apply.
2. The broader app still contains legacy JWT-based flows outside the chat path.
3. Proxy security logic remains partly coupled to the legacy JWT verifier for non-chat APIs.

## Progress Record

- 2026-07-14: Added InsForge browser/server auth helpers, refresh/sign-in/sign-up/sign-out routes, and AuthProvider hydration support.
- 2026-07-14: Updated proxy and chat routes so chat runtime requires native InsForge sessions instead of the legacy external ID bridge.
- 2026-07-14: Added staged chat ownership migration using `auth_user_id` as the canonical owner and retained `legacy_user_id` only for compatibility/backfill.
- 2026-07-14: Added route, auth, and chat persistence tests covering the new ownership model and auth behavior.
- 2026-07-14: Completed live preflight for rollout sequencing: created an InsForge backup and confirmed the remote database is still on the legacy `user_id` bridge schema.
- 2026-07-14: Added PR draft and rollout documentation for coordinated review, deploy, and migration execution.
- 2026-07-14: Merged the rollout into personal `main`, fixed a Next.js 16 production-build issue caused by invalid `"use server"` utility modules, and verified a clean production build.

## Review Checklist

- Does the change preserve route-level authorization?
- Do chat requests work with native InsForge session cookies?
- Are legacy fallbacks scoped narrowly and documented?
- Are tests included and passing locally?
- Has a peer reviewed the diff before deployment?
