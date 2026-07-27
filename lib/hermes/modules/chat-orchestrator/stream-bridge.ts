/**
 * Chat Stream Bridge
 *
 * Bridges canonical Hermes events between the HermesStreamingEngine
 * (Redis-backed: replay, hot state, sequence assignment) and the client
 * SSE stream that the API gateway relays.
 *
 * Every significant chat lifecycle event (run_created, run_started,
 * progress_update, run_completed, run_failed, etc.) is:
 *
 *   1. Constructed as a proper HermesEventEnvelope
 *   2. Emitted through HermesStreamingEngine.emitRunEvent() → Redis
 *      (stores in replay list, assigns sequence, updates hot state)
 *   3. Written to the client SSE stream as `data: {envelope}\n\n`
 *
 * The `__hermes: true` marker on the SSE payload allows the frontend
 * to distinguish canonical Hermes events from legacy chat events
 * (`type: "conversation"`, `type: "chunk"`, etc.) that remain for
 * backward compatibility.
 *
 * If Redis is unavailable, the bridge degrades gracefully — events
 * still flow to the client SSE stream, but without persistence or
 * replay capability.
 */

import { randomUUID } from "crypto";
import type { HermesEventEnvelope, HermesEventType } from "@/lib/hermes/contracts/core";
import { getHermesStreamingEngine } from "@/lib/hermes/modules/streaming-engine";
import logger from "@/lib/logger";

export interface SSEController {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}

export class ChatStreamBridge {
  private streaming = getHermesStreamingEngine();
  private encoder = new TextEncoder();

  constructor(
    private runId: string,
    private workspaceId: string,
    private sessionId?: string,
    private baseMetadata: Record<string, unknown> = {},
  ) {}

  /**
   * Emit a canonical Hermes event through both the streaming engine
   * (Redis: replay + hot state) and the client SSE stream.
   *
   * Returns the fully-formed envelope (with sequence assigned by Redis,
   * or a fallback sequence if Redis is unavailable).
   */
  async emit(
    sse: SSEController,
    eventType: HermesEventType,
    payload: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {},
  ): Promise<HermesEventEnvelope> {
    const envelope: HermesEventEnvelope = {
      eventId: randomUUID(),
      runId: this.runId,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      domain: "chat",
      eventType,
      timestamp: new Date().toISOString(),
      sequence: 0, // assigned by Redis via withSequence()
      payload,
      metadata: {
        ...this.baseMetadata,
        ...metadata,
        source: "chat-orchestrator",
      },
    };

    // Emit through the streaming engine (Redis: replay + hot state)
    let persistedEnvelope = envelope;
    try {
      await this.streaming.emitRunEvent(envelope);
      // emitRunEvent mutates the event in-place via withSequence,
      // but since we pass by value we need to read it back
      const hotState = await this.streaming.getRunHotState(this.runId);
      if (hotState) {
        persistedEnvelope = {
          ...envelope,
          sequence: hotState.lastSequence,
        };
      }
    } catch (err) {
      // Redis may be unavailable — degrade gracefully
      logger.warn("[chat-stream-bridge] Streaming engine emit failed, degrading", {
        runId: this.runId,
        eventType,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fallback: use a local counter so the client still gets sequences
      persistedEnvelope = {
        ...envelope,
        sequence: this.nextFallbackSequence(),
      };
    }

    // Write to client SSE stream
    this.writeToSSE(sse, persistedEnvelope);

    return persistedEnvelope;
  }

  /**
   * Write a raw (non-Hermes) event to the SSE stream.
   * Used for legacy compatibility events (type: "conversation", "chunk", etc.)
   */
  writeLegacy(sse: SSEController, data: unknown): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    sse.controller.enqueue(this.encoder.encode(payload));
  }

  /**
   * Close the SSE stream.
   */
  close(sse: SSEController): void {
    sse.controller.close();
  }

  // --- Private helpers ------------------------------------------------

  private fallbackSeq = 0;

  private nextFallbackSequence(): number {
    return ++this.fallbackSeq;
  }

  private writeToSSE(sse: SSEController, envelope: HermesEventEnvelope): void {
    // Mark with __hermes so the frontend can distinguish canonical events
    // from legacy chat events, while keeping the full envelope shape.
    const ssePayload = { __hermes: true, ...envelope };
    const payload = `data: ${JSON.stringify(ssePayload)}\n\n`;
    sse.controller.enqueue(this.encoder.encode(payload));
  }
}
