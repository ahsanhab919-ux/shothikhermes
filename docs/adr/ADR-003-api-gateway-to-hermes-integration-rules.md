# ADR-003: API Gateway To Hermes Integration Rules

## Status

Accepted

## Date

2026-07-23

## Context

The current `app/api` layer in `shothik-web` contains a mix of responsibilities:

- authentication and validation
- provider calls
- workflow orchestration
- stream assembly
- persistence updates
- domain state transitions

This makes the route layer too heavy and couples frontend deployment concerns to AI orchestration behavior.

As Hermes is introduced, the project needs a strict integration rule so route handlers become a gateway rather than a second backend.

## Decision

`app/api` will become an API gateway layer in front of Hermes.

Route handlers may:

- authenticate and authorize
- validate request shape
- enforce idempotency and rate limits
- translate HTTP requests into Hermes commands or queries
- proxy or relay streams from Hermes
- shape transport-level responses

Route handlers may not:

- contain multi-step workflow logic
- decide tool orchestration policy
- mutate artifact state directly except through Hermes contracts
- encode domain state machines
- call model providers directly for core product workflows once Hermes ownership exists

## Integration Pattern

## Command Flow

For mutations and workflow starts:

```text
Client
  -> Next.js Route Handler
  -> Gateway Auth / Validation / Idempotency
  -> Hermes Command
  -> Hermes Module Execution
  -> Gateway Response
```

## Query Flow

For reads:

```text
Client
  -> Next.js Route Handler
  -> Gateway Auth / Validation
  -> Hermes Query
  -> Gateway Response
```

## Stream Flow

For live execution:

```text
Client
  -> Next.js Route Handler
  -> Hermes Stream Subscription
  -> Gateway Relay
  -> Client Timeline UI
```

## Required Gateway Responsibilities

### Authentication And Authorization

- identify user or system caller
- enforce surface-level access checks
- pass identity and policy context into Hermes

### Validation

- validate transport payloads
- normalize request formats
- reject malformed requests before Hermes execution

### Idempotency

- apply idempotency keys to mutation and payment-sensitive routes
- prevent duplicate workflow starts where required

### Rate Limiting

- keep abuse controls at the edge
- avoid burdening Hermes with transport abuse handling

### Stream Relay

- forward canonical Hermes events
- avoid rewriting domain semantics
- only adapt transport format where necessary

## Forbidden Gateway Behavior

The gateway must not:

- build slide plans
- manage sheet generation lifecycle
- coordinate research tool chains
- decide when a run is complete or failed
- create artifact versions by hand
- assemble long-lived workflow state in route-local memory

## Contract Style

Gateway-to-Hermes contracts should be explicit.

### Commands

Examples:

- `CreateRun`
- `ResumeRun`
- `StopRun`
- `CreateArtifact`
- `ApplyArtifactPatch`
- `CreateArtifactVersion`
- `StartSlideGeneration`
- `StartSheetGeneration`
- `StartResearchRun`

### Queries

Examples:

- `GetRun`
- `ListRunsForWorkspace`
- `GetArtifact`
- `ListArtifactsForWorkspace`
- `GetArtifactVersions`
- `GetRunTimeline`

### Stream Subscription

Example:

- `SubscribeRunEvents(runId)`

## Error Handling Rule

Gateway errors should be transport-focused.

Examples:

- invalid input
- unauthorized
- rate-limited
- idempotency conflict

Hermes errors should be domain-focused.

Examples:

- artifact not found
- run already completed
- unsupported transition
- tool unavailable
- export failed

The gateway may map Hermes domain errors into HTTP status codes, but it must not erase domain meaning.

## Migration Rule

During migration, some routes will temporarily bridge legacy logic.

This is allowed only if:

1. the route clearly acts as an adapter
2. the business logic is being moved behind an interface
3. no new feature-specific orchestration is introduced in the route layer

In other words:

- temporary adapters are allowed
- new orchestration debt is not

## Consequences

### Positive

- route handlers become thinner and easier to test
- orchestration logic becomes reusable
- frontend deployment and workflow behavior are cleanly separated
- streaming UX can normalize over one event contract

### Negative

- more interfaces must be defined up front
- some existing route code will need significant refactoring
- temporary adapters will exist during the migration window

## Rejected Alternatives

### 1. Let Routes Keep Owning Domain Logic

Rejected because:

- it recreates the current problem
- it prevents true orchestration reuse
- it blurs presentation and backend boundaries

### 2. Let UI Call Hermes Modules Directly

Rejected because:

- transport, auth, and edge concerns still need a gateway
- the app shell needs a stable boundary
- route-level controls such as idempotency and rate limiting remain valuable

### 3. Use The Gateway As A “Mini-Orchestrator”

Rejected because:

- it creates two competing orchestration layers
- teams will keep encoding feature rules in routes
- it slows convergence on Hermes ownership

## Immediate Implementation Impact

The first routes that should follow this rule are:

1. chat
2. slide generation
3. sheet generation
4. research chat
5. book run start

These routes currently contain the most visible orchestration burden or are closest to the launch slice.

## Supersedes

None
