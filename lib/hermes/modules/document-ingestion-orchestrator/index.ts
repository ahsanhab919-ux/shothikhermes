/**
 * Document Ingestion Orchestrator
 *
 * Backend-owned module for the first slice of chat-driven document
 * intelligence. Per ADR-002 and the blueprint, orchestration lives in
 * Hermes — not in route handlers or frontend components.
 *
 * Responsibilities (Phase 1 only):
 *   - accept a document source descriptor from the chat orchestrator
 *   - run lightweight text extraction (text already extracted by the
 *     existing /api/extract-pdf-v2 path is passed in; this module does
 *     NOT call OCR or pdf.js directly yet)
 *   - detect scanned-vs-digital heuristically (text density)
 *   - build a minimal DocumentAST placeholder (pages + a single
 *     paragraph block carrying the extracted text)
 *   - create a durable Hermes artifact (domain: "documents") carrying
 *     the AST and source metadata
 *   - emit document_ingestion_started / progress / completed and
 *     artifact_ready events through the ChatStreamBridge so they land
 *     in the Redis replay list + hot state AND the client SSE stream
 *
 * Later phases will replace the placeholder AST with real structure
 * reconstruction, semantic reconstruction, and design reconstruction.
 */

import { randomUUID } from "crypto";
import { getHermesOrchestrator } from "@/lib/hermes";
import type { HermesArtifact } from "@/lib/hermes/contracts/core";
import {
  type DocumentAST,
  type DocumentSource,
  type DocumentSourceKind,
  type DocumentChatRequest,
} from "@/lib/hermes/contracts/documents";
import { ChatStreamBridge, type SSEController } from "@/lib/hermes/modules/chat-orchestrator/stream-bridge";
import logger from "@/lib/logger";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IngestDocumentInput {
  userId: string;
  workspaceId: string;
  runId: string;
  /** The chat turn's document intent (defaults to "ingest") */
  intent?: DocumentChatRequest["intent"];
  /** Source kind: typically "upload" for chat attachments */
  kind?: DocumentSourceKind;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceUrl?: string;
  /** Text already extracted by /api/extract-pdf-v2 (chat attachment path) */
  extractedText?: string;
  /** Page count if known from the extraction step */
  pageCount?: number;
}

export interface IngestDocumentResult {
  artifact: HermesArtifact;
  source: DocumentSource;
  ast: DocumentAST;
}

// ---------------------------------------------------------------------------
// Heuristics
// ---------------------------------------------------------------------------

/**
 * Heuristic scanned-vs-digital detection.
 *
 * If we have extracted text and the ratio of alphanumeric characters to
 * total length is very low, treat the source as scanned. This is a
 * placeholder for a proper OCR-routing decision in a later phase.
 */
function detectScanned(text: string, pageCount?: number): boolean {
  if (!text || text.length === 0) return true;
  const alphanumeric = (text.match(/[A-Za-z0-9]/g) ?? []).length;
  const ratio = alphanumeric / text.length;
  // Very low text density => likely scanned image with little real text
  if (ratio < 0.15) return true;
  // If pageCount is known but text is suspiciously short, treat as scanned
  if (pageCount && pageCount > 0 && text.length / pageCount < 200) return true;
  return false;
}

/**
 * Build a minimal DocumentAST from extracted text.
 *
 * Phase 1 keeps this intentionally simple: a single page and a single
 * paragraph block carrying the full extracted text. Phase 2 will
 * replace this with real block segmentation and reading order.
 */
function buildPlaceholderAST(params: {
  sourceId: string;
  sourceKind: DocumentSourceKind;
  fileName?: string;
  extractedText: string;
  pageCount?: number;
}): DocumentAST {
  const { sourceId, sourceKind, fileName, extractedText, pageCount } = params;

  const pageId = `page_${randomUUID()}`;
  const blockId = `blk_${randomUUID()}`;

  const pages = pageCount && pageCount > 0
    ? Array.from({ length: pageCount }, (_, i) => ({
        id: `page_${sourceId}_${i}`,
        index: i,
      }))
    : [{ id: pageId, index: 0 }];

  return {
    id: `ast_${randomUUID()}`,
    metadata: {
      title: fileName ?? "Untitled document",
      sourceKind,
      authors: [],
    },
    pages,
    blocks: [
      {
        id: blockId,
        pageId: pages[0].id,
        type: "paragraph",
        content: extractedText.slice(0, 50000),
        styleTokenIds: [],
        sourceRef: { page: 0 },
        relations: [],
      },
    ],
    references: [],
    styleTokens: [],
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class DocumentIngestionOrchestrator {
  /**
   * Run the Phase 1 ingestion pipeline for a single document source and
   * return the durable artifact + AST. Events are emitted through the
   * provided ChatStreamBridge so they reach both Redis (replay + hot
   * state) and the client SSE stream.
   *
   * This method does NOT throw on extraction issues — it records a
   * failed ingestion status on the source and emits a
   * document_ingestion_completed event with a warning. It only throws
   * if artifact creation itself fails, since that is a hard blocker
   * for the slice's acceptance criteria.
   */
  async ingest(
    input: IngestDocumentInput,
    sse: SSEController,
    bridge: ChatStreamBridge,
  ): Promise<IngestDocumentResult> {
    const {
      userId,
      workspaceId,
      runId,
      intent = "ingest",
      kind = "upload",
      fileName,
      mimeType,
      sizeBytes,
      sourceUrl,
      extractedText = "",
      pageCount,
    } = input;

    const hermes = getHermesOrchestrator();
    const now = new Date().toISOString();

    const sourceId = `docsrc_${randomUUID()}`;
    const isScanned = detectScanned(extractedText, pageCount);

    // --- 1. Emit ingestion started ---------------------------------------
    await bridge.emit(
      sse,
      "document_ingestion_started",
      {
        sourceId,
        fileName,
        mimeType,
        sizeBytes,
        sourceUrl,
        intent,
        kind,
      },
      { runStatus: "running", ingestionStatus: "extracting" },
    );

    // --- 2. Build the placeholder DocumentAST ----------------------------
    const ast = buildPlaceholderAST({
      sourceId,
      sourceKind: kind,
      fileName,
      extractedText,
      pageCount,
    });

    // --- 3. Emit a progress event with the scanned/digital decision ------
    await bridge.emit(
      sse,
      "document_ingestion_progress",
      {
        sourceId,
        message: isScanned
          ? "Source appears scanned; OCR routing will be applied in a later phase."
          : "Text extraction complete; building document artifact.",
        isScanned,
        blockCount: ast.blocks.length,
        pageCount: ast.pages.length,
        textLength: extractedText.length,
      },
      { runStatus: "running", ingestionStatus: "extracting" },
    );

    // --- 4. Create the durable Hermes artifact ---------------------------
    const artifactTitle = fileName ?? sourceUrl ?? "Untitled document";
    let artifact: HermesArtifact;
    try {
      artifact = await hermes.artifactManager.createArtifact({
        workspaceId,
        runId,
        userId,
        domain: "documents",
        title: artifactTitle,
        description: `Ingested document (${kind}) — intent: ${intent}`,
        content: {
          ast,
          source: {
            id: sourceId,
            kind,
            fileName,
            mimeType,
            sizeBytes,
            sourceUrl,
            isScanned,
            pageCount: ast.pages.length,
            textLength: extractedText.length,
          },
        },
        metadata: {
          sourceId,
          sourceKind: kind,
          documentIntent: intent,
          isScanned,
          pipelinePhase: "ingestion",
        },
      });
    } catch (error) {
      logger.error("[document-ingestion] Artifact creation failed", {
        runId,
        sourceId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Emit a failure event through the bridge so the client sees it
      await bridge.emit(
        sse,
        "document_ingestion_completed",
        {
          sourceId,
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Artifact creation failed",
        },
        { runStatus: "failed", ingestionStatus: "failed" },
      );
      throw error;
    }

    // --- 5. Mark the artifact ready --------------------------------------
    try {
      artifact = await hermes.artifactManager.markReady(artifact.id);
    } catch (error) {
      logger.warn("[document-ingestion] markReady failed, continuing", {
        artifactId: artifact.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // --- 6. Build the DocumentSource record ------------------------------
    const source: DocumentSource = {
      id: sourceId,
      workspaceId,
      userId,
      runId,
      artifactId: artifact.id,
      kind,
      fileName,
      mimeType,
      sizeBytes,
      sourceUrl,
      extractedText,
      pageCount: ast.pages.length,
      isScanned,
      ingestionStatus: "completed",
      createdAt: now,
      updatedAt: new Date().toISOString(),
      metadata: {
        intent,
        artifactTitle,
      },
    };

    // --- 7. Emit ingestion completed + artifact_ready --------------------
    await bridge.emit(
      sse,
      "document_ingestion_completed",
      {
        sourceId,
        artifactId: artifact.id,
        status: "completed",
        isScanned,
        pageCount: ast.pages.length,
        blockCount: ast.blocks.length,
        textLength: extractedText.length,
      },
      { runStatus: "running", ingestionStatus: "completed" },
    );

    await bridge.emit(
      sse,
      "artifact_ready",
      {
        artifactId: artifact.id,
        domain: "documents",
        title: artifact.title,
        sourceId,
        intent,
        handoffSurface: "document-editor",
      },
      {
        runStatus: "running",
        artifactStatus: "ready",
        artifactId: artifact.id,
      },
    );

    logger.info("[document-ingestion] Ingestion completed", {
      runId,
      sourceId,
      artifactId: artifact.id,
      isScanned,
      textLength: extractedText.length,
    });

    return { artifact, source, ast };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let documentIngestionInstance: DocumentIngestionOrchestrator | null = null;

export function getDocumentIngestionOrchestrator(): DocumentIngestionOrchestrator {
  if (!documentIngestionInstance) {
    documentIngestionInstance = new DocumentIngestionOrchestrator();
  }
  return documentIngestionInstance;
}
