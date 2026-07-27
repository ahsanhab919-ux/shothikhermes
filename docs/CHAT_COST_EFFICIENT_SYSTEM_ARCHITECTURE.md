# Chat Cost-Efficient System Architecture

## Purpose

This document turns the current Hermes chat direction into a cost-aware,
scalable system design for Shothik.

It is specifically grounded in the current repository state:

- chat is already moving behind Hermes orchestration
- runs, sessions, artifacts, and Redis-backed streaming already exist as
  architectural primitives
- the product direction is artifact-first, not response-first

The goal is not to build "a chatbot that sometimes runs tools."

The goal is to build:

`chat -> Hermes policy engine -> cheapest valid execution path -> durable result`

## Related Documents

- `docs/PRD.md`
- `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
- `docs/CHAT_HERMES_MIGRATION_ANALYSIS.md`
- `docs/CHAT_DRIVEN_DOCUMENT_INTELLIGENCE_BLUEPRINT.md`
- `docs/adr/ADR-001-run-artifact-event-contract.md`
- `docs/adr/ADR-002-hermes-modular-monolith-boundaries.md`
- `docs/adr/ADR-003-api-gateway-to-hermes-integration-rules.md`

## Architecture Thesis

Shothik chat should not be modeled as:

`textbox -> model -> answer`

It should be modeled as:

`chat surface -> edge control -> Hermes router -> execution lane -> streamed result/artifact`

The critical product rule is:

- the frontend may assist, cache, and accelerate UX
- Hermes remains the final decision-maker
- expensive compute is used only when cheaper lanes cannot solve the turn

## Design Goals

- keep per-turn cost low for common chat traffic
- scale safely without giving every user a persistent server environment
- preserve privacy-friendly and local-first options where useful
- let the same chat surface escalate into tools, artifacts, and execution
- keep premium/high-compute features explicit and meterable

## Non-Goals

- giving every user a live terminal by default
- making every turn use frontier cloud models
- moving orchestration logic back into the frontend
- turning the chat product into a raw terminal product

## Recommended System Shape

```text
Client Chat Surface
    |
    v
Edge Gateway
    |
    v
Hermes Chat Runtime
    |
    +--> Lane 0: Cheap chat
    +--> Lane 1: Tool chat
    +--> Lane 2: Ephemeral sandbox
    +--> Lane 3: Live terminal
    +--> Lane 4: Browser-local runtime
    |
    v
Runs / Sessions / Artifacts / Events
```

## Execution Lanes

### Lane 0: Cheap Chat

Default lane for the majority of traffic.

Use for:

- normal chat Q&A
- cached answers
- session memory lookups
- retrieval-only answers
- low-complexity reasoning

Backends:

- Redis hot state
- Postgres durable state
- small/cheap cloud model or local Ollama model

Cost profile:

- lowest cost
- lowest operational complexity
- should handle most traffic

### Lane 1: Tool Chat

For turns that need tools but not shell execution.

Use for:

- web search
- citations
- document lookup
- browser automation
- research fetches
- structured extraction

Backends:

- Hermes tool router
- MCP connectors
- search/crawl adapters
- retrieval services

Cost profile:

- moderate cost
- cheaper than sandbox execution
- should be the second most common lane

### Lane 2: Ephemeral Sandbox

This is the primary execution lane for tasks that need code or shell.

Use for:

- shell commands
- code execution
- package installs
- file conversion
- CLI workflows
- agentic debugging or build/test tasks

Implementation:

- short-lived Ubuntu Docker container or microVM
- per run or per user session
- strict CPU, memory, time, and network limits
- stdout/stderr streamed back into the run timeline

Cost profile:

- materially more expensive than Lanes 0 and 1
- much cheaper and safer than always-on terminals
- best balance of utility, safety, and scale

### Lane 3: Live Terminal

High-power interactive mode.

Use for:

- developer mode
- supervised agent sessions
- debugging workspaces
- collaborative coding windows
- infrastructure/admin sessions

Implementation:

- `xterm.js` in frontend
- WebSocket bridge
- `node-pty` on backend
- connected to a dedicated Ubuntu instance, container, or controlled VM

Cost profile:

- highest operational complexity
- should be explicit, premium, or role-gated
- should not be the default chat mode

### Lane 4: Browser-Local Runtime

Optional privacy/offline lane.

Use for:

- local-only utilities
- offline demos
- lightweight private execution
- local-first educational or experimental workflows

Implementation:

- WebLLM for lightweight inference
- v86 or WASM/container runtime only where practical
- IndexedDB-backed local state

Cost profile:

- near-zero server execution cost
- limited capability and weaker compatibility
- valuable as a differentiated mode, not the default backbone

## Cost Routing Policy

Hermes should classify every user turn before execution.

Suggested decision flow:

1. Can the answer come from cache or session state?
2. Can retrieval plus a cheap/local model answer it?
3. Does it need a non-shell tool?
4. Does it need short-lived code or shell execution?
5. Does it require interactive terminal control?
6. Does it require a frontier cloud model after all cheaper routes fail?

This becomes a policy engine, not just a model selector.

## Target Traffic Distribution

The system should be designed so the traffic split trends toward:

- `70-80%` Lane 0
- `15-20%` Lane 1
- `3-8%` Lane 2
- `<1%` Lane 3
- niche/offline adoption for Lane 4

If the traffic distribution drifts toward sandbox or terminal-heavy usage, the
system will become expensive quickly.

## Layer Responsibilities

### 1. Client Layer

Responsibilities:

- chat composer
- transcript rendering
- attachment staging
- optimistic UI
- IndexedDB cache for session continuity
- prompt cleanup and intent hints
- optional local model usage for tiny tasks

Must not own:

- final workflow routing
- tool choice
- artifact creation decisions
- durable memory authority

### 2. Edge Layer

Recommended stack:

- Cloudflare Workers

Responsibilities:

- auth/session token validation
- rate limiting
- abuse filtering
- request normalization
- SSE/WebSocket ingress
- lightweight admission policy

Should not become:

- the real orchestration engine
- a second business-logic backend

### 3. Hermes Core

Hermes is the center of gravity.

Responsibilities:

- final intent resolution
- run/session/workspace ownership
- model routing
- tool routing
- cost budgeting
- execution lane selection
- artifact creation and handoff
- canonical event emission

This fits the current repo direction:

- chat orchestration behind Hermes
- Redis-backed event streaming
- artifact-first product flow

### 4. Retrieval Layer

Recommended early stack:

- Redis for hot state and replay
- Postgres for durable records
- optional vector DB when retrieval quality demands it
- search/crawl only when needed

Suggested sequence:

- day 1: Redis + Postgres
- day 2: add vector retrieval when grounded use cases justify it
- later: optional graph DB if entity/citation graph queries become central

### 5. Execution Layer

Recommended execution stack:

- local Ollama node for cheap inference
- ephemeral Docker or Firecracker pool for code/shell execution
- cloud frontier models as escalation path
- live terminal host for premium/dev mode only

## Why Ephemeral Sandbox Should Be the Main Execution Model

Of the three Ubuntu-related approaches:

### Server-backed live terminal

Strengths:

- powerful
- intuitive for developers
- ideal for supervised interactive sessions

Weaknesses:

- expensive if overused
- harder to isolate and meter
- not needed for most users

### Ephemeral sandbox

Strengths:

- strong isolation
- easier to meter per run
- easier to autoscale
- works well for both user-invoked and agent-invoked tasks

Weaknesses:

- less interactive than a live terminal
- requires careful image design and cold-start optimization

This should be the default execution lane.

### Browser-local runtime

Strengths:

- zero backend compute cost
- strong privacy story
- good offline/differentiated UX

Weaknesses:

- limited compatibility
- weaker performance
- not reliable enough for the primary execution backbone

This should be additive, not foundational.

## Product UX Framing

Users should not need to understand infra lanes.

Recommended product modes:

- `Ask`
- `Research`
- `Act`
- `Dev Mode`
- `Private Local`

Under the hood:

- `Ask` -> Lane 0
- `Research` -> Lane 1
- `Act` -> Lane 1 or 2
- `Dev Mode` -> Lane 2 or 3
- `Private Local` -> Lane 4

This keeps the system legible while still enabling cost discipline.

## Metering and Cost Controls

Every run should carry a budget envelope.

Suggested run metadata:

- `execution_class`
- `max_model_tier`
- `max_runtime_seconds`
- `max_tool_calls`
- `network_policy`
- `sandbox_allowed`
- `terminal_allowed`

Suggested controls:

- per-user daily compute quota
- premium gating for terminal mode
- hard timeouts for sandbox runs
- image and package allowlists
- result caching for common retrieval turns
- downgrade path when premium budget is exhausted

## Recommended Phase Order

### Phase 1: Cheap Chat Core

- stabilize Hermes-backed chat
- keep turns mostly in Lane 0
- improve error handling and session continuity

### Phase 2: Retrieval-First Chat

- add structured retrieval and search policy
- keep tool calls cheaper than execution

### Phase 3: Ephemeral Sandbox

- introduce run-scoped Ubuntu execution
- stream stdout/stderr into Hermes events
- attach outputs to artifacts

### Phase 4: Artifact-Aware Execution

- let execution runs produce reusable artifacts
- support replay, resume, and export

### Phase 5: Live Terminal

- add `xterm.js` + `node-pty`
- role-gate or premium-gate this mode

### Phase 6: Browser-Local Runtime

- add private/offline local execution mode
- keep this optional and bounded

## Shothik-Specific Recommendation

Given the current repository and product goals:

1. Keep Hermes as the final router
2. Keep Redis-backed streaming and run history as the visibility layer
3. Use ephemeral sandbox as the default execution mechanism
4. Reserve live terminal for advanced interactive sessions
5. Treat browser-local runtime as an optional differentiator

The most important rule is:

Shothik chat should route by task economics and task type, not by novelty of
infrastructure.

## Final Recommendation

The winning architecture is not:

`chat -> powerful cloud model -> answer`

It is:

`chat -> Hermes policy engine -> cheapest valid lane -> durable result`

That is the path that is both scalable and economically viable.
