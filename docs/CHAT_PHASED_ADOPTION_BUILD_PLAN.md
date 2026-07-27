# Chat Phased Adoption And Build Plan

## Objective

Improve Shothik chat by adopting the strongest LibreChat-style patterns that fit our existing stack without rewriting the app around a different database, server framework, or deployment model.

Core rule:

- adapt architecture patterns
- preserve the current Next.js + Hermes + Convex + Insforge backbone

## Adoption decision

### Adapt now

- provider abstraction and model routing
- thin gateway plus backend-owned orchestration
- stronger session and sync resilience
- operational diagnostics and load validation
- privacy-aware chat contracts

### Adapt later

- richer retrieval and tool capability registry
- BYOK-backed encrypted sync
- deeper multi-device reconciliation
- deployment decomposition for heavy inference and retrieval services

### Do not copy directly

- MongoDB persistence model
- Express plus separate client split
- full LibreChat repo structure

## Phase plan

## Phase 1 - Provider Runtime Seam

Status: `in progress`

Goal:

- remove chat provider coupling from `ChatOrchestrator`
- make chat model selection explicit and extensible
- preserve the current streaming UX while preparing for more providers

Deliverables:

- dedicated chat provider adapter module
- normalized provider/model-handle resolution
- provider-specific streaming parsers
- regression coverage for provider selection and transport parsing

Success criteria:

- `ChatOrchestrator` no longer contains raw provider-specific request construction
- bare handles still work for Gemini
- explicit handles like `openai/gpt-4o-mini` are routable
- current Gemini chat flow remains green

## Phase 2 - Session And Sync Resilience

Status: `planned`

Goal:

- make authenticated chat recovery and multi-device reconciliation stable

Deliverables:

- stronger `/api/chat/sync` usage in the flagship client
- clearer session ownership and resume rules
- browser-proof acceptance flow for login -> chat history -> real turn

Success criteria:

- authenticated `/agents/chat` remains mounted after hydration
- conversation history survives reload and device switches
- one real browser chat turn is proven end to end

## Phase 3 - Retrieval And Workspace Context

Status: `planned`

Goal:

- improve grounded answers without bloating the base chat path

Deliverables:

- retrieval policy registry by workflow and intent
- cleaner document-ingestion to chat handoff
- workspace/artifact context selection rules

Success criteria:

- chat can distinguish plain answer turns from grounded retrieval turns
- document-backed turns carry explicit retrieval metadata
- retrieval logic stays behind Hermes service seams

## Phase 4 - Privacy And Encrypted Sync

Status: `planned`

Goal:

- align chat storage and synchronization with privacy commitments

Deliverables:

- privacy-mode enforcement across message previews and sync
- BYOK key-management flow for encrypted sync envelopes
- audit-ready privacy behaviors for sensitive turns

Success criteria:

- sensitive previews are minimized consistently
- encrypted sync works across devices with a user-controlled key
- privacy behavior is documented and test-covered

## Phase 5 - Scale, Ops, And Delivery Hardening

Status: `planned`

Goal:

- make the chat platform operationally reliable under growth

Deliverables:

- load scenarios for chat, sync, and authenticated session flows
- admin and health scripts for chat persistence and provider readiness
- rollout checklist for inference and retrieval service separation

Success criteria:

- repeatable load evidence exists for chat core paths
- provider and persistence failures are diagnosable without code spelunking
- deployment boundaries are explicit

## Phase 1 start record

This phase starts with provider modularization because it unlocks later improvements without destabilizing the current chat product:

1. extract provider transport into a dedicated module
2. normalize model-handle parsing and selection
3. keep the API route thin and Hermes-owned
4. validate Gemini compatibility and add explicit multi-provider tests

## Current next step after Phase 1

- continue with authenticated browser proof on `/agents/chat`
- then start Phase 2 session and sync resilience work
