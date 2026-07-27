# Chat Architecture Adaptation Plan

## Reference architecture summary

Reference reviewed: `https://codewiki.google/github.com/alpaservices/elite_chatgpt_clone`

The reference system follows a split architecture:

- client application for composer, transcript, state, and cache management
- backend API gateway for authentication, model routing, middleware, and persistence
- persistent conversation/message storage
- real-time message delivery and long-lived session state
- Docker-oriented deployment with operational tooling
- explicit support for model orchestration, tool invocation, and MCP-style integrations

## Current Shothik architecture

Shothik already has the right backbone for this pattern:

- `app/api/chat/route.ts` is a thin gateway
- `lib/hermes/modules/chat-orchestrator/index.ts` owns routing, session/run lifecycle, and provider streaming
- `components/agents/ChatAgentPage.tsx` renders the flagship chat client and handles SSE consumption
- `convex/conversations.ts` and `convex/messages.ts` back durable conversation/message storage
- `providers/ConvexClientProvider.jsx` bridges Insforge-authenticated users into Convex
- local recovery in `lib/chat/local-history.ts` protects users when remote history is temporarily unavailable

This means we do not need to replace the runtime. We only need to adapt it in the areas the reference architecture is stronger or more explicit.

## Adapted target architecture

### 1. Message routing

Keep the existing Shothik flow:

`Client -> /api/chat -> ChatOrchestrator -> provider adapter -> SSE stream -> client`

Why this matches the reference:

- thin gateway keeps transport and auth separate from orchestration
- orchestrator stays responsible for run/session/workspace lifecycle
- SSE remains the right fit for token streaming and canonical Hermes events

### 2. User session management

Keep Insforge as the source of truth for identity, and Hermes session/run IDs as chat-runtime state.

Adaptation added:

- explicit per-device sync metadata on chat turns
- dedicated sync feed at `/api/chat/sync`

This gives multi-platform clients a pull-based synchronization surface without forcing them to replay the full transcript every time.

### 3. Real-time communication

Keep the current SSE transport and Hermes event envelopes.

Why:

- the repo already emits canonical events such as `session_created`, `run_started`, `progress_update`, and `run_completed`
- SSE is simpler than WebSockets for the current one-way token-streaming pattern
- Hermes events already create a clean seam for future replay/resume support

### 4. Data storage architecture

Reference system idea:

- persistent conversation/message records with search and history support

Shothik adaptation:

- Convex remains the durable system of record
- local recovery remains the client-side fail-safe
- messages now support structured privacy metadata, sync descriptors, and client-encrypted envelopes
- conversation previews now honor privacy mode so sensitive turns do not leak raw previews into list views

### 5. Scalability strategy

Reference system patterns that map well here:

- keep request handlers thin
- push orchestration into service modules
- separate persistence from transport
- make testing and operational load checks scriptable

Shothik adaptation:

- keep the gateway thin
- add sync cursor semantics rather than repeated full-history fetches
- keep Redis-backed Hermes streaming for hot runtime state
- extend the load harness with a `chat-sync` scenario

## Privacy and encryption adaptation

## Important constraint

True server-blind end-to-end encryption is not fully compatible with the current Shothik runtime, because the server orchestrator must read user content in order to:

- route the request
- run document ingestion
- call the model provider
- persist the assistant response

So the correct compatible adaptation for the current stack is:

- explicit privacy classification for each turn
- minimized preview persistence for sensitive turns
- support for optional client-encrypted message envelopes for synchronized replicas

This is implemented as the foundation for BYOK encrypted sync. A future phase can move to full E2E only if the product also changes one of these assumptions:

- client-side model execution
- trusted execution environment for model routing
- user-controlled key release service

## Implemented changes

### Domain and privacy

- `lib/chat/types.ts`
  - added privacy, sync, and encrypted-envelope types
- `lib/chat/privacy.ts`
  - added normalization, preview-minimization, and audit-redaction helpers
- `lib/chat/privacy.test.ts`
  - added regression coverage

### Encrypted sync foundation

- `lib/chat/secure-envelope.ts`
  - added AES-GCM portable sync envelope helpers
- `lib/chat/secure-envelope.test.ts`
  - added round-trip encryption coverage

### Chat runtime integration

- `app/api/chat/route.ts`
  - now accepts privacy, sync, and client-encrypted envelope metadata
- `lib/hermes/modules/chat-orchestrator/index.ts`
  - persists privacy and sync metadata on user and assistant turns
- `components/agents/ChatAgentPage.tsx`
  - now generates a stable device ID and sends privacy/sync metadata with each turn

### Multi-platform synchronization

- `lib/chat/server.ts`
  - added `getChatSyncSnapshotForUser()`
- `app/api/chat/sync/route.ts`
  - added authenticated sync endpoint
- `app/api/chat/sync/route.test.ts`
  - added route coverage
- `test/load/scalable-chat.ts`
  - added `chat-sync` scenario for authenticated load validation

### Privacy-safe storage behavior

- `convex/messages.ts`
  - conversation previews now respect message privacy
- `convex/schema.ts`
  - message metadata widened to support privacy/sync/envelope fields already used by the runtime

## Integration sequence

1. Keep the current `/api/chat` gateway and Hermes orchestrator as the primary runtime.
2. Use `/api/chat/sync` for mobile/web/desktop state reconciliation.
3. Treat privacy mode as part of the turn contract, not UI-only state.
4. Use encrypted envelopes for synchronized replicas where a client-managed key is available.
5. Keep Convex as the durable store and local recovery as the degraded-mode fallback.
6. Add key-management UX before claiming full E2E in production.

## Validation

### Automated tests

Passed:

- `lib/chat/privacy.test.ts`
- `lib/chat/secure-envelope.test.ts`
- `app/api/chat/sync/route.test.ts`
- `lib/chat/local-history.test.ts`
- `components/agents/__tests__/ChatAgentPage.test.tsx`

### Load testing

The existing TypeScript load harness could not be executed directly in this workspace because the local `tsx` runtime is missing its `esbuild` dependency link.

To keep validation moving, a direct Node smoke load test was run against the live local app:

- target: `GET http://localhost:3000/api/health`
- total requests: `20`
- concurrency: `5`
- results:
  - `20/20` successful responses
  - average latency: `67.75ms`
  - p50: `55ms`
  - p95: `113ms`
  - max: `136ms`

This validates baseline local runtime responsiveness. Authenticated `chat` and `chat-sync` load testing still requires a valid session cookie or bearer token.

## Next recommended phase

1. add a user-facing BYOK key-management flow for encrypted sync
2. add authenticated `chat-sync` load validation using a real session
3. add delta-based push or resume semantics if mobile sync becomes latency-sensitive
4. decide whether the product truly needs full server-blind E2E, because that requires a broader runtime redesign than the current server-side orchestration model
