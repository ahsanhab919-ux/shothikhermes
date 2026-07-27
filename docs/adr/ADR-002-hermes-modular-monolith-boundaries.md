# ADR-002: Hermes Modular-Monolith Boundaries

## Status

Accepted

## Date

2026-07-23

## Context

The current repository already contains broad product functionality:

- writing tools
- book write to publish
- Twin
- community
- slides
- sheets
- research
- AI detector
- plagiarism
- marketplace

But orchestration logic is spread across:

- frontend-facing route handlers
- feature-specific services
- page-level logic
- tool-specific stream handlers

There is a need for a backend AI operating layer, but the product contracts are not yet stable enough to justify an immediate microservice split.

If Hermes is extracted too early:

- service boundaries will reflect current inconsistencies instead of stable contracts
- migration cost will rise
- operations complexity will arrive before product contracts are proven

## Decision

Hermes will begin as a modular monolith.

This means:

- one deployable orchestration boundary initially
- strong internal module boundaries
- shared process space
- explicit domain ownership
- extraction only after contract stability and operational proof

## Architectural Boundary

### Frontend

`shothik-web` remains the presentation shell.

Frontend responsibilities:

- route rendering
- navigation
- authentication UX
- editors and viewers
- event rendering
- workspace presentation
- artifact browsing and editing UI

Frontend must not own:

- planning logic
- workflow orchestration
- tool routing decisions
- domain state transitions
- long-running execution logic

### API Gateway

The route layer is a gateway, not a workflow engine.

Gateway responsibilities:

- auth
- validation
- idempotency
- request-to-command mapping
- stream proxying
- response shaping

Gateway must not own:

- multi-step AI workflows
- artifact rules
- business-state machines
- tool selection logic beyond simple routing

### Hermes

Hermes owns:

- planning
- workflow execution
- tool routing
- memory
- artifact state
- stream event production
- background job coordination

## Module Groups

Hermes must be partitioned into three top-level groups.

## A. Agent / Platform Modules

- `planner`
- `workflow-engine`
- `tool-registry`
- `tool-router`
- `memory`
- `streaming-engine`

## B. Artifact Modules

- `artifact-manager`
- `workspace-manager`
- `slides`
- `sheets`
- `writing`
- `books`
- `research`
- `ai-detector`
- `plagiarism`
- `publish`

## C. Network / Commercial Modules

- `community`
- `marketplace`
- `billing`

## Ownership Rules

Each Hermes module must own:

- its business rules
- its command handlers
- its persistence mapping
- its event emission logic
- its public internal interface

Each module must not reach into another module’s tables or internals casually.

Cross-module work should happen through:

- typed internal APIs
- domain events
- explicitly shared contracts

## Storage Ownership Rules

Shared infrastructure does not mean shared ownership.

### PostgreSQL

Module-owned tables or schemas should be preferred logically, even if physically colocated.

### Redis

Owned by infrastructure concerns such as:

- queue coordination
- in-flight run state
- streaming fan-out
- distributed locks

### Blob Storage

Owned through module contracts for:

- exports
- attachments
- snapshots
- generated assets

### Vector DB

Accessible only through memory or retrieval-facing modules, not ad hoc from arbitrary features.

## Extraction Rule

A Hermes module may be extracted into an independent service only when all of the following are true:

1. its contracts are stable
2. its event model is stable
3. its operational load justifies separation
4. its failure modes are understood
5. rollback and observability are ready

Until then, it stays in the modular monolith.

## Why Modular Monolith Instead Of Immediate Microservices

### Accepted Advantages

- faster convergence on stable contracts
- easier refactoring during migration
- simpler local development
- fewer distributed failure modes
- lower cognitive load while domain boundaries are still forming

### Accepted Tradeoffs

- less independent scaling at the beginning
- discipline is required to keep boundaries clean
- bad internal architecture can still become a “distributed monolith later” if ignored

## Rejected Alternatives

### 1. Keep All Orchestration Inside The Frontend Repo Layers

Rejected because:

- current fragmentation is already proving costly
- feature services are encoding workflow rules that belong in backend modules
- it blocks reuse across artifact domains

### 2. Extract Hermes As A Separate Microservice Immediately

Rejected because:

- stable contracts are not ready
- slide and sheet flows still need normalization
- storage and run semantics are not unified yet

### 3. Full Monolith With No Internal Module Boundaries

Rejected because:

- it would recreate the same ownership ambiguity in a different folder
- extraction later would become harder
- artifact-first domain ownership would blur quickly

## Consequences

### Positive

- preserves the current product shell
- creates a clean orchestration center
- supports gradual migration
- supports later extraction without redesigning everything

### Negative

- requires strict governance on internal boundaries
- route handlers and services must be refactored instead of left to sprawl
- some duplicated logic will exist during transition

## Immediate Implementation Impact

The first modules that should be made explicit are:

1. `planner`
2. `workflow-engine`
3. `streaming-engine`
4. `artifact-manager`
5. `slides`
6. `sheets`

These modules support the launch slice and force the cleanest early boundaries.

## Supersedes

None
