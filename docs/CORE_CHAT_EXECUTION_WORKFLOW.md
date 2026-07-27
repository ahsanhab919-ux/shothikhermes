# Core Chat Execution Workflow

## Purpose

This document defines the primary execution workflow for the highest-priority
project stream in Shothik:

`the Hermes-centered core chat platform`

It converts the existing architecture direction into an execution model with:

- clear scope boundaries
- milestone-based delivery
- resource coordination
- schedule priority
- phased quality verification
- acceptance gates before each core module is considered delivered

All non-urgent secondary work should be deprioritized until the milestones in
this document are materially complete.

## Primary Core Task

The primary critical task is:

`deliver a production-capable, cost-efficient, scalable core chat system for Shothik`

This includes:

- Hermes-based chat orchestration
- reliable session/run/message lifecycle
- retrieval and model routing
- execution-lane policy
- Docker/VPS deployment baseline
- inference and required supporting services
- release-quality verification for each core module

## Scope Definition

### In Scope

1. Core chat UX
- message composer
- transcript rendering
- streaming response handling
- conversation history
- error visibility
- session continuity

2. Hermes runtime
- chat orchestrator
- session and run ownership
- artifact lifecycle
- event streaming
- lane routing policy

3. Data and state backbone
- Postgres durable state
- Redis hot state / replay / rate limits
- Convex integration where already part of active application flows

4. Retrieval and tool foundation
- semantic and keyword retrieval baseline
- web/search adapter integration
- document attachment flow

5. Execution and inference foundation
- cheap/default inference path
- containerized sandbox path
- infrastructure boundary for model serving

6. Deployment baseline
- Dockerized app service
- Dockerized supporting services required for core chat operation
- Nginx reverse proxy
- VPS-ready topology

7. Quality and acceptance controls
- module-level functional testing
- compliance and environment checks
- release gate before delivery of each core module

### Out of Scope For This Priority Window

- broad feature expansion outside core chat
- non-essential marketplace enhancements
- secondary product surfaces unrelated to core chat reliability
- premature microservice extraction
- large-scale graph/Vespa rollout before baseline chat is stable
- interactive live terminal as default user mode

## Execution Principles

1. Prioritize the cheapest valid lane
2. Keep Hermes as the orchestration authority
3. Deliver stable foundations before premium features
4. Gate every core module with tests before marking it complete
5. Prefer operationally simple infrastructure first
6. Pause non-urgent parallel work unless it directly unblocks the core path

## Workstreams

### Workstream A: Product Surface

Scope:
- composer
- transcript
- error states
- loading/streaming states
- conversation list/history

Owner focus:
- frontend/application layer

Definition of done:
- user can send, receive, retry, and review chat reliably
- visible failures replace silent failures
- session continuity works for normal usage

### Workstream B: Hermes Runtime

Scope:
- chat orchestrator
- run/session state
- event stream handling
- response lifecycle
- artifact-aware turn flow

Owner focus:
- backend/core application layer

Definition of done:
- runs are deterministic and traceable
- stream lifecycle is stable
- lane decisions are observable

### Workstream C: Retrieval and Knowledge Access

Scope:
- retrieval planning
- search/crawl adapter wiring
- document ingestion entry path
- citation/source-ready response path

Owner focus:
- retrieval/integration layer

Definition of done:
- retrieval-backed turns work end-to-end
- source-bearing flows are testable
- document turns produce durable downstream context

### Workstream D: Deployment and Runtime Infrastructure

Scope:
- Docker stack
- Nginx routing
- Redis/Postgres wiring
- inference host boundary
- containerized required third-party/self-hosted services

Owner focus:
- platform/infrastructure layer

Definition of done:
- local and VPS-like deployment path is reproducible
- core services boot in the expected dependency order
- app can reach required runtime services reliably

### Workstream E: Quality and Release Controls

Scope:
- acceptance checklists
- functional verification
- compliance/environment validation
- release gate criteria

Owner focus:
- cross-functional verification

Definition of done:
- every core module has explicit pass/fail criteria
- delivery cannot be marked complete without evidence

## Milestones And Delivery Schedule

### Milestone 0: Scope Lock And Delivery Controls

Target duration:
- 1 to 2 days

Deliverables:
- approved scope and exclusions
- milestone breakdown
- module acceptance criteria
- execution priority freeze on non-urgent work

Acceptance gate:
- project team aligns on the core path
- no ambiguous ownership for core modules

### Milestone 1: Chat Reliability Baseline

Target duration:
- 3 to 5 days

Deliverables:
- chat send/stream/retry baseline
- conversation history baseline
- visible error handling
- authenticated API path verified

Acceptance gate:
- no silent send failures
- no blocker-level auth regressions on core chat routes
- normal chat turn succeeds end-to-end

### Milestone 2: Hermes Runtime Stabilization

Target duration:
- 4 to 6 days

Deliverables:
- stable session/run lifecycle
- canonical Hermes event handling
- run status visibility
- artifact-aware state propagation

Acceptance gate:
- sessions and runs can be traced per turn
- stream completion/failure paths are deterministic
- retries do not corrupt conversation state

### Milestone 3: Retrieval And Document Intelligence Baseline

Target duration:
- 4 to 7 days

Deliverables:
- retrieval-backed chat path
- document attachment ingestion baseline
- source/citation-capable response path
- clear routing between answer-only and retrieval turns

Acceptance gate:
- retrieval turn returns grounded output
- document turn passes ingest and follow-up reference flow
- failure paths degrade clearly

### Milestone 4: Deployment And Service Stack Baseline

Target duration:
- 4 to 6 days

Deliverables:
- Docker Compose baseline for core stack
- Nginx reverse proxy
- app + Redis + Postgres + inference + required services wired
- VPS deployment runbook baseline

Acceptance gate:
- stack boots reproducibly
- app passes health checks against containerized dependencies
- core chat path works in Dockerized environment

### Milestone 5: Quality Hardening And Release Candidate

Target duration:
- 3 to 5 days

Deliverables:
- regression test pass
- environment and compliance verification
- release checklist
- go/no-go decision for core deployment

Acceptance gate:
- all critical-path checks pass
- no unresolved severity-1 defects
- documented rollback and recovery path exists

## Delivery Sequence

The execution order is:

1. Scope lock
2. Chat reliability baseline
3. Hermes runtime stabilization
4. Retrieval/document baseline
5. Deployment/service stack baseline
6. Hardening and release gate

Do not invert this order unless a dependency forces it.

## Resource Allocation Priority

### Priority Order

1. Core chat reliability
2. Hermes runtime correctness
3. Deployment and service dependencies
4. Retrieval/document intelligence
5. Secondary optimization and expansion

### Resource Model

#### Track 1: Application Delivery
- chat UI
- API handlers
- Hermes integration

#### Track 2: Infrastructure Delivery
- Docker services
- Nginx
- Redis/Postgres/inference/service wiring

#### Track 3: Verification
- functional testing
- compliance checks
- release criteria enforcement

### Suspension Rule

Suspend or defer:

- non-urgent secondary enhancements
- unrelated debugging threads
- speculative future infrastructure
- low-impact cosmetic work

unless they directly unblock the core milestone currently in progress.

## Required Runtime Services For Core Delivery

### Containerize First

- `web` (Next.js / Hermes boundary)
- `nginx`
- `postgres`
- `redis`
- `inference` (`ollama` or equivalent cheap-serving lane)
- `typesense`
- `searxng`
- `letta`
- `calibre` service
- `sandbox-worker`

### Keep Managed For Now

- `Convex`
- `Cloudflare`
- `R2`
- `Stripe`
- `Razorpay`
- `bKash`
- external frontier LLM APIs

## Phased Quality Verification Mechanism

Each milestone must pass a formal verification gate before delivery.

### Gate 1: Functional Testing

Minimum expectations:

- happy-path behavior works end-to-end
- key failure paths are visible and recoverable
- no blocker-level regression on prior completed modules

Evidence:

- local test pass
- targeted manual verification
- runtime evidence for streaming/auth/dependency flows

### Gate 2: Compliance And Configuration Checks

Minimum expectations:

- required env vars exist
- auth behavior matches intended access model
- rate limit and error behavior are not bypassed
- deployment configuration does not violate project constraints

Evidence:

- env checklist pass
- route/config validation
- infrastructure sanity checks

### Gate 3: Integration Verification

Minimum expectations:

- module works with adjacent modules, not only in isolation
- no unresolved critical dependency break

Evidence:

- app-to-service connectivity confirmed
- stream/data/persistence path verified

### Gate 4: Delivery Acceptance

A core module can be called delivered only if:

- functional testing passed
- compliance checks passed
- integration verification passed
- known residual risk is documented and accepted

## Core Module Acceptance Matrix

### Module: Chat UI

Must pass:
- send/receive flow
- multiline input behavior
- visible errors
- conversation continuity

### Module: Chat APIs

Must pass:
- authenticated access model
- correct success/error codes
- stable request validation
- rate limiting behavior

### Module: Hermes Runtime

Must pass:
- session creation
- run creation
- streaming lifecycle
- completion/failure handling

### Module: Retrieval Layer

Must pass:
- retrieval routing
- source-aware output
- failure fallback behavior

### Module: Deployment Stack

Must pass:
- container boot
- service discovery
- env wiring
- reverse proxy routing

### Module: Inference Layer

Must pass:
- healthy model endpoint
- bounded latency for baseline turns
- no starvation of app runtime

## Execution Cadence

### Daily

- confirm active milestone
- confirm blockers
- confirm resource focus
- confirm verification status

### At Milestone Boundary

- review acceptance checklist
- run functional and compliance gate
- record pass/fail outcome
- either promote or return to fix cycle

## Immediate Next Actions

1. Lock the core task scope to the chat platform only
2. Freeze non-urgent secondary work
3. Execute Milestone 1: chat reliability baseline
4. In parallel, prepare Milestone 4 service inventory and Docker Compose baseline
5. Do not mark any module complete without test and compliance evidence

## Success Criteria

This execution workflow is successful when:

- the team works against one clear core path
- the chat system is reliable before expansion
- Docker/VPS deployment is reproducible
- inference and required services are explicitly planned
- every core module is delivered through a gated verification process

