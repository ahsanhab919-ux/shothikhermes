# PR Draft: Native InsForge Chat Auth

## Summary

This PR completes phase 1 of the chat auth migration by moving chat runtime
access to native InsForge authentication and staging database ownership on
`auth_user_id`.

## Change Type

- [x] Feature
- [x] Fix
- [x] Security
- [x] Test
- [x] Docs

## What Changed

- Added InsForge browser/server auth helpers and native auth routes:
  - `POST /api/auth/refresh`
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-up`
  - `POST /api/auth/sign-out`
- Updated `AuthProvider` to hydrate native InsForge sessions first, with the
  legacy bridge kept only as a temporary fallback for non-chat paths.
- Updated `proxy.ts` so chat paths recognize InsForge session cookies.
- Cut all chat API routes over to native InsForge auth via
  `getChatAuthenticatedUser()`.
- Added a staged migration to promote `auth_user_id` as the canonical owner for
  `chat_conversations` and `chat_messages`, while preserving `legacy_user_id`
  for compatibility/backfill.
- Updated chat persistence SQL in `lib/chat/server.ts` to read and write using
  `auth_user_id`.
- Added tests for auth routes, chat routes, chat auth fallback behavior, and
  chat persistence ownership behavior.

## Validation

- [x] `./node_modules/.bin/eslint ...`
- [x] `./node_modules/.bin/tsc --noEmit --pretty false`
- [x] `./node_modules/.bin/vitest run ...`

## Risk Review

- [x] No new secrets added to source control
- [x] Auth and authorization impact reviewed
- [x] API routes return stable error codes and response shapes
- [x] Performance impact assessed for hot paths
- [x] Dependency changes reviewed for license and vulnerability impact

## Deployment / Migration Notes

- Do **not** apply the new migration before the updated app code is deployed.
- Coordinated order:
  1. Review and approve this PR
  2. Deploy updated app code
  3. Apply `20260714014616_adopt-native-chat-auth-ownership.sql`
  4. Run post-migration verification queries

## Reviewer Notes

- Code owners touched: `@shothikwork`
- Review focus:
  - auth/session handling
  - chat authorization boundaries
  - migration safety and rollback posture
