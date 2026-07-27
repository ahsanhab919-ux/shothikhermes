# Chat Deployment Topology And Rollout

## Purpose

This document turns the chat architecture, execution policy, and packaging
recommendations into a practical deployment model for Shothik.

It defines:

- where the major chat system components should run
- what should live on Cloudflare versus VPS/Docker infrastructure
- how to roll out Lane 2 sandbox execution and Lane 3 live terminal safely
- what not to build too early

## Related Documents

- `docs/CHAT_COST_EFFICIENT_SYSTEM_ARCHITECTURE.md`
- `docs/CHAT_EXECUTION_POLICY_AND_COST_MODEL.md`
- `docs/CHAT_PLAN_TIER_MATRIX.md`
- `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
- `docs/PRD.md`

## Deployment Thesis

The most cost-efficient deployment shape is:

- cheap control and admission at the edge
- orchestration in Hermes
- durable state in managed data systems
- execution on bounded VPS or dedicated worker nodes
- interactive terminal hosted separately from mainstream chat

The product should not treat every component as equally deployment-worthy on
day one.

## Recommended Topology

```text
Browser / App Client
    |
    v
Cloudflare Edge
    - Workers
    - rate limiting
    - auth validation
    - request shaping
    - SSE/WebSocket ingress
    |
    v
Hermes Core (VPS / Dockerized app boundary)
    - chat orchestrator
    - session/run/artifact manager
    - tool router
    - execution policy engine
    - streaming engine
    |
    +--> Redis / Upstash
    +--> Postgres
    +--> object storage
    +--> search / crawl adapters
    +--> local model node
    +--> sandbox pool
    +--> terminal host
```

## Component Placement

### 1. Browser / App Client

Runs in:

- the normal Shothik web app frontend

Responsibilities:

- chat surface
- transcript and event rendering
- attachment staging
- local cache / IndexedDB
- optional local runtime mode

Do not place here:

- final execution routing
- durable run authority
- high-trust policy decisions

### 2. Cloudflare Edge

Recommended services:

- Workers
- optional Durable Objects later
- optional Queues later

Responsibilities:

- auth validation
- token bucket/rate limiting
- abuse filtering
- SSE and WebSocket entrypoint
- lightweight request normalization
- geo-near ingress and protection

Do not place here:

- main workflow engine
- deep orchestration logic
- long-running code execution

### 3. Hermes Core

Runs in:

- Dockerized app service on VPS or stable backend host

Responsibilities:

- chat orchestration
- run/session/workspace ownership
- tool routing
- model routing
- execution lane choice
- artifact lifecycle
- event emission

Recommendation:

- keep Hermes inside the current deployment boundary first
- extract only when operational evidence justifies it

### 4. Redis

Runs in:

- Upstash or managed Redis

Responsibilities:

- hot state
- event replay support
- short-lived coordination
- rate limit support
- idempotency support

Recommendation:

- use managed Redis first
- avoid self-hosting Redis cluster until traffic truly demands it

### 5. Postgres

Runs in:

- managed Postgres or stable VPS-backed Postgres

Responsibilities:

- durable sessions
- runs
- artifacts
- execution accounting
- plan/quota tracking

Recommendation:

- this remains the durable system of record for the chat runtime

### 6. Object Storage

Runs in:

- R2 or equivalent object storage

Responsibilities:

- uploaded files
- generated exports
- execution logs when archived
- large artifact payloads

Recommendation:

- keep large files out of Postgres where possible

### 7. Local Model Node

Runs in:

- dedicated VPS or on-prem node with Ollama

Responsibilities:

- cheap inference
- fallback model serving
- cost-sensitive Lane 0 and Lane 1 requests

Recommendation:

- this should be separate from the main sandbox pool if possible
- avoid starving execution workloads with inference workloads

### 8. Sandbox Pool

Runs in:

- Docker or Firecracker execution workers on VPS or dedicated compute nodes

Responsibilities:

- Lane 2 execution
- short-lived Ubuntu environments
- code/shell runs
- file conversions and bounded CLI workflows

Recommendation:

- this should be the first serious execution expansion
- treat it as a pool, not as per-user always-on environments

### 9. Terminal Host

Runs in:

- separate host group or isolated containers for interactive terminal sessions

Responsibilities:

- Lane 3 live terminal
- `xterm.js` backend bridge
- `node-pty` session management
- long-lived interactive tty sessions

Recommendation:

- keep this separated from mainstream chat and sandbox nodes
- this avoids terminal traffic consuming the same capacity budget as general chat

## Cloudflare Mapping

### Use Workers for

- request ingress
- auth checks
- rate limiting orchestration
- lightweight routing decisions
- edge protection

### Use Durable Objects later for

- live presence state
- interactive session coordination
- possibly terminal session registry
- run presence and resumability helpers

Only introduce Durable Objects when session coordination complexity justifies
them. They are useful, but should not be added just because they sound neat.

### Use Queues or Workflows later for

- async job dispatch
- retries
- longer-running artifact workflows

These become more important after Lane 2 is proven.

## Recommended First Deployment Shape

### Day 1 shape

- Shothik frontend on current web deployment
- Hermes modules in the existing backend boundary
- managed Redis
- durable Postgres
- one Ollama node
- one small sandbox worker group
- no live terminal yet

This is the cheapest shape that still proves the architecture honestly.

### Day 2 shape

- more than one sandbox worker
- queue-backed execution scheduling
- stronger budget accounting
- artifact export and log retention

### Day 3 shape

- isolated live terminal host tier
- role-aware execution scheduling
- org-level quotas

## Lane 2 Rollout Plan

Lane 2 should come before Lane 3.

### Phase A: Internal-only execution

Goal:

- prove the sandbox path inside Hermes without customer exposure

Scope:

- run-scoped container creation
- command execution with output capture
- stdout/stderr streamed into Hermes events
- hard timeout and memory limits

Success criteria:

- stable run lifecycle
- event replay works
- execution logs are visible
- no silent hangs

### Phase B: Limited premium beta

Goal:

- expose bounded sandbox execution to a small paid/test cohort

Scope:

- quota controls
- plan gating
- bounded package/network policy
- artifact-aware outputs

Success criteria:

- sandbox usage stays within budget expectations
- users complete artifact workflows with it
- failure rate is acceptable

### Phase C: Pro general availability

Goal:

- make sandbox execution the mainstream premium execution feature

Scope:

- billing visibility
- better observability
- queue-backed scheduling
- stable downgrade behavior when quota is exhausted

Success criteria:

- Lane 2 drives premium value
- unit economics remain acceptable

## Lane 3 Rollout Plan

Lane 3 should be delayed until Lane 2 is healthy.

### Phase A: Internal admin and dev mode only

Goal:

- prove terminal session hosting and lifecycle management

Scope:

- `xterm.js` frontend
- `node-pty` backend bridge
- inactivity timeout
- session audit trail

Success criteria:

- stable terminal session lifecycle
- acceptable host isolation
- low interference with other workloads

### Phase B: Power-user beta

Goal:

- expose terminal to a narrow high-intent cohort

Scope:

- strict session limits
- explicit plan gating
- billing/usage visibility

Success criteria:

- terminal usage is rare but high-value
- most execution still stays in Lane 2

### Phase C: Dev / Power productization

Goal:

- make live terminal a deliberate advanced feature, not a general default

Scope:

- separate terminal host budget
- concurrency controls
- org or power-user policy support

Success criteria:

- Lane 3 remains premium and bounded
- does not distort mainstream infrastructure economics

## What Not To Build Too Early

Avoid these mistakes:

### 1. Do not deploy live terminal first

It is attractive, but it is the wrong first execution product.

### 2. Do not overbuild the vector/graph stack

Redis + Postgres + search + bounded retrieval are enough initially.

### 3. Do not pool all workloads on one host forever

Inference, sandbox execution, and terminal sessions have different cost and
latency patterns. They should separate as load grows.

### 4. Do not let Cloudflare become a second backend

Edge should guard, shape, and route lightly. Hermes should still own the
business runtime.

## Recommended Observability

Track at minimum:

- lane distribution
- per-lane failure rate
- sandbox cold-start time
- sandbox runtime distribution
- terminal session length
- model escalation rate
- cost per completed artifact-producing run

These metrics should decide when to scale workers or split infrastructure.

## Recommended Build Order

1. stabilize Hermes chat core
2. strengthen Lane 1 tool routing
3. deploy Lane 2 sandbox pool
4. add budget and quota enforcement to execution runs
5. add exportable/artifact-aware execution outputs
6. deploy Lane 3 terminal host
7. add browser-local mode as optional enhancement

## Final Recommendation

The right deployment strategy for Shothik chat is:

- Cloudflare for ingress and protection
- Hermes on VPS/Docker for orchestration
- managed Redis + durable Postgres for state
- separate Ollama and sandbox workers for execution
- separate terminal hosts only after Lane 2 is proven

That is the most cost-efficient path that still supports the full ambition of:

- cheap chat
- powerful tools
- metered execution
- premium interactive terminal
- optional local/private mode
