# Shothik AI Workspace PRD

## Document Control

- Product: `Shothik AI Workspace`
- Repository: `shothik-web`
- Status: `Draft v1`
- Last Updated: `2026-07-23`
- Owner: Product + Platform + Web
- Related Documents:
  - `README.md`
  - `docs/CODE_WIKI.md`
  - `docs/FUTURE_WORK_ROADMAP.md`
  - `docs/PRD_REPO_ALIGNMENT.md`
  - `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
  - `docs/adr/README.md`
  - `docs/PHASE_1_CHAT_TO_SLIDES_EXECUTION_BACKLOG.md`

## Executive Summary

Shothik AI Workspace is an artifact-centered AI operating system for students, researchers, and knowledge workers. The product should begin from chat or structured intent entry, execute AI work visibly, and end in persistent, editable, versioned outputs such as slide decks, sheets, research artifacts, writer documents, plagiarism reports, and publish-ready assets.

The current `shothik-web` repository already provides the UI shell, navigation, auth, design system, multiple tool surfaces, and some persistence foundations. The main product gap is not lack of features; it is the lack of one stable run contract across chat, slides, sheets, writing, research, and publishing flows.

This PRD defines the transition from feature-specific orchestration inside frontend routes and service adapters to a backend-owned orchestration model with a unified `run` and `artifact` contract. The recommended launch slice is:

`chat -> slides -> persistent workspace -> visible progress -> export`

## Product Summary

Shothik should feel like one AI-native workspace where:

- chat is the super agent entrypoint
- every serious output becomes a real artifact
- users can watch work happen in real time
- users can reopen artifacts later and continue from the same context
- failures are understandable, recoverable, and non-destructive

## Product Surface Inventory

The current Shothik product comprises the following major surfaces and capability domains:

- writing tools
- book writing to publish
- community
- Twin
- slides
- sheets
- deep research
- AI detector
- plagiarism checker
- citation generator
- code execution
- marketplace

These surfaces do not all need the same migration timing, but they must be accounted for in the product architecture. The run/artifact model should prioritize artifact-heavy workflows first, while still preserving adjacent platform surfaces such as community, Twin, and marketplace.

## Problem Statement

The current product has strong UI foundations but weak workflow consistency. In the current repository:

- chat persistence already exists in `app/api/chat/route.ts` and `lib/chat/server.ts`
- slide generation still depends on separate slide-service contracts in `services/slide-generation.ts`
- slide progress and history are coordinated through feature-specific presentation services such as `services/presentation/PresentationOrchestrator.js`
- sheet workflows use separate streaming/event handling in `services/sheetAiStreamService.js`
- multiple artifact-like surfaces exist, but they are not governed by one persistent artifact model

This creates several product and engineering issues:

- AI logic is split across pages, routes, hooks, and services
- streaming contracts differ by feature
- progress visibility is inconsistent
- artifacts are not uniformly versioned or resumable
- chat, workspace, and tool workflows do not share one durable session/run model

## Vision

Make Shothik feel like an AI-native workspace where chat is the super agent, every serious output becomes a real artifact, and users can watch work happen, edit results, return later, and continue from the same workspace.

## Goals

- Preserve the existing Shothik UI, design system, auth, and navigation
- Introduce a unified run and artifact model across major workflows
- Move AI orchestration out of frontend UI code
- Make generation visibly progressive through structured streaming events
- Support persistent, editable, versioned artifacts
- Replace fragile legacy microservice coupling gradually with owned backend contracts

## Non-Goals

- Full frontend rewrite
- Large repo reorganization as the first step
- Immediate replacement of every backend dependency
- Launching a separate Hermes platform before internal contracts are stable

## Target Users

- University students creating essays, slides, notes, and reports
- Researchers generating structured outputs from prompts and sources
- Professionals creating presentations, sheets, and publishable documents

## Core User Stories

1. As a user, I can ask chat to create a slide deck and see planning and generation steps live.
2. As a user, I can open generated artifacts in a dedicated workspace and continue editing them.
3. As a user, I can revisit old runs and resume work without losing state.
4. As a user, I can export or publish genuine outputs, not demo placeholders.
5. As a user, I can understand failures through clear progress and error states.

## Product Scope

- Unified AI run/session layer
- Artifact engine for writing tools, book-writing-to-publish flows, slides, sheets, deep research outputs, AI detector reports, plagiarism reports, citation outputs, code execution outputs, and publish jobs
- Structured streaming event system
- Version history and checkpoints
- Reusable workspace shell across artifact types
- Backend orchestration layer for planning, routing, memory, and workflow execution
- Integration alignment for community, Twin, and marketplace surfaces

## Current State Assessment

### Existing Strengths To Keep

- Next.js App Router shell in `app/`
- broad UI coverage in `components/`
- reusable design system in `components/ui/`
- existing auth/session flows
- existing navigation shell and product surfaces
- persisted chat conversations and messages
- strong feature breadth across writing tools, book writing and publishing, community, Twin, slides, sheets, deep research, AI detector, plagiarism checker, citation generation, code execution, and marketplace

### Current Constraints To Address

- orchestration logic lives in frontend-facing route handlers and service adapters
- slide and sheet workflows rely on separate external service contracts
- event vocabularies differ across chat, sheets, and presentation flows
- persistent outputs are modeled differently across domains
- users can enter many tools, but cross-tool continuation is not first-class

## Product Principles

1. Artifact-first, not response-first
2. Visible execution, not hidden waiting
3. One workspace, not disconnected tools
4. Durable context, not tab-local state
5. Progressive backend ownership, not rewrite-by-ambition
6. Stable contracts before service extraction

## Functional Requirements

1. Every AI action creates or updates a `run` with:
   - `runId`
   - `artifactType`
   - `artifactId`
   - `status`
   - `events`
   - `checkpoints`
   - `versions`
2. Every generated output is stored as a persistent `artifact`.
3. Chat can hand off into artifact workspaces without losing prompt, context, or state.
4. The backend emits structured events such as:
   - `tool_call`
   - `progress`
   - `artifact_create`
   - `artifact_patch`
   - `handoff`
   - `done`
   - `error`
5. Artifacts support post-generation editing and version tracking.
6. Runs survive refresh, reload, and navigation.
7. Failed runs surface actionable errors and preserve artifact context.

## UX Requirements

- Keep the current Shothik visual design and navigation intact
- Show visible, understandable progress during AI work
- Reduce navigation friction between chat and artifact workspaces
- Improve prompt-field clarity for each tool type
- Use consistent loading, empty, success, and error states
- Ensure the experience feels like one workspace, not separate tools

## Success Metrics

- Higher completion rate for chat-to-artifact workflows
- Lower runtime failure rate in slides and chat
- Faster time from prompt to usable artifact
- Increased reuse of saved artifacts and prior runs
- Increased export and publish completion rate
- Better user understanding of AI progress and failure states

## Target Architecture

### Frontend Role

`shothik-web` remains the presentation layer and workspace shell. It owns:

- app shell and navigation
- auth and session entry
- workspace rendering
- editors and viewers
- event rendering and progress UI
- artifact browsing and history UI

### Backend Role

Introduce a backend orchestration layer inside the current deployment boundary first, then extract only when contracts prove stable. Core modules:

- `orchestrator`
- `artifact-manager`
- `workflow-engine`
- `tool-registry`
- `memory-checkpoints`
- `streaming-engine`

### Planned System View

```text
Frontend (Current Shothik UI)
        |
        v
API Gateway / Route Layer
        |
        v
Hermes-Orchestrator-Modules
    - Planner
    - Tool Router
    - Memory
    - Workflow Engine
    - Artifact Manager
    - Streaming Engine
        |
        v
Tools And External Services
    - Slides
    - Sheets
    - Research
    - Citation
    - Plagiarism
    - Search
    - Browser
    - Code Execution
        |
        v
Storage
    - PostgreSQL
    - Blob Storage
    - Redis (optional)
    - Vector DB (optional)
```

## Proposed Canonical Domain Model

### Run

Represents one AI execution lifecycle.

Suggested fields:

- `id`
- `workspace_id`
- `entry_surface` such as `chat`, `slides`, `sheet`, `writing`, `research`
- `artifact_type`
- `artifact_id`
- `intent`
- `status`
- `current_step`
- `started_at`
- `completed_at`
- `failed_at`
- `error_code`
- `error_message`
- `resume_token`
- `initiated_by_user_id`

### Artifact

Represents a persistent output independent from a single run.

Suggested fields:

- `id`
- `type`
- `workspace_id`
- `title`
- `status`
- `owner_user_id`
- `latest_version_id`
- `source_run_id`
- `metadata`
- `created_at`
- `updated_at`

### Artifact Version

- `id`
- `artifact_id`
- `version_number`
- `change_summary`
- `snapshot_uri` or `payload`
- `created_by`
- `created_at`

### Run Event

- `id`
- `run_id`
- `seq`
- `event_type`
- `timestamp`
- `label`
- `message`
- `tool_name`
- `payload`

### Checkpoint

- `id`
- `run_id`
- `artifact_id`
- `checkpoint_type`
- `state_ref`
- `created_at`

## Canonical Event Contract

All AI-capable workflows should converge on one structured event envelope:

```json
{
  "runId": "run_123",
  "seq": 42,
  "timestamp": "2026-07-23T10:00:00.000Z",
  "type": "progress",
  "artifactType": "slides",
  "artifactId": "art_456",
  "status": "running",
  "label": "Generating outline",
  "message": "Prepared 8-slide outline",
  "payload": {}
}
```

Allowed phase-1 event types:

- `run_created`
- `plan`
- `tool_call`
- `tool_result`
- `progress`
- `artifact_create`
- `artifact_patch`
- `checkpoint`
- `handoff`
- `version_create`
- `done`
- `error`

## Storage Direction

- PostgreSQL for runs, artifacts, versions, checkpoints, and event metadata
- Blob storage for exports, attachments, snapshots, generated files, and heavy artifact payloads
- Redis for queues, ephemeral locks, streaming fan-out, and idempotency where needed
- Vector storage only where retrieval materially improves product outcomes

## Implementation Strategy

Evolve the current repo instead of rebuilding it.

### What We Keep

- design system
- auth
- navigation
- landing and marketing surfaces
- responsive layout
- existing workspace shell where already usable
- existing editors/renderers that can consume normalized contracts

### What We Replace Gradually

- AI business logic embedded in frontend routes
- direct model/provider calls from web surfaces
- tool-specific orchestration scattered across services
- fragile feature-specific progress/event contracts

### What We Add

- artifact engine
- unified run service
- event streaming contract
- checkpoint/version infrastructure
- tool registry
- background execution model
- multi-step workflow engine

## Launch Slice Recommendation

Start with the strongest vertical slice:

`chat -> slides -> persistent workspace -> visible progress -> export`

Rationale:

- chat already has durable persistence foundations
- slide generation is already a clear artifact workflow
- slide flows currently expose the contract fragmentation most clearly
- the value is easy for users to understand and easy for teams to measure

Note: this launch slice is the first migration slice, not the full product boundary. The full Shothik product surface also includes writing tools, book-to-publish flows, community, Twin, sheet, deep research, AI detector, plagiarism checker, citation generator, code execution, and marketplace experiences.

## Phased Delivery Plan

## Phase 0: Contract And Baseline Alignment

### Objective

Freeze the core contracts, instrumentation, and migration rules before major code movement.

### Scope

- define canonical `run`, `artifact`, `version`, `checkpoint`, and `event` schemas
- map current slide, sheet, chat, writing, and research flows to the target contract
- define a stable error taxonomy
- define launch-slice KPI instrumentation
- identify current sources of truth and legacy service dependencies

### Milestones

1. Domain model ADR approved
2. Canonical event schema approved
3. Launch slice workflow map documented end to end
4. Backward compatibility strategy documented for slide and sheet flows

### Acceptance Criteria

- every in-scope workflow has a source-to-target mapping document
- all stakeholders agree on the minimal canonical event vocabulary
- run lifecycle states are explicitly defined and non-overlapping
- artifact identity and version semantics are documented
- launch metrics and alerting requirements are approved

### Exit Output

- ADR for run/artifact contract
- migration map for chat, slides, and sheets
- event schema reference
- implementation backlog for Phase 1

## Phase 1: Stabilize Current Chat And Slides Runtime

### Objective

Improve reliability of the existing chat and presentation entry surfaces without breaking the UI shell.

### Scope

- normalize chat event rendering to align with the future run model
- wrap slide runtime status and history into a backend-owned adapter
- standardize terminal states and user-facing error surfaces
- introduce request correlation IDs and run bootstrap IDs
- improve refresh/reload recovery for in-flight runs

### Milestones

1. Chat emits run-aware metadata
2. Slides use a normalization adapter for progress and terminal states
3. Refresh-safe resume is working for chat and slides
4. Error states are consistently rendered in launch-slice UI

### Acceptance Criteria

- a user can refresh during a chat-to-slides generation and still reconnect to the active run
- the UI can render progress from one normalized event envelope for the launch slice
- slide terminal states are reduced to stable values such as `queued`, `running`, `completed`, `failed`, `stopped`
- failed runs preserve enough state for support and retry flows
- logging and tracing allow a single run to be followed across route handlers and services

## Phase 2: Make Slide Generation Backend-Owned

### Objective

Move slide orchestration out of frontend-facing service logic into a backend-owned workflow contract.

### Scope

- create slide run bootstrap endpoint
- move planning, orchestration, and event assembly behind backend contracts
- persist slide artifacts and versions
- preserve existing slide UI while swapping its data source
- support export from the persisted artifact model

### Milestones

1. Slide creation starts from `run.create`
2. Slide progress is emitted by the backend streaming engine
3. Generated slide artifact is stored persistently
4. Slide workspace loads from artifact + version records
5. Export reads from owned artifact state

### Acceptance Criteria

- frontend slide UI no longer depends directly on ad hoc slide-service status semantics
- each slide generation creates a persistent artifact record and at least one version
- each visible progress update is traceable to a run event
- a user can reopen a completed slide deck from history without relying on transient service memory
- export works from the persisted deck state

## Phase 3: Unify Chat, Slides, And Sheets Under One Run Contract

### Objective

Extend the run/artifact system beyond slides so chat handoff and sheet generation share one contract.

### Scope

- add sheet artifact type and version model
- unify handoff semantics between chat and workspaces
- standardize run history, filters, and resume behavior
- expose one run timeline UI component across launch-slice surfaces

### Milestones

1. Shared run history service for chat, slides, and sheets
2. Shared handoff contract from chat to artifact workspace
3. Shared timeline/progress renderer in frontend
4. Sheet flow migrated to canonical event contract

### Acceptance Criteria

- a chat-initiated sheet or slide run has the same lifecycle semantics
- handoff preserves prompt, context refs, and artifact identity
- users can view old runs from a shared run history model
- sheet streaming no longer requires a feature-specific event vocabulary to render progress
- one workspace can reopen a run regardless of its entry surface

## Phase 4: Extend To Writer, Research, Plagiarism, Citation, And Publish

### Objective

Generalize the artifact engine across the broader Shothik workspace.

### Scope

- add writer-doc artifacts
- add research artifacts and source bundles
- add plagiarism/citation report artifacts
- add publish job artifacts and checkpoints
- standardize versioning and handoff across these surfaces

### Milestones

1. Writer docs on artifact model
2. Research sessions on artifact model
3. Plagiarism reports on artifact model
4. Publish jobs mapped to runs and checkpoints

### Acceptance Criteria

- all in-scope artifact types can be reopened from a shared workspace history
- each artifact type defines editable state, exportability, and version semantics
- user-facing progress states are consistent across all migrated tools
- failure in one stage does not destroy artifact identity or prior versions
- cross-tool handoff is possible using artifact references instead of copied payloads

## Phase 5: Extract Hermes After Contract Stability

### Objective

Separate orchestration into a dedicated service only after the contract, event model, and operational profile are proven inside the current product.

### Scope

- extract orchestrator modules into Hermes
- preserve public/internal contracts for `shothik-web`
- add queue-backed execution where appropriate
- formalize service-level SLOs and deployment topology

### Milestones

1. Internal modules isolated behind clear interfaces
2. Hermes service running in staging
3. `shothik-web` consuming stable run/artifact APIs
4. production cutover complete for migrated workflows

### Acceptance Criteria

- no frontend route depends on private orchestration internals
- service boundaries are contract-tested
- rollout includes rollback plan and shadow-traffic verification where needed
- latency, failure rate, and resume behavior are not materially worse after extraction
- production operations have dashboards, alerts, and replay procedures

## Cross-Phase Workstreams

### Workstream A: Run And Artifact Contracts

- define schema
- add lifecycle rules
- enforce backward-compatible evolution

### Workstream B: Streaming And Progress UX

- normalize event payloads
- build reusable run timeline UI
- align loading, success, and failure states

### Workstream C: Persistence And Recovery

- persist artifacts and versions
- add checkpoints for long-running workflows
- support refresh-safe resumption

### Workstream D: Tool Routing And Workflow Engine

- centralize tool registration
- standardize planner and executor interfaces
- separate orchestration from UI concerns

### Workstream E: Observability And Reliability

- run-level tracing
- structured logs
- retry policies
- failure taxonomy
- alerting and dashboards

## Dependencies

- auth/session alignment across current and future route layers
- PostgreSQL schema additions for runs/artifacts/versions/events
- storage strategy for artifact snapshots and exports
- backward-compatible adapters for legacy slide and sheet services
- tracing/logging infrastructure

## Risks

- legacy services may conflict with the unified run/artifact model
- existing routes may hide progress if not normalized
- over-architecture too early may slow delivery
- auth/session mismatches across old and new flows may create regressions
- feature teams may keep shipping new custom contracts unless governance is explicit

## Risk Mitigations

- start with one vertical slice, not every tool
- require new AI workflows to use the canonical event envelope
- keep the current UI shell intact during backend migration
- prefer adapters before replacements
- extract Hermes only after contract stability and measured operational success

## Definition Of Success

Shothik succeeds when a user can start from a prompt, watch AI work in real time, receive a genuine artifact, continue editing in the same workspace, and return later without losing context.

## Immediate Next Steps

1. Approve the canonical `run` and `artifact` vocabulary
2. Use the accepted Phase 0 ADR set:
   - `docs/adr/ADR-001-run-artifact-event-contract.md`
   - `docs/adr/ADR-002-hermes-modular-monolith-boundaries.md`
   - `docs/adr/ADR-003-api-gateway-to-hermes-integration-rules.md`
3. Define the Phase 1 implementation backlog for:
   - chat run bootstrap
   - slide normalization adapter
   - unified event renderer
   - refresh-safe resume
4. Add a technical design doc for the launch slice:
   - APIs
   - schema changes
   - UI touchpoints
   - rollout plan
