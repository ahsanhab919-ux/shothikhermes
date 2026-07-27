# Hermes Phase 0 To Phase 5 Architecture Plan

## Purpose

This document defines how to transform `shothik-web` into an artifact-first, Genspark-like AI workspace without discarding the current product shell.

The guiding strategy is:

- keep the current Shothik UI, auth, navigation, and design system
- move AI orchestration out of frontend pages, hooks, and feature services
- introduce Hermes as a modular monolith first
- extract Hermes into a dedicated service only after contracts and operations are stable

## Related Decisions

- `docs/adr/ADR-001-run-artifact-event-contract.md`
- `docs/adr/ADR-002-hermes-modular-monolith-boundaries.md`
- `docs/adr/ADR-003-api-gateway-to-hermes-integration-rules.md`

## Related Execution Docs

- `docs/PHASE_1_CHAT_TO_SLIDES_EXECUTION_BACKLOG.md`

## Architecture Thesis

Shothik should become an artifact-first AI workspace where:

- chat is the super-agent entry point
- every serious output becomes a durable artifact
- users can watch planning, tool calls, and progress in real time
- workspaces reopen from persistent state
- versions, checkpoints, and handoffs are first-class

This means the current repo should evolve into:

```text
Frontend (Current Shothik UI)
        |
        v
API Gateway
        |
        v
Hermes Orchestrator
    - Planner
    - Tool Router
    - Memory
    - Workflow Engine
    - Artifact Manager
    - Streaming Engine
        |
        v
Tools
    - Deep Research
    - Slides
    - Sheets
    - Browser
    - Code Execution
    - Citation
    - Plagiarism
    - Search
        |
        v
Storage
    - PostgreSQL
    - Redis
    - Blob Storage
    - Vector DB
```

## Strategic Position

### What We Keep

- design system
- authentication
- navigation
- landing page
- responsive layout
- existing UI components
- existing workspace shell where already usable
- current domain pages for writing, books, Twin, research, slides, sheets, marketplace, and community

### What We Replace

- AI business logic inside the frontend
- direct model calls from route handlers and services
- tool-specific orchestration inside feature UI code
- feature-specific event contracts
- fragmented workflow state models

### What We Add

- artifact engine
- persistent workspace
- version history
- tool registry
- streaming event system
- workflow engine
- background job queue
- multi-agent orchestration

## Architectural Style

## 1. Frontend: Product Shell

`shothik-web` remains the presentation layer.

Responsibilities:

- routing and layout
- auth/session UX
- workspace rendering
- editors and viewers
- run timeline and progress UI
- artifact browsing
- artifact editing
- notifications and navigation

The frontend should stop owning orchestration decisions.

## 2. Hermes: Modular Monolith First

Hermes should begin as a modular monolith, not as a premature microservice mesh.

Why:

- the repo already has mixed persistence and mixed workflow models
- contracts are not stable enough for a clean service split yet
- a modular monolith allows hard domain boundaries without distributed-system overhead
- we can still extract modules later if justified by load, team topology, or operational need

Initial deployment shape:

- Hermes runs inside the backend boundary behind the API gateway
- modules communicate in-process through typed interfaces and domain events
- storage remains shared but bounded by module ownership

Extraction rule:

- no module leaves the monolith until its API contract, event contract, and operational profile are stable

## Artifact-First Domain Model

## Core Concepts

### Workspace

A durable user-owned context that groups runs, artifacts, and collaboration state.

### Run

A single AI execution lifecycle.

### Artifact

A durable output object that survives beyond a run.

### Artifact Version

A saved revision of an artifact.

### Checkpoint

A resumable snapshot created during long-running workflows.

### Event

A structured runtime signal emitted from Hermes to the UI and observability systems.

## Canonical Tables

### PostgreSQL

- `workspaces`
- `runs`
- `run_events`
- `artifacts`
- `artifact_versions`
- `artifact_checkpoints`
- `tool_calls`
- `tool_results`
- `workflow_jobs`
- `artifact_links`
- `workspace_members`

### Redis

- queue state
- stream fan-out
- in-flight run coordination
- idempotency keys
- hot resume pointers

### Blob Storage

- exports
- uploaded sources
- generated files
- artifact snapshots
- presentation payloads
- research attachments

### Vector DB

- retrieval memory
- research source embeddings
- long-horizon workspace memory
- optional Twin memory augmentation

## Module Map

Hermes should be organized around modules, not technical folders alone.

## A. Agent / Platform Modules

### `planner`

- interprets prompt or intent
- decomposes tasks
- chooses workflow strategy
- emits plan events

### `workflow-engine`

- executes multi-step workflows
- manages state transitions
- coordinates retries, branching, and completion

### `tool-registry`

- maintains tool definitions
- validates tool contracts
- resolves tools by capability and policy

### `tool-router`

- chooses tool invocation path
- applies safety, auth, and quota policy

### `memory`

- run memory
- workspace memory
- retrieval integration
- Twin-aware memory access where needed

### `streaming-engine`

- emits canonical events
- fans out to SSE or WebSocket consumers
- supports replay for resumed sessions

## B. Artifact Modules

### `artifact-manager`

- create artifact records
- apply patches
- create versions
- manage artifact metadata
- handle cross-artifact linking

### `workspace-manager`

- workspace creation and navigation state
- chat-to-workspace handoff
- artifact opening and resume behavior

### Artifact-type modules

- `slides`
- `sheets`
- `writing`
- `books`
- `research`
- `ai_detector`
- `plagiarism`
- `publish`

Each artifact module owns:

- its internal schema rules
- patch validation
- export semantics
- editor payload contracts
- artifact-specific recovery rules

## C. Network / Commercial Modules

### `community`

- forum and social integration over artifacts and Twin

### `marketplace`

- published artifact discovery
- purchase/access state
- seller monetization integration

### `billing`

- credits, subscriptions, payouts, payment integrations

## Target Repo Direction

This is a logical structure, not a mandatory immediate folder rewrite:

```text
shothik-web/
  app/                        # Next.js UI shell and API gateway handlers
  components/                 # Existing presentation components
  features/                   # UI feature composition over stable APIs
  lib/
    api-gateway/              # thin HTTP clients and route adapters
    frontend-runtime/         # UI state, event adapters, hooks
  hermes/
    modules/
      planner/
      workflow-engine/
      tool-registry/
      tool-router/
      memory/
      streaming-engine/
      artifact-manager/
      workspace-manager/
      slides/
      sheets/
      writing/
      books/
      research/
      ai-detector/
      plagiarism/
      publish/
      community/
      marketplace/
      billing/
    contracts/
      events/
      runs/
      artifacts/
      tools/
    infra/
      db/
      queue/
      blob/
      vector/
      observability/
```

## API Gateway Rules

The API gateway should become thin.

Allowed responsibilities:

- auth verification
- request validation
- idempotency handling
- request-to-command mapping
- stream proxying
- response shaping

Disallowed responsibilities:

- direct tool orchestration
- multi-step workflow logic
- artifact mutation rules
- business-state transitions spread across routes

## Canonical Event Contract

All Hermes-driven workflows should emit one event envelope:

```json
{
  "runId": "run_123",
  "seq": 17,
  "timestamp": "2026-07-23T10:00:00.000Z",
  "type": "progress",
  "workspaceId": "ws_001",
  "artifactType": "slides",
  "artifactId": "art_901",
  "status": "running",
  "label": "Generating outline",
  "message": "Prepared slide outline",
  "payload": {}
}
```

Minimum event types:

- `run_created`
- `plan`
- `tool_call`
- `tool_result`
- `progress`
- `artifact_create`
- `artifact_patch`
- `checkpoint`
- `version_create`
- `handoff`
- `done`
- `error`

## Product Surface Classification

## Artifact-First Domains

- writing tools
- book write to publish
- slides
- sheets
- deep research
- AI detector reports
- plagiarism checker reports

## Agent / Platform Domains

- chat
- Twin
- tool registry
- code execution capability
- browser capability
- memory and orchestration

## Network / Commercial Domains

- community
- marketplace
- billing, credits, subscriptions, payouts

## Transformation Plan

## Phase 0: Contract And Monolith Design

### Objective

Lock the target modular-monolith architecture and define the shared contracts before major implementation movement.

### Deliverables

- ADR: artifact-first architecture
- ADR: Hermes modular-monolith boundaries
- ADR: canonical run/event/artifact contract
- source-to-target map for current repo domains
- migration inventory of frontend-owned AI logic

Phase 0 ADR set:

- `ADR-001` - run, artifact, and event contract
- `ADR-002` - Hermes modular-monolith boundaries
- `ADR-003` - API gateway to Hermes integration rules

### Key Tasks

1. classify repo domains into artifact-first, agent/platform, and network/commercial
2. define module ownership and storage ownership
3. define canonical events and run lifecycle
4. define artifact schema by domain
5. define gateway-to-Hermes interface

### Acceptance Criteria

- all product domains are mapped to a target Hermes module
- all in-scope workflows have a proposed run/artifact contract
- slide and sheet legacy contracts have adapter plans
- no critical domain is left “miscellaneous”

## Phase 1: Gateway And Launch Slice Stabilization

### Objective

Stabilize the current `chat -> slides` path while introducing the first Hermes-compatible contracts.

### Scope

- keep current UI
- add thin API gateway adapters
- normalize chat stream events
- normalize slide stream events
- introduce `run.create` and `run.resume` primitives

### Key Tasks

1. bootstrap run IDs in chat and slide flows
2. translate current slide events into canonical events
3. add run-aware progress timeline UI
4. persist run metadata in PostgreSQL
5. add refresh-safe resume

### Acceptance Criteria

- chat and slides share one visible run timeline
- a user can refresh and reconnect to an in-progress run
- gateway routes stop embedding multi-step orchestration logic
- every visible step has a Hermes-compatible event type

## Phase 2: Slide Artifact Engine

### Objective

Make slides the first true artifact-first domain owned by Hermes.

### Scope

- persistent slide artifacts
- slide versions
- checkpoints
- export over artifact state
- backend-owned planning and generation

### Key Tasks

1. create `slides` module under Hermes
2. move slide planning and orchestration behind module contracts
3. persist slide artifact state and versions
4. make the slide editor load from artifact state
5. wire export to artifact versions

### Acceptance Criteria

- slide generation no longer depends on frontend-owned orchestration
- every deck has an artifact record and version history
- export runs against stored artifact state
- slide workspace opens from artifact ID, not only transient job state

## Phase 3: Sheets And Research Under Unified Runs

### Objective

Extend the same contract to sheets and deep research.

### Scope

- sheet artifacts
- research artifacts
- shared handoff model from chat
- shared timeline and resume model

### Key Tasks

1. create `sheets` and `research` Hermes modules
2. replace sheet-specific stream vocabulary with canonical events
3. create research output artifacts and source bundles
4. unify workspace navigation and handoff behavior

### Acceptance Criteria

- chat can hand off into slides, sheets, and research through one run model
- users can reopen those artifacts from persistent workspace history
- sheet and research progress render through the same event UI

## Phase 4: Writing, Books, Reports, And Publish

### Objective

Unify the rest of the artifact-heavy workspace.

### Scope

- writing tools
- book write to publish
- AI detector reports
- plagiarism checker reports
- citation capability integration
- publish jobs and distribution checkpoints

### Key Tasks

1. create `writing`, `books`, `ai-detector`, `plagiarism`, and `publish` modules
2. standardize versioning across writing and book workflows
3. persist report-style artifacts for detector and plagiarism outputs
4. link citations as capability services used by writing/research/plagiarism
5. move publish progression into run/checkpoint semantics

### Acceptance Criteria

- all artifact-heavy domains share common lifecycle semantics
- writing and books support durable versions and resumable runs
- detector and plagiarism outputs are persistent report artifacts
- publish jobs preserve progress and failure state without losing artifact identity

## Phase 5: Twin, Community, Marketplace, And Extraction Decision

### Objective

Complete platform integration and decide whether Hermes should remain an internal modular monolith or be extracted.

### Scope

- Twin integration with runs and artifacts
- community interactions over artifacts
- marketplace integration over published artifact identity
- optional Hermes service extraction

### Key Tasks

1. integrate Twin actions with Hermes workflows
2. link community posts and previews to artifact IDs
3. make marketplace consume published artifact metadata
4. define extraction criteria for Hermes
5. extract only modules that justify independent deployment

### Acceptance Criteria

- Twin can operate against stable artifact and workflow contracts
- community and marketplace integrate over canonical artifact identity
- extraction decision is based on observed need, not aspiration
- if Hermes is extracted, `shothik-web` remains a thin presentation shell over stable APIs

## Mapping Current Repo To Future State

## Preserve As-Is Or Near-As-Is

- `components/ui/*`
- layout shells
- account/auth/navigation
- landing and pricing pages
- current editors and viewers where they can consume stable APIs

## Migrate Behind Gateway

- `app/api/chat/*`
- `app/api/research/*`
- `app/api/sheet/*`
- `app/api/book/*`
- `app/api/publish/*`
- `app/api/tools/*`

## Retire Or Reduce

- frontend-owned orchestration services such as:
  - `services/slide-generation.ts`
  - `services/presentation/*`
  - `services/sheetAiStreamService.js`
  - feature-local orchestration helpers that encode business workflows

## Success Conditions

This transformation succeeds when:

- the current repo still feels like Shothik
- the frontend becomes a clean presentation shell
- Hermes owns planning, routing, execution, memory, and artifact state
- all serious outputs are persistent artifacts
- users can watch runs live, return later, and continue from the same workspace

## Bottom Line

Do not rebuild Shothik.

Evolve it into:

- an artifact-first workspace
- with agent/platform intelligence
- through a modular-monolith Hermes layer
- while preserving the current UI product shell

That gives you a Genspark-like operating model without paying the cost of a rewrite or premature microservice split.
