# ADR-001: Run, Artifact, And Event Contract

## Status

Accepted

## Date

2026-07-23

## Context

The current repository already supports multiple AI-capable surfaces:

- chat
- writing tools
- book writing and publishing
- slides
- sheets
- research
- AI detector
- plagiarism checker

However, these domains do not share one stable execution contract.

Current issues observed in the repo:

- chat persistence is stronger and more explicit than several other AI surfaces
- slides rely on separate generation and SSE service contracts
- sheets rely on separate session/history and stream models
- report-like outputs are not uniformly modeled as persistent artifacts
- event shapes differ across product surfaces

This fragmentation makes it difficult to:

- show one consistent progress UI
- resume work after refresh or navigation
- preserve artifact identity across runs
- reuse workflow infrastructure across domains

## Decision

Shothik will adopt a canonical workspace execution model built around:

- `workspace`
- `run`
- `artifact`
- `artifact_version`
- `checkpoint`
- `run_event`

Every serious AI action must create or update a `run`.

Every serious output must become or update an `artifact`.

Every user-visible workflow must emit canonical `run_event` records.

## Canonical Concepts

### Workspace

A durable container that groups:

- runs
- artifacts
- navigation context
- handoff context

### Run

A single AI execution lifecycle.

Required fields:

- `id`
- `workspace_id`
- `entry_surface`
- `artifact_type`
- `artifact_id`
- `intent`
- `status`
- `current_step`
- `initiated_by_user_id`
- `started_at`
- `completed_at`
- `failed_at`
- `error_code`
- `error_message`
- `resume_token`

### Artifact

A durable output object independent from any single execution.

Required fields:

- `id`
- `workspace_id`
- `type`
- `title`
- `status`
- `owner_user_id`
- `latest_version_id`
- `source_run_id`
- `metadata`
- `created_at`
- `updated_at`

### Artifact Version

A saved revision of an artifact.

Required fields:

- `id`
- `artifact_id`
- `version_number`
- `change_summary`
- `snapshot_ref` or `payload`
- `created_by`
- `created_at`

### Checkpoint

A resumable snapshot for long-running workflows.

Required fields:

- `id`
- `run_id`
- `artifact_id`
- `checkpoint_type`
- `state_ref`
- `created_at`

### Run Event

A structured execution signal used for:

- UI progress
- observability
- replay
- failure diagnosis

Required fields:

- `id`
- `run_id`
- `seq`
- `timestamp`
- `type`
- `status`
- `label`
- `message`
- `tool_name`
- `artifact_type`
- `artifact_id`
- `payload`

## Canonical Run Statuses

Initial allowed statuses:

- `created`
- `planning`
- `running`
- `waiting_input`
- `paused`
- `completed`
- `failed`
- `stopped`

These statuses are global. Domain modules may maintain finer internal states, but user-facing lifecycle state must map to this canonical set.

## Canonical Event Types

Initial allowed event types:

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

## Event Envelope

All streamable workflows must converge on this envelope shape:

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

## Artifact-First Rule

The following domains are artifact-first by default:

- writing
- books
- slides
- sheets
- research
- AI detector
- plagiarism

That means:

- a completed workflow is not “just a response”
- it must create or update an artifact record
- the artifact must be reopenable independent of the original stream

## Non-Artifact Rule

Some platform interactions are not artifacts by default:

- navigation events
- transient validation checks
- lightweight assistant clarifications

These may still create runs, but they do not always create artifacts.

## Storage Decision

The canonical records will live in PostgreSQL.

Supporting stores:

- Redis for queue and stream coordination
- Blob storage for large payloads, exports, and snapshots
- Vector DB for retrieval memory where justified

## Consequences

### Positive

- one progress system across domains
- one resume model across domains
- one artifact identity model across domains
- clearer backend ownership
- better observability and auditability

### Negative

- existing slide and sheet contracts need adapters
- some current feature code will look redundant during migration
- teams must stop inventing per-feature event vocabularies

## Rejected Alternatives

### 1. Keep Feature-Specific Contracts

Rejected because:

- it preserves current fragmentation
- it makes cross-tool handoff harder
- it keeps the frontend responsible for orchestration semantics

### 2. Model Only Artifacts, Not Runs

Rejected because:

- it hides the actual workflow lifecycle
- it weakens progress, recovery, and debugging
- it does not help with live execution visibility

### 3. Model Only Runs, Not Artifacts

Rejected because:

- users need durable outputs, not only execution logs
- editing, export, reuse, and publishing need persistent artifact identity

## Implementation Impact

Immediate targets for migration under this ADR:

1. chat run bootstrap
2. slide run and event normalization
3. sheet run and event normalization
4. writing and research artifact convergence

## Supersedes

None
