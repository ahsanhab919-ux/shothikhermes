# Chat-Driven Document Intelligence Blueprint

## Status

Draft

## Date

2026-07-25

## Purpose

Define how Shothik should turn chat into the front door for document intelligence while keeping Hermes as the backend runtime and preserving the current frontend shell.

This blueprint covers the product flow:

`chat -> document pipeline -> artifact -> editor/canvas -> export`

It is intentionally repo-aligned with:

- `docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md`
- `docs/CHAT_HERMES_MIGRATION_ANALYSIS.md`
- `docs/adr/ADR-002-hermes-modular-monolith-boundaries.md`

## Thesis

The opportunity is not "PDF editing."

The opportunity is:

`PDF -> editable structured semantic object`

In Shothik terms, this means uploaded documents should stop behaving like dead files and start behaving like durable, AI-operable artifacts that can be:

- understood
- restructured
- redesigned
- transformed
- cited
- exported

Chat should initiate and supervise that lifecycle, but the actual editable work surface should live in the artifact/editor layer, not inside the transcript alone.

## Product Rule

### Chat Is The Entry Point, Not The Final Surface

Chat should handle:

- upload intent
- user instructions
- progress streaming
- clarifications
- transformation requests
- artifact handoff

The editor/canvas surface should handle:

- block editing
- layout changes
- design refinement
- structured review
- export preparation

That keeps the product shape:

`Chat -> Hermes pipeline -> Artifact -> Editor -> Export`

## Why This Fits Shothik

Shothik already sits naturally in:

- writing
- research
- academic workflows
- reasoning
- publishing
- artifact production

So document intelligence is not a side feature. It is a direct expansion of the platform's core value.

## Core Technical Decision

Do not model the pipeline as:

`PDF -> plain text`

Model it as:

`PDF -> multimodal structured document AST`

That AST should become the source of truth for:

- semantic structure
- layout structure
- style metadata
- page coordinates
- citations and references
- asset anchors
- editable intent

The canvas/editor should be a projection over the AST, not the source of truth itself.

## Canonical Entities

This capability should extend the existing Hermes runtime entities instead of inventing a parallel system.

### Existing Canonical Runtime Entities

- `Workspace`
- `Session`
- `Run`
- `Event`
- `Artifact`

### New Document-Specific Entities

- `DocumentSource`
- `DocumentAST`
- `DocumentBlock`
- `DocumentReference`
- `DocumentStyleToken`
- `DocumentExportJob`

## End-To-End Flow

### 1. Chat Entry

User actions:

- upload PDF
- paste URL to a document
- ask for notes, summary, slides, redesign, extraction, or export

System behavior:

- chat creates or resumes a Hermes session
- chat creates a document-oriented run
- chat streams ingestion and reconstruction progress
- chat creates or updates a durable artifact

### 2. Document Pipeline

Hermes executes:

- ingestion
- structure reconstruction
- semantic understanding
- design reconstruction
- transformation
- export preparation

### 3. Artifact Handoff

Chat returns:

- artifact card
- run status
- source summary
- next recommended actions

The user opens:

- document editor
- canvas editor
- slide editor
- export panel

### 4. Editor Loop

User can:

- edit blocks
- request AI refinements from the artifact surface
- go back to chat for higher-level instructions

## Hermes Module Plan

These modules fit the current modular-monolith direction and should live under `lib/hermes/modules/`.

### 1. `document-ingestion-orchestrator`

Responsibilities:

- upload intake coordination
- scanned-vs-digital detection
- OCR routing
- page image extraction
- source asset capture

### 2. `document-structure-engine`

Responsibilities:

- reading order
- heading hierarchy
- table and figure detection
- form region detection
- page block segmentation
- source coordinate mapping

### 3. `semantic-reconstruction-engine`

Responsibilities:

- section role inference
- document type classification
- claim/evidence/reference graph extraction
- citation and bibliography extraction
- academic metadata extraction

### 4. `design-reconstruction-engine`

Responsibilities:

- typography inference
- spacing and rhythm reconstruction
- theme/style token extraction
- visual grouping
- editable layout mapping

### 5. `document-transformation-engine`

Responsibilities:

- summarize
- simplify
- rewrite
- redesign
- convert to notes
- convert to slides
- convert to study guide
- extract citations and evidence packs

### 6. `document-exporter`

Responsibilities:

- re-render PDF
- export structured document
- export deck
- export markdown/json bundle
- preserve source attribution and references

### 7. Existing Hermes Modules To Reuse

- `artifact-manager`
- `workspace-manager`
- `chat-orchestrator`
- `streaming-engine`

## Frontend Surface Plan

The frontend stays thin and should continue to live inside the current app/component structure.

### Chat Surface

Should support:

- PDF upload
- document URL attach
- progress rendering
- artifact cards
- run/session state
- follow-up instructions on the same artifact

### Editor/Canvas Surface

Should support:

- block-aware editing
- layout-aware editing
- section navigation
- source-linked review
- design actions
- export actions

## Suggested Editor Stack

The product should avoid making the canvas itself the intelligence layer.

Recommended split:

- `pdf.js` for reference preview
- `Lexical` or equivalent for rich text inside structured blocks
- `Konva` or `Fabric.js` for structured visual block layout when needed

This keeps the editor composable while Hermes owns the reconstruction and transformation logic.

## Suggested AST Shape

```ts
type DocumentAST = {
  id: string;
  metadata: {
    title?: string;
    documentType?: string;
    language?: string;
    authors?: string[];
    sourceKind: "pdf" | "scan" | "url";
  };
  pages: Array<{
    id: string;
    index: number;
    width: number;
    height: number;
  }>;
  blocks: Array<{
    id: string;
    pageId: string;
    type:
      | "heading"
      | "paragraph"
      | "table"
      | "figure"
      | "caption"
      | "citation"
      | "list"
      | "form_field";
    semanticRole?: string;
    bbox: { x: number; y: number; w: number; h: number };
    content: unknown;
    styleTokenIds: string[];
    sourceRef?: {
      page: number;
      anchor?: string;
    };
    relations?: string[];
  }>;
  references: Array<{
    id: string;
    label?: string;
    rawText: string;
    target?: string;
  }>;
  styleTokens: Array<{
    id: string;
    kind: "font" | "spacing" | "color" | "layout";
    value: Record<string, unknown>;
  }>;
};
```

## Chat Contract Additions

The existing Hermes-backed chat path should be extended, not replaced.

### New Chat Inputs

- `attachments[]`
- `documentIntent`
- `artifactId?`
- `sourceUrl?`

### New Event Types

- `document_ingestion_started`
- `document_ingestion_completed`
- `document_structure_detected`
- `document_semantics_ready`
- `artifact_ready`
- `export_started`
- `export_completed`

### New Artifact Domains

The runtime should support document-oriented domains beyond plain chat:

- `documents`
- `notes`
- `slides`
- `research`

## Storage Plan

### PostgreSQL

Store:

- document metadata
- AST metadata
- block metadata
- export jobs
- run-to-artifact links

### Blob Storage

Store:

- original uploads
- page images
- extracted assets
- rendered exports
- intermediate bundles

### Redis

Store:

- in-flight processing state
- progress hot state
- replay events
- export job coordination

## Build Phases

### Phase 1: Contracts And Ingestion MVP

Build:

- `DocumentAST` contract
- upload-to-ingestion run path through chat
- original PDF storage
- page extraction
- OCR/scanned detection

Acceptance:

- user can upload a PDF in chat
- Hermes creates a document run
- chat streams progress
- a document artifact record is created

### Phase 2: Structure Reconstruction MVP

Build:

- block segmentation
- reading order
- heading hierarchy
- figure/table detection
- source coordinates

Acceptance:

- uploaded PDFs become block-structured artifacts
- basic editor can open and render the structure

### Phase 3: Semantic Reconstruction MVP

Build:

- section classification
- citation/reference extraction
- document type inference
- academic metadata extraction

Acceptance:

- the system can answer structure-aware questions about the artifact
- citations and sections are queryable

### Phase 4: Editable Canvas MVP

Build:

- AST-to-editor mapping
- block editing
- section editing
- save back into artifact state

Acceptance:

- the document is genuinely editable, not just viewable

### Phase 5: Transformation Workflows

Build:

- summarize
- simplify
- convert to notes
- convert to slides
- redesign

Acceptance:

- user can ask in chat for high-value transformations on the artifact

### Phase 6: Export And Fidelity

Build:

- PDF re-render
- structured export bundle
- deck export
- source/citation preservation

Acceptance:

- edited and transformed artifacts can be exported reliably

## Priority Use Cases

The first Shothik-native use cases should be:

1. research paper -> simplified study notes
2. research paper -> presentation deck
3. PDF handout -> editable smart document
4. scanned notes -> structured academic document
5. report -> redesigned publishable output

## What Not To Do

- do not collapse the system into a plain OCR/text extraction feature
- do not make the canvas the source of truth
- do not bury orchestration inside frontend components or route handlers
- do not build a separate document platform outside Hermes before contracts stabilize

## Immediate Next Steps

1. Add a document-oriented contract alongside existing Hermes contracts
2. Extend chat request/event schema for document ingestion
3. Introduce `document-ingestion-orchestrator`
4. Add a minimal document artifact type and artifact card in chat
5. Build the first upload -> ingest -> artifact -> open flow

## Bottom Line

This capability should be built as a first-class Hermes backend workflow.

The winning product shape is not:

`chat-only PDF assistant`

It is:

`chat-driven document intelligence with durable editable artifacts`
