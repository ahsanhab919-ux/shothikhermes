# ADR-004: Product Plane And Ops Plane Separation

## Status

Accepted

## Date

2026-07-26

## Context

Hermes is evolving into a production SaaS platform with:

- user-facing chat and document workflows
- planner-driven tool orchestration
- multi-model execution
- MCP-backed external integrations
- persistent user memory and retrieval
- real-time workspace state

At the same time, there is a parallel need for:

- autonomous engineering task execution
- issue-tracker-driven coding workflows
- isolated repo workspaces per task
- bounded concurrency and retry handling for long-running coding-agent runs
- operational visibility into background engineering work

The OpenAI `Symphony` specification is strong for the second category. It defines:

- tracker polling
- per-issue workspace isolation
- workflow policy in `WORKFLOW.md`
- orchestration of coding-agent sessions
- retries, reconciliation, and structured observability

However, Symphony is not designed to be the primary runtime for:

- low-latency user chat turns
- multi-tenant product traffic
- authenticated end-user MCP authorization
- user/session memory ownership
- request-driven model routing
- billing and quota enforcement

This repository already established two architectural constraints:

- `ADR-002` keeps Hermes as a modular monolith until contracts stabilize
- `ADR-003` makes `app/api` a gateway, not the workflow engine

We need a binding decision for where Symphony fits and how Hermes should be partitioned operationally.

## Decision

Hermes will be split conceptually into two planes:

1. `Product Plane`
2. `Ops Plane`

Symphony will be adopted only in the `Ops Plane`, not as the primary orchestrator for the `Product Plane`.

## Product Plane

The Product Plane serves end users and owns runtime product behavior.

It includes:

- Next.js frontend surfaces
- API gateway routes
- Hermes planner
- workflow execution for user-facing tasks
- model routing
- MCP authorization and runtime connector usage
- user/session/workspace state
- memory and retrieval
- streaming response delivery
- billing, quotas, and policy enforcement

The Product Plane is request-driven.

Its primary flow is:

```text
User
  -> Frontend
  -> API Gateway
  -> Hermes Planner / Domain Module
  -> Capability Resolution
  -> Model Router and/or Tool Router
  -> MCP Connectors / Retrieval / Persistence
  -> Streamed or synchronous response
```

## Ops Plane

The Ops Plane serves internal automation and engineering execution.

It includes:

- issue-tracker polling
- autonomous coding-agent execution
- per-task isolated workspaces
- repo-owned workflow policy via `WORKFLOW.md`
- retry and reconciliation loops
- engineering run observability
- tracker/PR-oriented handoff workflows

The Ops Plane is backlog-driven.

Its primary flow is:

```text
Issue Tracker
  -> Symphony
  -> Workspace Manager
  -> Coding Agent Session
  -> Repo / CI / PR / Tracker updates
```

## Service Boundary Rules

### Product Plane MUST own

- end-user auth context
- conversation and workspace lifecycle
- planner decisions for product tasks
- MCP consent and permission enforcement
- user memory and retrieval policy
- model selection policy for product execution
- product-facing streaming contracts
- billing, quotas, and abuse controls

### Ops Plane MUST own

- tracker polling cadence
- per-issue workspace lifecycle
- coding-agent run retries and reconciliation
- engineering workflow prompts in `WORKFLOW.md`
- task-level coding automation observability

### Ops Plane MUST NOT own

- end-user chat sessions
- customer memory state
- user-facing MCP account linking
- product request routing
- transport-layer gateway concerns

### Product Plane MUST NOT depend on Symphony for synchronous request handling

User-facing routes must continue to execute through Hermes-owned contracts. A production chat turn must not require issue-tracker polling, per-issue workspace setup, or Symphony scheduler state.

## Deployment Topology

### Near-term target

Hermes remains a modular monolith for the Product Plane inside `shothik-web-mirror-v2`.

Near-term deployables:

1. `web`
   - Next.js app
   - API gateway
   - Hermes modules running in-process

2. `postgres`
   - primary relational store

3. `redis`
   - cache, queues, ephemeral coordination

4. `vector-store`
   - `pgvector` initially, or later a dedicated vector database if retrieval load justifies separation

5. `object-storage`
   - R2 or S3-compatible storage for artifacts and documents

6. `symphony-ops` (separate service when introduced)
   - issue-tracker reader
   - workspace runner
   - coding-agent scheduler

### Long-term target

```text
                +----------------------+
                |   Product Plane      |
                |  Next.js + Hermes    |
                +----------+-----------+
                           |
          +----------------+----------------+
          |                |                |
       Postgres          Redis         Vector / RAG
          |                                 |
          +---------------+-----------------+
                          |
                     Object Storage

                +----------------------+
                |      Ops Plane       |
                |  Symphony Service    |
                +----------+-----------+
                           |
                 Issue Tracker / Git / CI
```

## Data Ownership

### Product Plane data

- users
- auth/session state
- conversations
- messages
- workspaces
- runs
- artifacts
- MCP connection metadata
- usage, billing, quotas
- retrieval metadata

This data belongs to Hermes modules and follows the ownership rules in `ADR-001` and `ADR-002`.

### Ops Plane data

Symphony SHOULD remain lightweight and SHOULD prefer:

- tracker state from the source tracker
- local filesystem workspaces
- local structured logs
- restart recovery from tracker/filesystem state

Symphony SHOULD NOT become the source of truth for product conversation or artifact state.

If Ops Plane metadata later needs persistence, it should live in clearly separated tables or stores with explicit ownership, not in Product Plane tables by convention.

## Auth And Secret Boundaries

### Product Plane

Product auth remains user-centric:

- Insforge-authenticated user identity
- route-level auth and rate limiting
- MCP user consent and token vaulting
- domain authorization enforced in Hermes contracts

### Ops Plane

Ops auth remains system-centric:

- tracker credentials
- repo access credentials
- CI / SCM bot permissions
- coding-agent runtime credentials

Host-side secrets used by Symphony or coding agents MUST NOT be treated as equivalent to end-user tokens.

The Product Plane and Ops Plane MUST keep:

- separate secret scopes
- separate audit trails
- separate permission models

## Contract Model

### Planner contract

Hermes planner reasons about capabilities and product intent, not tracker polling.

Planner inputs:

- user identity and policy context
- conversation state
- workspace state
- retrieved memory/context
- tool availability and permission context

Planner outputs:

- execution plan
- capability requirements
- routing hints
- artifact intents

### Capability resolution contract

Hermes plans against capabilities first, then resolves to concrete tools or models.

Examples:

- `chat.respond`
- `reasoning.plan`
- `document.ingest`
- `code.search`
- `github.read`
- `gmail.send`
- `workspace.patch`

### Model router contract

Model selection must be delegated to a model router rather than hardcoded inside feature routes.

Routing inputs:

- task type
- latency target
- privacy class
- cost policy
- multimodal needs
- fallback policy

Routing outputs:

- selected provider/model
- execution parameters
- fallback chain

### MCP contract

MCP must be split logically into:

1. `MCP Control Plane`
   - account linking
   - OAuth/token lifecycle
   - consent records
   - tool availability
   - health and policy

2. `MCP Execution Plane`
   - runtime tool invocation
   - parameter validation
   - permission checks
   - audit emission

Symphony MAY use provider-native tools for engineering tasks, but those integrations must not replace the Product Plane MCP permission model.

## Consequences

### Positive

- keeps user-facing runtime fast and request-driven
- allows Symphony adoption without distorting chat architecture
- preserves clean secret and permission boundaries
- gives engineering automation its own operating model
- supports later extraction without rewriting core product contracts

### Negative

- introduces a second operational plane to manage
- requires discipline to avoid leaking product concerns into Ops automation
- may duplicate some observability and queueing patterns across planes

## Rejected Alternatives

### 1. Make Symphony the primary product orchestrator

Rejected because Symphony is optimized for tracker-driven coding workflows, not multi-tenant low-latency product traffic.

### 2. Collapse product runtime and engineering automation into one scheduler

Rejected because the trust model, latency profile, state ownership, and auth model are materially different.

### 3. Delay Symphony entirely until after full microservice extraction

Rejected because the repo can benefit from Symphony patterns and a separate ops runner before the Product Plane is fully decomposed.

## Immediate Implementation Impact

1. Keep `/api/chat` and related user-facing routes on Hermes-owned contracts.
2. Continue modularizing:
   - planner
   - provider/model router
   - tool registry / tool router
   - memory / retrieval
   - domain orchestrators
3. Introduce capability-first contracts for planner outputs.
4. Treat MCP as a product platform concern with explicit consent boundaries.
5. Prepare a separate `symphony-ops` service only for backlog-driven engineering automation.

## Migration Plan

### Phase 1: Product Plane hardening

- stabilize chat route behavior
- finish provider abstraction and model router extraction
- formalize capability registry and tool routing contracts
- tighten memory ownership and retrieval boundaries
- keep all user-facing traffic inside current Hermes runtime

### Phase 2: MCP platform split

- define MCP control-plane storage and APIs
- separate connector authorization from runtime execution
- add audit and permission enforcement around tool usage

### Phase 3: Ops Plane bootstrap

- stand up a separate Symphony deployment
- target one tracker integration first
- use repo-owned `WORKFLOW.md`
- run engineering automation against isolated workspaces only

### Phase 4: Cross-plane integration

- expose approved internal APIs for status handoff from Ops to Product surfaces if needed
- keep data contracts one-way and explicit
- avoid direct table sharing between planes

## Related ADRs

- `ADR-001` - run, artifact, and event contract
- `ADR-002` - Hermes modular-monolith boundaries
- `ADR-003` - API gateway to Hermes integration rules
