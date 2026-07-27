# /agents/chat → Hermes-Backed Runtime: Analysis and First Change

## Date

2026-07-25

## Purpose

Document why `/agents/chat` was a direct frontend chat path, and record the
first concrete repo change that moves it toward Hermes sessions and runs.

## Problem: Why /agents/chat Was Not Hermes-Backed

The `/agents/chat` page (`components/agents/ChatAgentPage.tsx`) sends chat
turns to `POST /api/chat`. The route handler (`app/api/chat/route.ts`) was
doing five things that violate the Hermes target architecture
(ADR-003, HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN):

1. **Direct provider call in the route handler** — the route called
   `fetch(generativelanguage.googleapis.com/...streamGenerateContent...)`
   inline. ADR-003 forbids gateway routes from calling model providers for
   core product workflows.

2. **No HermesOrchestrator involvement** — the route imported an in-memory
   `runs` Map from `app/api/runs/route.ts` and stored run metadata there,
   but never called `getHermesOrchestrator().createRun()`. The
   orchestrator's database-backed runs, sessions, and event system were
   completely bypassed.

3. **Business logic in the gateway** — message lifecycle (create user msg,
   create assistant msg, append chunks, complete/fail/stop) lived inline in
   the route handler. ADR-003 says routes must not "mutate artifact state
   directly except through Hermes contracts."

4. **Two parallel event systems** — the route used the lightweight
   `HermesEventEmitter` from `lib/hermes/events.ts` (SSE-only, no
   persistence). The orchestrator uses `HermesStreamingEngine`
   (Redis-backed, with replay and hot state). They were disconnected.

5. **"chat" missing from the contract** — `ArtifactDomainSchema` in
   `lib/hermes/contracts/core.ts` had `slides`, `sheets`, `research`,
   `writing`, `books`, `ai-detector`, `plagiarism`, `publish` — but no
   `chat`. The orchestrator could not create a chat-domain run.

## First Concrete Change (Executed)

### 1. Added "chat" to ArtifactDomainSchema

**File:** `lib/hermes/contracts/core.ts`

Added `"chat"` as the first entry in the `ArtifactDomainSchema` enum.
This allows `HermesOrchestrator.createRun()` to accept `domain: "chat"`.

### 2. Created ChatOrchestrator Module

**File:** `lib/hermes/modules/chat-orchestrator/index.ts` (new)

A backend-owned chat execution module that encapsulates:

- conversation resolution (create or resume)
- user + assistant message persistence (via `lib/chat/server`)
- Hermes run creation (via `getHermesOrchestrator().createRun()`)
- run lifecycle management (startRun, completeRun)
- provider call (Gemini streaming API)
- delta streaming with SSE event emission
- abort, error, and completion handling

Public API:

```typescript
const orchestrator = getChatOrchestrator();
const result = await orchestrator.executeChatTurn({
  userId,
  messages,
  conversationId,
  surface,
  modelHandle,
  contextRef,
  signal,
});

// result.stream is a ReadableStream<Uint8Array> — relay it verbatim
return new Response(result.stream, { headers: SSE_HEADERS });
```

The module emits legacy events (`conversation`, `message_start`, `chunk`,
`done`, `error`) for backward compatibility with the existing frontend,
while also creating and managing Hermes runs through the orchestrator.

### 3. Refactored Route Handler to Thin Gateway

**File:** `app/api/chat/route.ts` (rewritten)

The route handler is now ~100 lines and does only:

1. authenticate the user
2. enforce rate limits
3. parse and validate the request body
4. delegate to `getChatOrchestrator().executeChatTurn()`
5. relay the returned SSE stream

All provider calls, message persistence, and run management have been
moved to the chat-orchestrator module.

### 4. TypeScript Verification

`npx tsc --noEmit` produces 3 errors, all pre-existing:

- `lib/hermes/index.ts:17` — duplicate export of `CreateSessionRequest` and
  `CreateRunRequest` (local interfaces conflict with re-exports from
  `./client`). Pre-existing, not introduced by this change.
- `prisma.config.ts:4` — cannot find `prisma/config` module. Pre-existing,
  unrelated to chat.

Zero new errors from the new module or the refactored route.

## What Changed in the Data Flow

### Before

```
ChatAgentPage → POST /api/chat
  → route handler:
      → in-memory runs Map (not HermesOrchestrator)
      → direct fetch to generativelanguage.googleapis.com
      → inline message persistence (lib/chat/server)
      → inline SSE assembly with HermesEventEmitter (not StreamingEngine)
  → SSE stream back to page
```

### After

```
ChatAgentPage → POST /api/chat
  → route handler (thin gateway):
      → auth, rate limit, validate
      → getChatOrchestrator().executeChatTurn()
          → HermesOrchestrator.createRun({ domain: "chat" })
          → HermesOrchestrator.startRun() / completeRun()
          → lib/chat/server persistence (same as before)
          → direct fetch to provider (now behind orchestrator)
          → SSE stream assembly
      → relay stream verbatim
  → SSE stream back to page
```

## What This Enables Next

- **Run-aware chat**: every chat turn now creates a Hermes run with a
  proper runId, workspaceId, and domain. The run is stored in the Hermes
  database (not an in-memory Map).
- **Event replay**: once the chat-orchestrator is wired to emit through
  `HermesStreamingEngine` (currently uses inline SSE), runs will support
  replay and hot-state polling.
- **Session binding**: chat turns can be associated with Hermes sessions,
  enabling pause/resume and cross-surface continuity.
- **Tool routing**: the orchestrator can intercept chat turns and route to
  tools (slides, sheets, research) instead of direct provider calls.
- **Artifact creation**: chat turns that produce artifacts (slides, sheets,
  documents) can go through the same run lifecycle.

## Remaining Work

1. ~~Wire `ChatOrchestrator` to emit canonical `HermesEventEnvelope` events
   through `HermesStreamingEngine` (Redis-backed) instead of inline SSE.~~
   **Done in slice 3 — see below.**
2. ~~Bind chat turns to `HermesSession` records (create or resume session per
   conversation).~~ **Done in slice 2 — see below.**
3. ~~Update `ChatAgentPage` to consume `runId` from the response and pass it
   back on subsequent turns (resume path).~~ **Done in slice 1+2.**
4. ~~Pre-create workspace via `WorkspaceManager` instead of using
   `ws_chat_${userId}` synthetic ID.~~ **Done in slice 2 — real workspaces
   now created/reused via `WorkspaceManager`.**
5. Fix the pre-existing duplicate export conflict in `lib/hermes/index.ts`.
6. ~~Add integration tests for the chat-orchestrator module.~~ **Done in
   slice 2 — 9 focused tests covering session binding, workspace resolution,
   error paths, and SSE event emission.**

---

## Slice 3: Canonical Streaming Bridge (2026-07-25)

### Problem

Slices 1 and 2 added run-awareness and session-awareness, but the SSE stream
still used ad-hoc `__hermes: true` JSON objects that didn't conform to the
`HermesEventEnvelope` contract. These objects lacked `eventId`, `sequence`,
and proper `payload`/`metadata` structure. They were never persisted to Redis,
so:

- No event replay was possible for resumed runs
- No hot-state polling was available for status checks
- The canonical event contract was violated
- Content chunk deltas were not represented in the canonical event stream

### Change

#### 1. Created `ChatStreamBridge` class

**File:** `lib/hermes/modules/chat-orchestrator/stream-bridge.ts` (new)

A bridge that emits canonical `HermesEventEnvelope` events through both:
- `HermesStreamingEngine.emitRunEvent()` → Redis (replay list, hot state,
  sequence assignment)
- The client SSE stream (with `__hermes: true` marker for frontend
  identification)

Public API:

```typescript
const bridge = new ChatStreamBridge(runId, workspaceId, sessionId);

// Emit canonical event (Redis + SSE)
await bridge.emit(sse, "run_started", { modelHandle }, { runStatus: "running" });

// Write legacy event (SSE only, no Redis)
bridge.writeLegacy(sse, { type: "chunk", content: text });

// Close stream
bridge.close(sse);
```

Graceful degradation: if Redis is unavailable, events still flow to the SSE
stream with a fallback local sequence counter.

#### 2. Refactored `executeChatTurn` to use the bridge

**File:** `lib/hermes/modules/chat-orchestrator/index.ts` (updated)

Replaced all ad-hoc `sseWrite(writer, { __hermes: true, ... })` calls with
`bridge.emit(sse, eventType, payload, metadata)` calls. The key events now
emitted through the bridge:

- `session_created` — when a new Hermes session is created
- `run_started` — when the run transitions to running (renamed from
  `run_created` to match the canonical event type vocabulary)
- `progress_update` — for each content chunk delta from the provider
  (NEW — previously chunks only had legacy `type: "chunk"` events)
- `run_completed` — on successful completion
- `run_failed` — on provider error, stream error, or missing API key
- `run_cancelled` — on abort

Legacy events (`type: "conversation"`, `type: "message_start"`,
`type: "chunk"`, `type: "error"`, `type: "done"`) are still emitted via
`bridge.writeLegacy()` for frontend backward compatibility. They are NOT
persisted to Redis — only canonical events are.

#### 3. Updated `ChatAgentPage` frontend

**File:** `components/agents/ChatAgentPage.tsx` (updated)

- Updated event handler to recognize `run_started` (renamed from `run_created`)
- Added handling for `run_cancelled` terminal state
- Updated comments to document the canonical `HermesEventEnvelope` shape
- Content rendering still uses legacy `type: "chunk"` events (avoids
  double-rendering with `progress_update`)

#### 4. Tests

**File:** `lib/hermes/modules/chat-orchestrator/stream-bridge.test.ts` (new)

6 focused tests for the `ChatStreamBridge`:
- Emits canonical envelopes through Redis and SSE
- Assigns incrementing sequence numbers
- Writes legacy events without Redis persistence
- Stores hot state with correct lastEventType
- Degrades gracefully when Redis is unavailable
- close() closes the SSE controller

**File:** `lib/hermes/modules/chat-orchestrator/chat-orchestrator.test.ts` (updated)

Updated existing tests to:
- Check for `run_started` instead of `run_created`
- Verify canonical envelope fields (`eventId`, `sequence`, `domain`,
  `timestamp`)
- Mock the streaming engine alongside the orchestrator

### What This Enables

- **Event replay**: all canonical chat events are stored in the Redis replay
  list (`hermes:replay:{runId}`). A client can reconnect to an in-progress
  run and receive missed events via `getEventsSince()`.
- **Hot-state polling**: the Redis hot state (`hermes:hot:{runId}`) is updated
  on every event, enabling lightweight status polling without draining the
  SSE stream.
- **Sequence ordering**: every event has a monotonically increasing sequence
  number assigned by Redis, enabling deterministic event ordering.
- **Canonical contract compliance**: chat events now conform to the
  `HermesEventEnvelope` schema defined in `lib/hermes/contracts/core.ts`.
- **Progress visibility**: `progress_update` events with chunk deltas are
  now in the canonical stream, enabling future run timeline UI to show
  content generation progress.

### Verification

- **tsc --noEmit**: 3 errors, all pre-existing (duplicate export in
  `lib/hermes/index.ts`, missing `prisma/config`). Zero new errors.
- **ESLint**: clean on all modified files.
- **Tests**: 65/65 pass across 9 test files (including 6 new stream-bridge
  tests and 9 updated chat-orchestrator tests).
7. Eventually move the provider call behind a provider abstraction
   (`lib/hermes/modules/provider-router`) so the orchestrator doesn't call
   Gemini directly.
8. Add session-to-conversation persistence (store `sessionId` on the chat
   conversation row so reopening a conversation also resumes the session).
9. Add run-resume support (currently each turn creates a new run; passing
   `runId` back should reuse the existing run for follow-up turns).

---

## Slice 2: Session-Aware Chat (2026-07-25)

### Objective

Bind chat conversations to real Hermes sessions so `/agents/chat` becomes
session-aware as well as run-aware. Each chat conversation now maps 1:1 to
a Hermes session, enabling pause/resume, cross-surface continuity, and
session-scoped run grouping.

### Changes

#### 1. ChatOrchestrator: Session + Workspace Resolution

**File:** `lib/hermes/modules/chat-orchestrator/index.ts` (updated)

Added a `resolveContext()` method that handles:

- **Workspace**: Reuses the user's existing chat workspace (found by
  `metadata.sourceType === "chat"`), or creates a new one via
  `WorkspaceManager.createWorkspace()`. Replaces the synthetic
  `ws_chat_${userId}` ID from slice 1 with a real persisted workspace.

- **Session**: If `sessionId` is provided in the request, the existing
  session is resumed (verified for ownership). Otherwise a new session is
  created via `HermesOrchestrator.createSession()`, titled from the
  conversation title, with `conversationId` stored in session metadata.

- **Conversation**: Same as before — creates or loads a conversation via
  `lib/chat/server`.

The `ChatTurnRequest` interface now includes `sessionId?: string`.
The `ChatTurnResult` interface now includes `sessionId` and `workspaceId`.

The created run is now bound to the session: `hermes.createRun()` is called
with `sessionId: session.id`, so runs are grouped under sessions in the
Hermes database.

On successful completion, `hermes.resumeSession(session.id)` is called to
update the session's `lastActiveAt` timestamp.

#### 2. SSE Stream: Session Events

The SSE stream now emits a `session_created` event at the start of each
chat turn:

```json
{
  "__hermes": true,
  "eventType": "session_created",
  "sessionId": "session_...",
  "workspaceId": "ws_...",
  "status": "active",
  "conversationId": "conv_...",
  "timestamp": "..."
}
```

The `run_created`, `run_completed`, and `run_failed` events now also
include `sessionId` so the frontend can correlate runs to sessions.

#### 3. Route Handler: sessionId Pass-Through

**File:** `app/api/chat/route.ts` (updated)

The route handler now extracts `sessionId` from the request body and passes
it to `executeChatTurn()`. One-line addition to the destructuring and the
orchestrator call.

#### 4. ChatAgentPage: Session State

**File:** `components/agents/ChatAgentPage.tsx` (updated)

- Added `sessionId` state alongside the existing `runId` and `workspaceId`.
- The SSE event handler now captures `session_created` events and stores
  the `sessionId`.
- The `sessionId` is passed back to `/api/chat` on subsequent turns,
  enabling session resume.
- When the user switches conversations, `sessionId` and `runId` are reset
  (each conversation maps to its own session).

#### 5. Tests: 9 Focused Tests

**File:** `lib/hermes/modules/chat-orchestrator/chat-orchestrator.test.ts` (new)

Tests covering:
- Creates a new Hermes session on the first chat turn
- Resumes an existing session when `sessionId` is provided
- Emits `session_created` and `run_created` events in the SSE stream
- Reuses an existing chat workspace instead of creating a new one
- Throws `ChatOrchestratorError` (404) when provided `sessionId` not found
- Throws `ChatOrchestratorError` (403) when `sessionId` belongs to another user
- Throws `ChatOrchestratorError` (400) when messages array is empty
- Binds `sessionId` to the created run
- Touches session `lastActiveAt` on successful completion

### Data Flow After Slice 2

```
ChatAgentPage → POST /api/chat { sessionId?, conversationId?, runId? }
  → route handler (thin gateway):
      → auth, rate limit, validate
      → getChatOrchestrator().executeChatTurn()
          → resolveContext():
              → resolve conversation (create or load)
              → resolve workspace (find existing chat workspace or create)
              → resolve session (resume provided or create new)
          → persist user + assistant messages
          → HermesOrchestrator.createRun({ sessionId, workspaceId, domain: "chat" })
          → stream SSE: session_created → run_created → chunks → run_completed
          → on completion: completeRun() + resumeSession() (touch lastActiveAt)
      → relay stream verbatim
  → SSE stream back to page
      → ChatAgentPage captures sessionId, runId, workspaceId from __hermes events
      → passes sessionId + runId on next turn
```

### Verification

- **TypeScript (tsc --noEmit):** 3 pre-existing errors only, zero new.
- **ESLint:** Clean on all 5 changed/new files.
- **Tests:** 69/69 passed across 10 test files (9 new + 61 existing).

---

## Slice 4: Chat-Driven Document Intelligence (Phase 1) (2026-07-25)

### Objective

Implement the first vertical slice of chat-driven document
intelligence: chat attachment or upload intent → Hermes document
ingestion run → durable document artifact → artifact handoff.

This slice establishes the architecture foothold described in
`docs/CHAT_DRIVEN_DOCUMENT_INTELLIGENCE_BLUEPRINT.md` Phase 1 without
attempting OCR, semantic reconstruction, or a full editor.

### Changes

#### 1. Document Intelligence Contracts (new)

**File:** `lib/hermes/contracts/documents.ts` (new)

Zod contracts for the document-oriented entities:

- `DocumentSource` — the uploaded/attached source descriptor
  (kind, fileName, mimeType, sizeBytes, sourceUrl, extractedText,
  pageCount, isScanned, ingestionStatus)
- `DocumentSourceKind` — `pdf | scan | url | upload`
- `DocumentAST` — the structured semantic object that becomes the
  source of truth for the document (metadata, pages, blocks,
  references, styleTokens)
- `DocumentBlock` / `DocumentBlockType` — heading, paragraph, table,
  figure, caption, citation, list, form_field
- `DocumentPage`, `DocumentReference`, `DocumentStyleToken`
- `DocumentIntent` — ingest, summarize, simplify, notes, slides,
  study_guide, redesign, extract_citations, ask
- `DocumentChatRequest` — the chat → ingestion request shape

Phase 1 keeps `DocumentBlock.content` as `unknown` so later phases can
specialize it per block type without breaking the contract.

#### 2. Core Contract Extensions

**File:** `lib/hermes/contracts/core.ts` (updated)

- Added `documents` and `notes` to `ArtifactDomainSchema`
- Added new event types to `HermesEventTypeSchema`:
  `document_ingestion_started`, `document_ingestion_progress`,
  `document_ingestion_completed`, `document_structure_detected`,
  `document_semantics_ready`, `artifact_ready`, `export_started`,
  `export_completed`

#### 3. Document Ingestion Orchestrator (new module)

**File:** `lib/hermes/modules/document-ingestion-orchestrator/index.ts` (new)

Backend-owned ingestion pipeline. Responsibilities:

- Accept a document source descriptor from the chat orchestrator
- Run heuristic scanned-vs-digital detection (text density)
- Build a minimal placeholder `DocumentAST` (single page + single
  paragraph block carrying extracted text)
- Create a durable Hermes artifact (domain: `documents`) carrying
  the AST and source metadata
- Mark the artifact `ready`
- Emit `document_ingestion_started`, `document_ingestion_progress`,
  `document_ingestion_completed`, and `artifact_ready` events through
  the `ChatStreamBridge` (Redis replay + hot state + client SSE)

The orchestrator does NOT call OCR or pdf.js directly — it consumes
text already extracted by the existing `/api/extract-pdf-v2` path.
Phase 2 will replace the placeholder AST with real structure
reconstruction.

#### 4. Chat Orchestrator Document Routing

**File:** `lib/hermes/modules/chat-orchestrator/index.ts` (updated)

- Added `documentIntent` and `sourceUrl` to `ChatTurnRequest`
- Added `isDocumentAttachment()` helper — detects PDF and office
  document attachments by MIME type and file name
- Added `extractAttachmentText()` helper — tolerates a per-attachment
  `text` field for forward compatibility
- After `run_started` is emitted, if the turn is a document turn
  (explicit `documentIntent`, `sourceUrl`, or a document attachment),
  the orchestrator calls `DocumentIngestionOrchestrator.ingest()`
  before streaming the model response
- Ingestion failures are logged and swallowed so the chat turn still
  produces a model response (graceful degradation)
- The `artifactId` is NOT returned synchronously in `ChatTurnResult`
  because ingestion runs inside the SSE stream's `start()` closure.
  The frontend captures it from the `artifact_ready` canonical event.

#### 5. Route Handler Pass-Through

**File:** `app/api/chat/route.ts` (updated)

The thin gateway now extracts `documentIntent` and `sourceUrl` from
the request body and forwards them to `executeChatTurn()`. One-line
additions to destructuring and the orchestrator call.

#### 6. Frontend Wiring

**File:** `components/agents/ChatAgentPage.tsx` (updated)

- Added `artifactId` state alongside `runId`/`sessionId`/`workspaceId`
- The SSE event handler now recognizes `document_ingestion_started`,
  `document_ingestion_progress`, `document_ingestion_completed`, and
  `artifact_ready` canonical events
- `artifact_ready` captures the `artifactId` and links it to the
  active assistant message metadata
- An artifact chip is rendered in the status bar when `artifactId`
  is set
- `documentIntent: "ingest"` is passed back on subsequent turns when
  the turn carries a document attachment or an existing artifactId
- `artifactId` is reset on conversation switch
- Added `isDocumentLike()` client-side helper mirroring the backend
  detection so the frontend can set a documentIntent without a
  server round-trip

#### 7. Tests

**File:** `lib/hermes/contracts/documents.test.ts` (new) — 19 tests
covering `DocumentSource`, `DocumentAST`, `DocumentBlock`,
`DocumentIntent`, and `DocumentChatRequest` validation.

**File:** `lib/hermes/contracts/core.test.ts` (updated) — added
tests for the new document event types and the `documents` domain.

**File:** `lib/hermes/modules/document-ingestion-orchestrator/document-ingestion-orchestrator.test.ts` (new) — 6 tests covering:
- Creates durable artifact and emits ingestion + artifact_ready events
- Detects scanned sources (low text density)
- Detects digital sources (substantial text)
- Emits failed event and rethrows when artifact creation fails
- Builds placeholder AST with single paragraph block
- Uses sourceUrl as artifact title when no fileName

**File:** `lib/hermes/modules/chat-orchestrator/chat-orchestrator.test.ts` (updated) — 4 new tests covering:
- Routes PDF attachment to ingestion (drains stream first)
- Routes explicit documentIntent + sourceUrl to ingestion
- Does NOT route to ingestion without document signals
- Continues to model response even if ingestion throws

### Data Flow After Slice 4

```
ChatAgentPage → POST /api/chat { documentIntent?, sourceUrl?, attachments[] }
  → route handler (thin gateway):
      → auth, rate limit, validate
      → getChatOrchestrator().executeChatTurn()
          → resolveContext(): workspace + session + conversation
          → createRun({ domain: "chat", sessionId })
          → SSE stream start():
              → bridge.emit(session_created)
              → hermes.startRun()
              → bridge.emit(run_started)
              → if isDocumentTurn:
                  → DocumentIngestionOrchestrator.ingest():
                      → bridge.emit(document_ingestion_started)
                      → buildPlaceholderAST()
                      → bridge.emit(document_ingestion_progress)
                      → artifactManager.createArtifact({ domain: "documents" })
                      → artifactManager.markReady()
                      → bridge.emit(document_ingestion_completed)
                      → bridge.emit(artifact_ready)
              → call provider, stream chunks
              → bridge.emit(run_completed)
          → relay stream verbatim
  → SSE stream back to page
      → ChatAgentPage captures artifactId from artifact_ready event
      → renders artifact chip in status bar
      → passes documentIntent on follow-up turns
```

### What This Enables

- **Durable document artifacts**: uploaded documents are no longer
  dead files — they become Hermes artifacts with a `DocumentAST`
  payload, queryable and operable by future phases.
- **Backend-owned ingestion**: the ingestion pipeline lives in
  `lib/hermes/modules/`, not in the route handler or frontend.
- **Visible ingestion state**: `document_ingestion_started`,
  `progress`, `completed`, and `artifact_ready` events flow through
  the canonical Redis-backed event stream, enabling replay and
  hot-state polling.
- **Artifact handoff**: the `artifact_ready` event carries a
  `handoffSurface: "document-editor"` field, ready for the Phase 4
  editor surface to consume.
- **Forward-compatible contracts**: the `DocumentAST` and
  `DocumentBlock` schemas are intentionally permissive (`unknown`
  content) so Phase 2 (structure reconstruction) and Phase 3
  (semantic reconstruction) can specialize without breaking Phase 1.

### Verification

- **TypeScript (tsc --noEmit):** 3 pre-existing errors only
  (duplicate export in `lib/hermes/index.ts`, missing `prisma/config`).
  Zero new errors.
- **ESLint:** Clean on all modified/new `.ts` files.
- **Tests:** 82/82 pass across 5 focused test files (19 new document
  contract tests, 6 ingestion orchestrator tests, 4 chat-orchestrator
  document routing tests, plus 53 pre-existing tests in the same
  files).

### Remaining Work (Phase 2+)

1. Replace placeholder AST with real block segmentation, reading
   order, heading hierarchy, figure/table detection
   (`document-structure-engine`)
2. Add semantic reconstruction: section classification, citation
   extraction, document type inference (`semantic-reconstruction-engine`)
3. Wire the artifact handoff to a real document editor/canvas surface
4. Add OCR routing for scanned sources (currently detected but not
   routed)
5. Add blob storage for original uploads and page images
6. Add the document-transformation-engine (summarize, simplify,
   notes, slides)
7. Add the document-exporter (PDF re-render, structured export)

