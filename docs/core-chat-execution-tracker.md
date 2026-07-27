# Core Chat Execution Tracker

## Scope
- Active workflow: `docs/CORE_CHAT_EXECUTION_WORKFLOW.md`
- Active milestone: `Milestone 1: Chat Reliability Baseline`
- Active chat improvement plan: `docs/CHAT_PHASED_ADOPTION_BUILD_PLAN.md`
- Deferred: Google sign-in unless it directly blocks core chat

## Completed Nodes
- Native Insforge email auth routes exist for sign-in, sign-up, sign-out, refresh, verify-email, and OAuth callback/start.
- Auth UI now surfaces real Insforge errors and verification-required paths.
- Verify-email page and server route are implemented.
- OWASP exemptions were added for public auth routes and Insforge callback flows.
- Focused auth/security tests were already passing for the recent auth slice.
- Chat bootstrap now waits for auth hydration, redirects unauthenticated users to login, and no longer treats `/api/user-limit` as a protected failure.
- Local development auth attempts no longer get blocked by the production-grade auth rate limiter.
- Authenticated visits to auth pages now redirect to `/auth/post-login` instead of the dead `/dashboard` path.
- Authenticated `/api/chat/conversations` failures now return structured JSON with `503 CHAT_PERSISTENCE_UNAVAILABLE` instead of an empty `500`.
- Flagship chat now keeps a user-scoped local recovery snapshot and restores recent chat work when server history is empty or unavailable.
- Convex auth diagnostics now expose the real JWT key mismatch through `/api/health?deep=true` and `/api/auth/convex-token`.
- Convex JWKS has been redeployed so the live `/.well-known/jwks.json` now matches the app-side JWT signer.
- Chat persistence no longer depends on the underprivileged deploy-key internal bridge; `lib/chat/server.ts` now uses authenticated public Convex queries/mutations.
- Public Convex chat mutations now cover assistant placeholder/chunk/complete/stop/fail flows and accept the richer chat metadata used by the flagship UI.
- Auth hydration now has a server-backed `/api/auth/session` probe and an Insforge refresh retry before the client falls back to anonymous state.

## Current Milestone 1 Acceptance Gaps
- Authenticated chat is not yet proven end to end in the live app.
- Chat bootstrap no longer treats `/api/user-limit` as a protected failure, but a real authenticated browser chat turn is still unproven.
- Hermes runtime readiness is not yet proven from a successful authenticated chat turn.
- Milestone evidence is incomplete for: successful login -> persisted session -> conversation history -> chat turn.
- The remaining live blocker is browser/session/page stability on `/agents/chat`: the latest browser acceptance pass still redirected away before conversation history could be verified.

## Active Blocker Investigation
- Debug session: `debug-chat-auth-session.md`
- Goal: isolate the highest-value blocker on the authenticated chat path and land the smallest fix with verification evidence.
- Current finding:
  - The Convex auth/JWKS mismatch has been repaired and the live deployment now reports `convex:auth = healthy`.
  - The current browser acceptance blocker is not Convex auth; it is session routing/state that sends `/agents/chat` to `/auth/post-login` in the observed browser run.

## Immediate Next Tasks
- Complete Phase 1 provider modularization for chat so the orchestrator no longer owns raw provider transport details.
- Re-run a verified Insforge browser sign-in and confirm `/api/chat/conversations` succeeds with the active session on the repaired public Convex path.
- Diagnose the current `/agents/chat` client transition (`/agents/chat` -> transient error state -> `/writing-studio`) after auth hydration changes.
- Execute one real authenticated chat turn and capture Hermes/session evidence.
- Record blocker status and evidence after each implementation step.

## Latest Verification
- `pnpm.cmd exec vitest run "lib/chat/local-history.test.ts" "components/agents/__tests__/ChatAgentPage.test.tsx"` -> `2` files passed, `5` tests passed
- Recovery guarantee validated in unit coverage:
  - local chat snapshots save/load correctly
  - chat page surfaces a recovery notice and restores local history when server history is unavailable
- `pnpm.cmd exec vitest run "lib/convex/auth-diagnostics.test.ts" "app/api/auth/convex-token/route.test.ts" "app/api/health/__tests__/route.test.ts" "lib/security/owasp-compliance.test.ts"` -> `4` files passed, `14` tests passed
- `pnpm.cmd exec vitest run lib/convex/auth-diagnostics.test.ts app/api/auth/convex-token/route.test.ts lib/chat/server.test.ts app/api/chat/conversations/route.test.ts app/api/chat/conversations/[conversationId]/route.test.ts app/api/chat/conversations/[conversationId]/messages/route.test.ts app/api/chat/messages/[messageId]/route.test.ts` -> `7` files passed, `22` tests passed
- `pnpm.cmd exec convex deploy --typecheck disable --env-file .env.local` -> deployed Convex functions to `https://dashing-mandrill-233.convex.cloud`
- Live runtime diagnostics now report:
  - `https://dashing-mandrill-233.convex.site/.well-known/jwks.json` now serves the redeployed modulus that matches the app signer
  - `/api/health?deep=true` -> `checks["convex:auth"] = healthy`
  - `/api/auth/convex-token` with a placeholder token now returns `401 Invalid or expired access token`, not `503 CONVEX_JWT_KEY_MISMATCH`
- Browser acceptance recheck:
  - `/agents/chat` briefly loads the chat title, then resolves to `/auth/post-login`
  - no `persistence-unavailable` text appeared in that run
  - the live acceptance blocker has shifted from Convex auth to app/session routing state
- Browser acceptance recheck after the server-backed session probe:
  - `/agents/chat` initially loads `AI Chat — Shothik AI`
  - the route then shows a transient error state and finally resolves to `/writing-studio`
  - conversation/history UI still does not remain mounted
  - the blocker has narrowed further to client/runtime stability on the chat route rather than Convex auth or JWKS

## Current Status
- Milestone 1: `in progress`
- Highest-value blocker: `authenticated browser proof for /agents/chat`
