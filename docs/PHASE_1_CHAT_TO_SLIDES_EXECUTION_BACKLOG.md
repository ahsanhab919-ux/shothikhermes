# Phase 1 Execution Design: Chat-To-Slides Launch Backlog

## Purpose

This document defines the sprint-ready launch backlog for the Phase 1 `chat -> slides` workflow.

It translates the Phase 0 ADRs into executable work while staying aligned to the current slide generation implementation in:

- `app/api/chat/route.ts`
- `services/createPresentationServer.js`
- `services/slide-generation.ts`
- `services/presentation/PresentationApiSlice.js`
- `services/presentation/PresentationSSEService.js`
- `services/presentation/PresentationOrchestrator.js`
- `app/(primary-layout)/slide-generation/page.tsx`
- `components/presentation/*`
- `components/agents/*`

## Launch Objective

Establish a stable, Hermes-compatible architecture for the existing chat-to-slides flow without breaking the current production slide experience.

Phase 1 is successful when:

- chat can start a slide run through a typed command contract
- slide progress can be rendered through standardized run events
- the legacy slide generation flow is isolated behind adapters
- the frontend chat and slide teams can integrate against stable contracts

## Current-State Alignment

The current implementation already provides the core shape of the launch slice:

- chat persistence and SSE streaming in `app/api/chat/route.ts`
- slide creation through `services/createPresentationServer.js`
- direct slide job lifecycle operations in `services/slide-generation.ts`
- legacy presentation status and history reads in `services/presentation/PresentationApiSlice.js`
- slide SSE parsing and replay logic in `services/presentation/PresentationSSEService.js` and `services/presentation/PresentationOrchestrator.js`

The main problem is not missing functionality. The main problem is fragmented contracts:

- chat uses one event vocabulary
- slide generation uses a separate job and SSE vocabulary
- presentation history/status follow yet another shape
- the frontend still knows too much about transport and orchestration details

## Delivery Principles

- validate end-to-end flow first
- preserve current slide generation behavior during transition
- implement typed gateway contracts before deeper feature expansion
- isolate legacy slide APIs behind adapters instead of spreading compatibility logic
- require backend architecture and frontend chat sign-off on every launch item

## Backlog Structure

This backlog is organized into three execution waves:

1. Wave A: contract foundation and end-to-end viability
2. Wave B: event standardization and adapter isolation
3. Wave C: launch hardening and readiness sign-off

## Wave A: Core End-To-End Validation

## P1-001: Define Command Contracts For Chat-To-Slides Actions

### Priority

P0

### Sprint

Sprint 1

### Goal

Create fully typed write-path contracts for all launch-scope user actions in the chat-to-slides flow.

### Scope

- `GenerateSlidesCommand`
- `ResumeSlideGenerationCommand`
- `PauseSlideGenerationCommand`
- `UpdateSlideContentCommand`
- `ExportSlideDeckCommand`

### Deliverables

- TypeScript command definitions under a shared Hermes/gateway contracts area
- Zod schemas for request validation
- OpenAPI 3.0 documentation entries using `defineRoute` from `lib/api-validation.ts`
- explicit authorization scope matrix
- explicit timeout policy for each command

### Required Contract Fields

- `requestId`
- `workspaceId`
- `runId` where applicable
- `artifactId` where applicable
- `conversationId`
- `userId`
- `surface`
- `prompt`
- `templateId`
- `slideCount`
- `sourceAttachments`
- `contextRef`
- `idempotencyKey` for mutation endpoints

### Authorization Scopes

- `slides.generate`
- `slides.resume`
- `slides.pause`
- `slides.edit`
- `slides.export`

### Timeout Policy

- gateway request timeout for command acceptance
- async execution timeout owned by workflow engine
- export timeout defined separately from generation timeout

### Dependencies

- ADR-001
- ADR-003

### Testing Requirements

- unit tests for all Zod command schemas
- contract tests for malformed payload rejection
- authorization tests for missing/invalid scopes
- idempotency tests for duplicate `GenerateSlidesCommand`

### Acceptance Criteria

- all launch-scope write actions have typed contracts and schema validation
- all mutation routes are documented in OpenAPI 3.0
- no launch-scope write action depends on ad hoc request bodies
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-002: Define Query Contracts For Slide Status, History, And Templates

### Priority

P0

### Sprint

Sprint 1

### Goal

Standardize all read paths required by the chat-to-slides user journey.

### Scope

- `GetSlideGenerationStatusQuery`
- `GetSlideRunTimelineQuery`
- `GetUserSlideHistoryQuery`
- `GetSlideArtifactQuery`
- `GetTemplateLibraryQuery`

### Deliverables

- TypeScript query definitions
- Zod query/response schemas
- OpenAPI 3.0 docs for query endpoints
- caching rules by query type
- pagination rules for history endpoints

### Required Response Requirements

- canonical identifiers: `runId`, `artifactId`, `workspaceId`
- current lifecycle status
- latest event cursor or sequence number
- template metadata where applicable
- pagination metadata for list endpoints

### Caching Rules

- `GetSlideGenerationStatusQuery`: no-cache or very short TTL
- `GetSlideRunTimelineQuery`: replay-safe, cursor-aware
- `GetUserSlideHistoryQuery`: cacheable with user-scoped invalidation
- `GetTemplateLibraryQuery`: cacheable with moderate TTL

### Dependencies

- P1-001

### Testing Requirements

- unit tests for response schemas
- pagination tests
- cache header tests
- integration tests against current status/history adapter behavior

### Acceptance Criteria

- all launch-scope read operations have typed contracts
- caching and pagination rules are explicitly documented
- status and history queries can represent current legacy slide state without lossy mapping
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-003: Create OpenAPI And JSON Schema Baseline For Launch Slice

### Priority

P0

### Sprint

Sprint 1

### Goal

Formalize contract publication using the existing repo API standard.

### Scope

- use `defineRoute` from `lib/api-validation.ts`
- use `zod` plus `@asteasolutions/zod-to-openapi`
- publish launch-slice swagger entries under existing `/api/docs/swagger.json`

### Deliverables

- launch-slice contract catalog
- JSON Schemas generated from Zod-backed route definitions
- OpenAPI 3.0 route documentation for commands and queries
- error model documentation for validation, auth, rate-limit, and domain failures

### Dependencies

- P1-001
- P1-002

### Testing Requirements

- schema generation tests
- OpenAPI snapshot validation
- route wrapper integration tests using `defineRoute`

### Acceptance Criteria

- every launch-scope command and query is represented in the API docs
- the documentation follows the current codebase standard, not a parallel scheme
- validation errors and domain errors are distinguishable in the spec
- backend architecture sign-off received
- frontend chat team sign-off received

## Wave B: Event Standardization And Adapter Isolation

## P1-004: Map Chat-To-Slides Domain Events To Canonical Run Events

### Priority

P0

### Sprint

Sprint 1

### Goal

Create a deterministic event mapping from current slide lifecycle behavior into the canonical run/event model.

### Scope

- `SlideGenerationInitiated`
- `SlideGenerationCompleted`
- `SlideGenerationFailed`
- `SlideContentUpdated`
- `SlideDeckExported`
- mapping from legacy statuses such as `queued`, `processing`, `completed`, `failed`
- mapping from current generation steps such as `outline`, `design`, `content`, `formatting`, `review`

### Deliverables

- event mapping matrix
- canonical event name map to `run_created`, `progress`, `artifact_create`, `artifact_patch`, `version_create`, `done`, `error`
- traceability rules between chat event stream and slide event stream
- replay and resume policy

### Mandatory Event Fields

- `eventId`
- `runId`
- `workspaceId`
- `artifactId`
- `artifactType`
- `correlationId`
- `causationId`
- `userId`
- `timestamp`
- `sequence`
- `source`
- `status`
- `label`
- `message`
- `legacyPresentationId` during migration
- error context for failure events

### Dependencies

- P1-001
- P1-002

### Testing Requirements

- unit tests for event translators
- compatibility tests using sample legacy SSE payloads
- replay tests for ordered event reconstruction

### Acceptance Criteria

- every launch-scope slide lifecycle event maps into the canonical run-event model
- failure events preserve enough error context for support and debugging
- event mapping covers both live streaming and replay/history paths
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-005: Standardize Event Payload Schemas For Streaming Platform Compatibility

### Priority

P0

### Sprint

Sprint 2

### Goal

Ensure launch-slice events are safe for the existing streaming platform and future Hermes streaming engine.

### Scope

- event serialization format
- payload size rules
- field naming conventions
- replay cursor rules
- compatibility with current SSE transport

### Deliverables

- event payload schema package
- payload size budget and truncation rules
- serialization guidance for JSON over SSE
- audit-field standard
- error payload standard for failure and retryable events

### Platform Compatibility Rules

- JSON-serializable payload only
- bounded payload size with large content moved to artifact or blob reference
- no raw HTML blobs in high-frequency progress events
- stable event ordering via monotonic `sequence`
- resumable streams via `Last-Event-Id` or equivalent cursor semantics

### Dependencies

- P1-004

### Testing Requirements

- payload-size validation tests
- serialization tests
- SSE compatibility integration tests
- reconnect/resume tests using current `PresentationSSEService` behavior

### Acceptance Criteria

- all launch-scope events conform to a documented envelope and size budget
- the schema supports current SSE transport without custom per-screen parsing rules
- reconnect and replay behavior are documented and test-covered
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-006: Define Adapter Boundaries For Chat Input, Slide Rendering, And Asset Storage

### Priority

P0

### Sprint

Sprint 2

### Goal

Isolate the new launch contracts from the legacy slide-generation implementation.

### Scope

- chat input adapter
- slide generation/rendering adapter
- slide status/history adapter
- slide asset storage adapter
- export adapter

### Deliverables

- adapter boundary document
- interface definitions for each adapter
- input/output contract for each adapter
- ownership map showing gateway vs Hermes vs legacy service responsibilities

### Adapter Definitions

#### Chat Input Adapter

Bridges current chat prompt and context into `GenerateSlidesCommand`.

Inputs:

- conversation message
- `surface`
- `contextRef`
- user identity

Outputs:

- typed launch command
- run bootstrap metadata

#### Slide Generation Adapter

Wraps current legacy calls such as `create-presentation`, `presentation-status`, stream, and logs/history.

Inputs:

- typed generation command
- legacy compatibility fields such as `p_id` where necessary

Outputs:

- normalized run status
- normalized events
- legacy-to-canonical identifier mapping

#### Storage Adapter

Owns slide deck payload persistence, asset references, export files, and version snapshots.

Inputs:

- artifact patch payloads
- generated asset references

Outputs:

- artifact snapshot refs
- export refs
- retrieval handles for workspace reopen

### Dependencies

- P1-001
- P1-004

### Testing Requirements

- interface contract tests for each adapter
- integration tests between gateway and legacy slide adapter
- regression tests proving the current slide flow still works through adapters

### Acceptance Criteria

- no new frontend code calls legacy slide APIs directly for launch-scope orchestration without passing through a defined adapter
- each adapter has explicit input/output contracts
- ownership boundaries are documented and reviewed
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-007: Define Cross-Adapter Error, Retry, And Dead-Letter Rules

### Priority

P1

### Sprint

Sprint 2

### Goal

Prevent cross-adapter failure handling from becoming implicit or screen-specific.

### Scope

- retry rules for transient failures
- non-retryable error classification
- dead-letter handling for failed async adapter calls
- user-visible fallback rules

### Deliverables

- error taxonomy for launch slice
- retry matrix by adapter interaction
- dead-letter queue policy for async failures
- user-facing fallback UX rules for chat and slide workspace

### Required Error Boundaries

- chat-to-command validation errors
- gateway authorization/rate limit errors
- legacy slide generation initiation failures
- streaming disconnect and replay failures
- export failures
- storage write failures

### Dependencies

- P1-006

### Testing Requirements

- retry policy unit tests
- adapter failure simulation tests
- dead-letter routing tests
- end-to-end error-state tests covering generation failure and resume behavior

### Acceptance Criteria

- each cross-adapter interaction has a documented retry or fail-fast rule
- dead-letter conditions are explicit for async launch operations
- user-visible errors are actionable and preserve artifact/run context
- backend architecture sign-off received
- frontend chat team sign-off received

## Wave C: Launch Hardening And Readiness

## P1-008: Build End-To-End Launch Validation Suite Against Current Slide Flow

### Priority

P0

### Sprint

Sprint 3

### Goal

Validate that the new contracts and adapters preserve the existing slide generation experience.

### Scope

- command acceptance
- event stream rendering
- status replay
- slide workspace handoff
- export initiation

### Deliverables

- end-to-end test matrix
- integration environment test fixtures
- golden-path regression suite against current production slide flow
- parity checklist between legacy and launch-slice behavior

### Mandatory Testing Coverage

- unit tests for all contract validations
- integration tests for cross-adapter communication
- end-to-end tests for full `chat -> slides -> workspace -> export` flow

### Dependencies

- P1-001 through P1-007

### Acceptance Criteria

- golden path passes from chat prompt to slide workspace handoff
- event timeline remains readable and ordered through completion
- export can be triggered from the launch flow
- no critical regression is found in the current production slide path
- backend architecture sign-off received
- frontend chat team sign-off received

## P1-009: Launch Readiness Review And Sign-Off Gate

### Priority

P0

### Sprint

Sprint 3

### Goal

Turn the launch backlog into a release-ready decision checkpoint.

### Scope

- architecture review
- frontend chat review
- slide experience parity review
- operational readiness review

### Deliverables

- launch checklist
- architecture sign-off record
- frontend chat sign-off record
- known gaps register
- post-launch monitoring checklist

### Readiness Checklist

- command contracts approved
- query contracts approved
- event schemas approved
- adapter boundaries approved
- error handling approved
- tests passing at unit, integration, and end-to-end levels
- observability fields present in logs/events
- launch rollback criteria documented

### Dependencies

- P1-008

### Testing Requirements

- evidence review from all prior test layers
- sign-off review of contract and UX parity artifacts

### Acceptance Criteria

- backend architecture lead signs off
- frontend chat lead signs off
- current slide experience constraints are acknowledged and covered
- launch blockers are either closed or explicitly waived

## Prioritized Execution Plan

## Sprint 1: Contract And Event Foundation

Highest priority items:

1. P1-001
2. P1-002
3. P1-003
4. P1-004

Sprint 1 exit condition:

- launch-scope commands, queries, and event mappings are typed, documented, and reviewable

## Sprint 2: Adapter Isolation And Failure Boundaries

Highest priority items:

1. P1-005
2. P1-006
3. P1-007

Sprint 2 exit condition:

- legacy slide flow is isolated behind defined adapters and failure rules

## Sprint 3: Full Flow Validation And Launch Gate

Highest priority items:

1. P1-008
2. P1-009

Sprint 3 exit condition:

- full chat-to-slides launch slice passes parity and readiness review

## Launch Readiness Definition

The launch slice is ready only when all of the following are true:

- every launch-scope command and query has typed schema validation
- the contracts are documented in OpenAPI 3.0 using repo-standard tooling
- canonical run-event mapping exists for all core slide lifecycle states
- adapter boundaries shield new code from direct legacy coupling
- retry and dead-letter rules are explicit
- unit, integration, and end-to-end tests pass
- backend architecture and frontend chat teams both sign off

## Recommended File Outputs For Execution

This backlog should drive the creation of:

- contract definitions for commands and queries
- event schema package for launch-slice streaming
- adapter interface definitions
- launch-slice OpenAPI entries
- test suites for contracts, adapters, and end-to-end flow

## Bottom Line

Phase 1 should not start by rewriting slides.

It should start by wrapping the existing slide generation flow in:

- typed commands and queries
- canonical event payloads
- explicit adapters
- strong test and sign-off gates

That is the fastest way to make `chat -> slides` stable enough for the Hermes migration path while preserving current behavior.
