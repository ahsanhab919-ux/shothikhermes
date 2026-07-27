# ADR-005: Capability Registry And Model Router Contracts

## Status

Accepted

## Date

2026-07-26

## Context

The current Hermes direction already establishes:

- `ADR-002`: Hermes remains a modular monolith with strong internal boundaries
- `ADR-003`: `app/api` is a gateway, not the workflow engine
- `ADR-004`: Product Plane and Ops Plane are separate, with Symphony reserved for the Ops Plane

What remains under-specified is the runtime contract between:

- the Hermes planner
- tool and model selection
- MCP-backed capabilities
- provider execution gateways

Without a formal contract, two failure modes are likely:

1. feature modules hardcode model/provider choices directly
2. planner outputs become ad hoc instructions instead of stable routing contracts

This repository already has a provider abstraction direction in the chat orchestrator, but the architecture now needs a general decision that works across:

- chat
- research
- writing
- document intelligence
- future agent workflows

At the same time, `9router` is a strong fit as an execution-layer model gateway because it already provides:

- multi-provider routing
- fallback chains
- quota tracking
- multi-account rotation
- protocol normalization
- OpenAI-compatible transport
- cost and token optimization behavior

However, `9router` is not the policy brain of Hermes. It does not own:

- product billing tier rules
- user privacy classes
- workspace/domain policy
- artifact-level execution intent
- MCP permission context
- canonical run/session observability in Hermes

We therefore need a binding contract that separates:

- planner intent
- capability resolution
- routing policy
- provider execution

## Decision

Hermes will introduce two explicit runtime contracts:

1. `Capability Registry`
2. `Model Router`

`9router` is approved as an execution backend for the `Model Router`, but it will not replace Hermes routing policy.

The authoritative runtime flow is:

```text
User / Gateway
  -> Hermes Planner
  -> Capability Resolution
  -> Hermes Model Router Policy
  -> 9router or direct provider adapter
  -> Model Provider
```

## Capability Registry

The Capability Registry is the planner-facing catalog of what Hermes can do.

It defines:

- capability identifiers
- capability type
- required auth / permission context
- required input shape
- execution hints
- supported domains
- tool or model dependencies

The planner MUST reason in terms of capabilities first, not raw providers or raw MCP tools.

### Capability categories

At minimum, capabilities should cover:

- `conversation.respond`
- `reasoning.plan`
- `reasoning.deep`
- `vision.analyze`
- `speech.transcribe`
- `speech.synthesize`
- `embedding.generate`
- `retrieval.search`
- `document.ingest`
- `document.summarize`
- `workspace.patch`
- `github.read`
- `github.write`
- `gmail.send`
- `database.query`

These are examples, not a closed list.

### Capability ownership rules

Each capability entry MUST declare:

- owning Hermes module
- whether it is fulfilled by:
  - model execution
  - MCP tool execution
  - internal domain service
  - hybrid execution
- whether user consent is required
- whether elevated billing or policy checks are required

### Capability Registry responsibilities

The registry MUST:

- expose typed metadata for planner and routing use
- distinguish abstract abilities from concrete tools
- support domain-level policy checks
- support future extraction without changing planner semantics

The registry MUST NOT:

- make live provider calls
- store raw OAuth secrets
- become a hidden execution engine

## Model Router

The Model Router is the policy and execution-selection layer for model-backed capabilities.

It exists between planner intent and provider transport.

The Model Router is responsible for choosing:

- model class
- provider
- endpoint/backend
- fallback chain
- cost lane
- timeout profile
- streaming behavior

The Model Router MUST support:

- task-type-aware routing
- latency-aware routing
- cost-aware routing
- privacy-aware routing
- multimodal routing
- fallback behavior
- observability tags that map back to Hermes runs and sessions

## Router policy inputs

The Model Router policy must be able to evaluate:

- `capability`
- `domain`
- `task_type`
- `user_plan`
- `workspace_policy`
- `privacy_class`
- `latency_target`
- `cost_policy`
- `streaming_required`
- `multimodal_requirements`
- `fallback_allowed`

Optional future inputs may include:

- region or data residency
- provider health snapshots
- experiment flags
- customer-specific allowlists

## Router outputs

The Model Router output MUST be explicit and structured.

Example fields:

- `route_id`
- `capability`
- `selected_backend`
- `selected_provider`
- `selected_model`
- `reason`
- `fallback_chain`
- `request_transforms`
- `max_tokens_policy`
- `streaming_mode`
- `observability_labels`

## 9router position

`9router` will be treated as a `Model Router Backend`, not as the full routing authority.

### 9router SHOULD be used for

- multi-provider execution
- provider fallback
- quota exhaustion handling
- multi-account rotation
- transport normalization
- token-saving request transformations where acceptable

### 9router MUST NOT be treated as the source of truth for

- product plan enforcement
- workspace/domain policy
- privacy classification
- consent or user authorization
- canonical run metadata
- planner-visible capability semantics

### Hermes responsibilities when using 9router

Hermes remains responsible for:

- selecting the route policy
- deciding whether 9router is allowed for a request
- attaching run/session metadata
- enforcing billing and product-tier rules
- redacting or blocking traffic for restricted privacy classes
- deciding when to bypass 9router for direct-provider execution

### Direct provider path

Hermes MAY use direct provider adapters when:

- a provider feature is not supported by `9router`
- privacy policy forbids gatewaying through `9router`
- a regulated route requires a narrower trust boundary
- latency or streaming semantics require direct transport control

This means the Model Router backend interface must support at least:

1. `9router`
2. direct provider adapters

## Relationship to MCP

The Capability Registry and Model Router are related but separate from MCP.

### Capability Registry vs MCP

- Capability Registry = abstract planner-facing ability catalog
- MCP = concrete external tool execution mechanism

Not every capability is fulfilled by MCP.
Not every MCP tool should be directly exposed to the planner as a first-class capability.

### Model Router vs MCP

The Model Router selects model execution paths.
It does not authorize external tools or user-linked connectors.

Tool selection for MCP-backed capabilities should happen through Hermes tool-routing logic after capability resolution and permission checks.

## Module boundaries

The following Hermes module responsibilities are now explicit.

### Planner

Owns:

- intent understanding
- decomposition
- capability requests
- execution intent

Must not:

- hardcode provider names in feature logic
- call `9router` directly
- invoke MCP tools directly without tool-routing contracts

### Capability Registry

Owns:

- capability definitions
- metadata and policy hints
- planner-facing lookup

Must not:

- execute models
- execute tools

### Model Router

Owns:

- route policy evaluation
- backend selection
- fallback construction
- model execution metadata

Must not:

- interpret end-user OAuth grants
- act as the gateway layer
- own artifact transitions

### Tool Router

Owns:

- concrete tool selection
- MCP execution path
- permission and consent gates

Must not:

- choose model backends for model-only capabilities

## Observability contract

Every routed model execution MUST emit enough metadata to attach results to Hermes runtime state.

Minimum observability fields:

- `run_id`
- `session_id`
- `workspace_id`
- `capability`
- `domain`
- `route_id`
- `backend`
- `provider`
- `model`
- `fallback_depth`
- `input_token_estimate` or actual input tokens
- `output_token_estimate` or actual output tokens
- `latency_ms`
- `error_class` when failed

If `9router` is used, Hermes should preserve both:

- Hermes route metadata
- backend-reported provider execution metadata when available

## Security and privacy rules

The Model Router must support privacy classes, at minimum:

- `standard`
- `sensitive`
- `restricted`

Example policy implications:

- `standard`: may use approved gateway backends such as `9router`
- `sensitive`: may use a reduced provider set and stricter logging
- `restricted`: may require direct provider execution or explicit deny

These policies are implementation-defined but MUST be documented and enforced consistently.

## Consequences

### Positive

- planner contracts become stable and implementation-independent
- provider choices no longer leak into feature modules
- `9router` can be adopted without surrendering product policy control
- model routing becomes observable and testable
- future provider/backend changes stay behind one interface

### Negative

- introduces another internal contract to implement
- requires discipline to keep planner, router, and tool selection separate
- some current chat-specific provider abstractions may need refactoring into more general modules

## Rejected Alternatives

### 1. Let each feature module choose its own provider

Rejected because it fragments policy, observability, and fallback behavior.

### 2. Let 9router become the whole model-routing brain

Rejected because product policy, billing, privacy, and run observability belong to Hermes.

### 3. Expose raw MCP tools directly to the planner as the main abstraction

Rejected because planners should work with stable capabilities, not provider- or connector-shaped mechanics.

## Immediate Implementation Impact

1. Extract a planner-facing capability schema.
2. Add a `model-router` module in Hermes.
3. Define a backend interface for:
   - `9router`
   - direct provider adapters
4. Move model selection policy out of feature modules and route handlers.
5. Tag routed executions with Hermes run/session metadata.

## Migration Plan

### Phase 1

- formalize capability names for chat and research
- wrap current chat provider selection behind a `model-router` interface

### Phase 2

- implement `9router` backend adapter
- support fallback and route tagging

### Phase 3

- expand capability coverage to writing, document intelligence, and multimodal flows
- align tool-router and MCP contracts with the capability registry

### Phase 4

- add policy packs for billing tiers, privacy classes, and workspace/domain restrictions

## Related ADRs

- `ADR-002` - Hermes modular-monolith boundaries
- `ADR-003` - API gateway to Hermes integration rules
- `ADR-004` - Product Plane and Ops Plane separation
