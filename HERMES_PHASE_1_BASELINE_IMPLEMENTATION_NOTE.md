# Hermes Phase 1 Baseline Implementation Note

## Task 1 Completion: Lock the Phase 1 baseline and execution boundaries

**Date:** 2026-07-25
**Status:** Completed

## Current Architecture Audit Summary

### Existing Hermes Infrastructure

**Already Implemented:**
- Hermes modular monolith architecture in `lib/hermes/`
- Core domain contracts in `lib/hermes/contracts/core.ts`
- Database layer in `lib/hermes/infra/db.ts`
- Orchestrator in `lib/hermes/index.ts`
- Modules: artifact-manager, workspace-manager, streaming-engine, slides-orchestrator
- Complete PostgreSQL migrations with RLS policies
- Event envelope and streaming contracts

**Database Tables (PostgreSQL):**
- `hermes_workspaces` - User workspaces for organizing runs and artifacts
- `hermes_runs` - Individual execution runs within workspaces  
- `hermes_artifacts` - Persistent artifacts created by runs
- `hermes_events` - Event log for runs, streaming and replay
- `hermes_tool_calls` - Tool invocation audit log

**Current Contracts:**
- Session/Run/Artifact lifecycle with proper status transitions
- Event envelope shape compatible with ADR-001
- Workspace-scoped authorization via RLS
- ISO timestamp formatting throughout

### Existing Chat Infrastructure

**Already Implemented:**
- Native InsForge-authenticated chat in `lib/chat/`
- Persisted conversations and messages
- SSE-based assistant streaming
- Multiple chat surfaces: flagship, writing-studio, sheet, research, book-agent
- Postgres tables: `chat_conversations`, `chat_messages`
- Full RLS security policies

**Current Gaps:**
- Chat operates independently from Hermes runs/workspaces
- No session creation/resume patterns
- SSE streaming separate from canonical event model
- No workspace-level collaboration features

### Frontend Shell Structure

**Confirmed Structure:**
- Next.js 16 App Router with primary-layout and secondary-layout
- Multiple product surfaces: agents/chat, writing-studio, sheets, research, etc.
- API gateway in `app/api/` following thin gateway pattern per ADR-003
- InsForge authentication and authorization

**Current State:**
- Frontend does not yet consume Hermes sessions/runs directly
- Chat surfaces use separate conversation model
- No unified runtime state UI
- Orchestration logic lives in individual route handlers

## Phase 1 Extension Points Mapping

### 1. Session Management Extension Points

**Primary Extension Point:** New session service in Hermes modular monolith
- **Location:** `lib/hermes/modules/session-service/index.ts` (to be created)
- **Interface:** Create, resume, list sessions with workspace context
- **Integration:** Extends existing workspace-manager module
- **Database:** Uses existing `hermes_workspaces` table, potentially add `hermes_sessions`

**Gateway Integration:**
- **Location:** `app/api/hermes/sessions/` (new route structure)
- **Pattern:** Thin gateway following ADR-003 rules
- **Auth:** InsForge auth validation, workspace access checks

### 2. Run Management Extension Points

**Primary Extension Point:** Enhanced run service building on existing orchestrator
- **Location:** `lib/hermes/modules/run-service/index.ts` (refactor from current orchestrator)
- **Interface:** Create run, get status, list recent runs per session
- **Integration:** Uses existing `HermesOrchestrator` infrastructure
- **Database:** Existing `hermes_runs` table with potential session relationship

**Gateway Integration:**
- **Location:** `app/api/hermes/runs/` (new route structure)
- **Pattern:** Delegate to run service, proxy canonical responses
- **Streams:** Bridge existing streaming-engine to SSE endpoints

### 3. Event Flow Extension Points

**Primary Extension Point:** Realtime bridge building on streaming-engine
- **Location:** `lib/hermes/modules/realtime-bridge/index.ts` (new)
- **Interface:** SSE endpoint serving canonical event envelopes
- **Integration:** Consumes from existing streaming-engine module
- **Transport:** Start with SSE, WebSocket-ready contracts per ADR-005

**Gateway Integration:**
- **Location:** `app/api/hermes/events/[runId]/stream` (new SSE endpoint)
- **Pattern:** Proxy streaming-engine events with minimal transformation
- **Contracts:** Use existing `HermesEventEnvelope` shape

### 4. Frontend Client Extension Points

**Primary Extension Point:** Hermes adapter layer in frontend
- **Location:** `hooks/useHermesClient.ts` or `lib/hermes-client/` (new)
- **Interface:** Session bootstrap, run creation, event subscription
- **Integration:** Consume new API gateway routes
- **State:** Hook-based state management for runtime information

**UI Integration Points:**
- **Chat surfaces:** `app/(primary-layout)/agents/chat/page.tsx`
- **Writing studio:** `app/(primary-layout)/writing-studio/` 
- **Other surfaces:** Minimal insertion points for runtime state display

### 5. Redis Ephemeral State Extension Points

**Primary Extension Point:** Redis coordination layer
- **Location:** `lib/hermes/infra/redis.ts` (new)
- **Interface:** Idempotency keys, hot-state caching, pub/sub coordination
- **Integration:** Support run service and realtime bridge
- **Scope:** Ephemeral only, Postgres remains source of truth

## Phase 1 Guardrails

### Implementation Boundaries (MUST RESPECT)

1. **Backend-First Evolution**
   - All orchestration logic stays in Hermes modules
   - API routes remain thin gateways only
   - No new business logic in `app/api/` handlers

2. **Frontend Shell Preservation**
   - Current Next.js app structure stays intact
   - Only targeted UI insertions for runtime state
   - No broad redesign or component rewrites

3. **Modular Monolith Boundaries**
   - Hermes stays as unified backend module
   - No premature microservice splitting
   - Service boundaries internal to `lib/hermes/`

4. **Contract Compatibility**
   - Build on existing ADR-001 event contracts
   - Maintain existing database schema where possible
   - ISO timestamp and status lifecycle consistency

5. **Auth and Security Preservation**
   - Continue using InsForge auth patterns
   - Maintain RLS policies and workspace scoping
   - Server-side secret handling only

### Phase 1 Scope Limits (WILL NOT IMPLEMENT)

1. **Session Types:** Only basic create/resume, no advanced session management
2. **Realtime:** SSE first, WebSocket infrastructure deferred
3. **UI Scope:** Minimal status display only, no rich collaboration features
4. **Redis Scope:** Idempotency and hot-state only, no complex queuing
5. **Model Registry:** Basic capability metadata only, no advanced routing

## Phase 2 Deferrals (EXPLICITLY OUT OF SCOPE)

### Deferred Infrastructure
- **WebSocket realtime:** ADR-005 calls for WebSocket but SSE acceptable for Phase 1
- **Kafka event backbone:** Postgres + streaming-engine sufficient for now
- **Elasticsearch search:** Postgres adequate for initial artifact retrieval
- **Graph memory:** Structured workspace memory deferred

### Deferred Collaboration Features  
- **Multi-user workspaces:** Single-user workspace model for Phase 1
- **Presence indicators:** No typing/online status in Phase 1
- **Read cursors:** No message read state tracking initially
- **Workspace channels:** Direct artifact-linked conversations only

### Deferred Scale Infrastructure
- **Microservice extraction:** Keep modular monolith boundary
- **Service mesh:** No Istio/complex networking
- **Advanced caching:** Simple Redis patterns only
- **Multi-region:** Single region deployment target

### Deferred Frontend Complexity
- **Rich text collaboration:** Basic artifact display only
- **Advanced workspace navigation:** Minimal runtime state UI
- **Mobile optimization:** Web-first Phase 1 scope
- **Browser inference:** Cloud-first model routing

## Implementation Sequence For Phase 1

1. **Task 2:** Normalize session, run, and event contracts
2. **Task 3:** Build persistence foundations (extend existing DB layer)
3. **Task 4:** Implement session service (new Hermes module)
4. **Task 5:** Implement run service (enhance existing orchestrator)
5. **Task 6:** Add Redis ephemeral coordination
6. **Task 7:** Expose runtime gateway API surface
7. **Task 8:** Ship realtime bridge (SSE-first)
8. **Task 9:** Build frontend thin client layer
9. **Task 10:** Expose minimal runtime UI
10. **Task 11:** Surface capability metadata
11. **Task 12:** Validation, documentation, and handoff

## Risk Mitigation Strategies

### Technical Risks
- **Contract fragmentation:** Enforce single event envelope across all surfaces
- **Gateway creep:** Strict ADR-003 compliance in route handlers
- **Redis sprawl:** Defined key ownership and TTL policies upfront

### Integration Risks  
- **Chat separation:** Plan gradual migration of chat to Hermes session model
- **Frontend coupling:** Keep UI changes minimal and reversible
- **Database performance:** Index strategy ready for session/run queries

### Operational Risks
- **Testing complexity:** Focus on contract and service boundary tests
- **Migration path:** Current features continue working during Phase 1
- **Documentation gaps:** Maintain clear boundary between Phase 1 and 2

## Success Criteria For Phase 1

**Gateway APIs Functional:**
- Session create/resume endpoints working
- Run create/status endpoints working  
- Event streaming SSE endpoint working
- Proper auth and validation throughout

**Frontend Integration:**
- Thin client layer consuming gateway APIs
- Basic runtime state visible in UI
- Session bootstrap working in at least one surface

**Backend Architecture:**
- Clean service boundaries in Hermes modules
- Redis coordination working for idempotency  
- Event envelope consistency across surfaces
- Database queries performing adequately

**Quality Gates:**
- All Phase 1 tests passing
- Lint and type-check clean
- Documentation explains what shipped vs deferred
- Known risks and migration paths documented

---

**Implementation Authority:** This note represents the authoritative baseline for Hermes Phase 1 implementation. Any scope changes require explicit documentation updates and task priority reevaluation.