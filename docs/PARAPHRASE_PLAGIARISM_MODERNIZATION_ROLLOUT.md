# Paraphrase And Plagiarism Modernization Rollout

## Scope

This document tracks the modernization rollout for the two highest-friction legacy surfaces:

- paraphraser
- plagiarism checker

## Current Status

### Phase 1: Paraphraser

Implemented in the current branch:

- feature-flagged simplified output panel
- inline status chips
- inline retry and error messaging
- Writing Studio handoff support
- client-side error logging with contextual metadata

Feature flag:

- `NEXT_PUBLIC_ENABLE_PARAPHRASE_SIMPLIFIED`
- default behavior in code: enabled unless explicitly set to `"false"`

Rollback:

- set `NEXT_PUBLIC_ENABLE_PARAPHRASE_SIMPLIFIED=false`
- redeploy the web app
- the legacy paraphrase output flow remains intact behind the flag

### Phase 2: Plagiarism Checker

Not implemented yet in this pass.

Planned next:

- inline right-side result panel
- originality badge
- inline failure treatment
- shared design-token alignment with paraphraser

## Logging

Paraphraser inline errors currently log client-side context through the existing app logger with:

- scope
- user id where available
- input length
- browser user agent
- timestamp

## Testing

Implemented in this pass:

- helper unit tests for paraphrase inline error normalization
- shared Writing Studio handoff tests
- full `apps/web` type-check and test suite validation

Not yet implemented in repo:

- Cypress E2E coverage for paraphrase/plagiarism flows
- Lighthouse CI gate
- design-file export from Figma

These remain follow-up deliverables because the current repository does not already include Cypress or Lighthouse CI wiring.

## Definition Of Done Tracking

### Completed now

- simplified paraphraser output path exists
- inline status/error messaging exists
- rollback path exists through feature flag
- regression validation is green

### Pending

- plagiarism checker redesign
- performance verification against Lighthouse CI target
- FullStory-based completion-time measurement
- 7-day telemetry review before flag removal
