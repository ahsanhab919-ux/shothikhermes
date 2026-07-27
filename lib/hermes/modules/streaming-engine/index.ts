/**
 * Hermes Streaming Engine
 * 
 * Provides real-time event streaming using Redis storage and Server-Sent Events.
 * Uses polling for simplicity and immediate deployment readiness.
 */

import { getRedis } from "@/lib/infrastructure/redis";
import logger from "@/lib/logger";
import type { 
  HermesEventEnvelope, HermesRunHotState, RunId
} from "../../contracts/core";

export class HermesStreamingEngine {
  private redis = getRedis();
  
  constructor() {
    if (!this.redis) {
      logger.warn('[hermes-streaming] Redis unavailable - events memory-only');
    }
  }

  async emitRunEvent(event: HermesEventEnvelope): Promise<void> {
    try {
      const eventWithSequence = await this.withSequence(event);
      await this.storeEventForReplay(eventWithSequence);
      await this.storeRunHotState(eventWithSequence);
      logger.info('[hermes-streaming] Event emitted', { 
        runId: eventWithSequence.runId,
        eventType: eventWithSequence.eventType,
        sequence: eventWithSequence.sequence
      });
    } catch (error) {
      logger.error('[hermes-streaming] Emit failed', { 
        runId: event.runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getRunHotState(runId: RunId): Promise<HermesRunHotState | null> {
    if (!this.redis) return null;

    try {
      const raw = await this.redis.get<HermesRunHotState>(this.getHotStateKey(runId));
      return raw ?? null;
    } catch (error) {
      logger.warn('[hermes-streaming] Hot state read failed', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async getEventsSince(runId: RunId, sinceSequence: number = 0, limit: number = 100): Promise<HermesEventEnvelope[]> {
    if (!this.redis) return [];

    const replayKey = this.getReplayKey(runId);
    
    try {
      const eventStrings = await this.redis.lrange(replayKey, sinceSequence, sinceSequence + limit - 1);
      
      return eventStrings
        .map(str => {
          try {
            return JSON.parse(str) as HermesEventEnvelope;
          } catch {
            return null;
          }
        })
        .filter((event): event is HermesEventEnvelope => 
          event !== null && event.sequence > sinceSequence
        );
    } catch (error) {
      logger.error('[hermes-streaming] Replay failed', { runId, error });
      throw error;
    }
  }

  private async storeEventForReplay(event: HermesEventEnvelope): Promise<void> {
    if (!this.redis) return;

    const replayKey = this.getReplayKey(event.runId as RunId);
    
    try {
      await this.redis.rpush(replayKey, JSON.stringify(event));
      await this.redis.expire(replayKey, 7 * 24 * 60 * 60); // 7 days
    } catch (error) {
      logger.warn('[hermes-streaming] Replay storage failed', { 
        runId: event.runId,
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async withSequence(event: HermesEventEnvelope): Promise<HermesEventEnvelope> {
    if (!this.redis || !event.runId) {
      return event.sequence > 0 ? event : { ...event, sequence: Math.max(event.sequence, 1) };
    }

    try {
      const sequence = await this.redis.incr(this.getSequenceKey(event.runId));
      await this.redis.expire(this.getSequenceKey(event.runId), 7 * 24 * 60 * 60);
      return { ...event, sequence };
    } catch (error) {
      logger.warn('[hermes-streaming] Sequence allocation failed', {
        runId: event.runId,
        error: error instanceof Error ? error.message : String(error),
      });
      return event.sequence > 0 ? event : { ...event, sequence: Math.max(event.sequence, 1) };
    }
  }

  private async storeRunHotState(event: HermesEventEnvelope): Promise<void> {
    if (!this.redis || !event.runId) return;

    const hotState: HermesRunHotState = {
      runId: event.runId,
      workspaceId: event.workspaceId,
      status: typeof event.metadata?.runStatus === "string" ? event.metadata.runStatus as HermesRunHotState["status"] : undefined,
      domain: event.domain,
      lastEventType: event.eventType,
      lastSequence: event.sequence,
      message: this.extractMessage(event.payload),
      artifactId: event.artifactId,
      updatedAt: event.timestamp,
      payload: event.payload,
      metadata: event.metadata,
    };

    try {
      await this.redis.set(this.getHotStateKey(event.runId), hotState, { ex: 7 * 24 * 60 * 60 });
    } catch (error) {
      logger.warn('[hermes-streaming] Hot state storage failed', {
        runId: event.runId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private extractMessage(payload: Record<string, unknown>): string | undefined {
    const candidate = payload.message;
    return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
  }

  private getReplayKey(runId: RunId): string {
    return `hermes:replay:${runId}`;
  }

  private getSequenceKey(runId: RunId): string {
    return `hermes:seq:${runId}`;
  }

  private getHotStateKey(runId: RunId): string {
    return `hermes:hot:${runId}`;
  }

  createSSEStream(runId: RunId): ReadableStream {
    const encoder = new TextEncoder();
    let lastSequence = 0;
    let pollInterval: NodeJS.Timeout | null = null;

    return new ReadableStream({
      start: async (controller) => {
        try {
          const hotState = await this.getRunHotState(runId);
          if (hotState) {
            lastSequence = hotState.lastSequence;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'hot_state',
              runId,
              snapshot: hotState,
            })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'connection', 
            runId, 
            timestamp: new Date().toISOString() 
          })}\n\n`));

          pollInterval = setInterval(async () => {
            try {
              const events = await this.getEventsSince(runId, lastSequence, 50);
              
              for (const event of events) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                lastSequence = Math.max(lastSequence, event.sequence);
              }
            } catch (error) {
              logger.error('[hermes-streaming] Polling error', { runId, error });
            }
          }, 2000);

          logger.info('[hermes-streaming] SSE stream started', { runId });
        } catch (error) {
          controller.error(error);
        }
      },
      
      cancel: () => {
        if (pollInterval) clearInterval(pollInterval);
        logger.info('[hermes-streaming] SSE stream cancelled', { runId });
      }
    });
  }
}

let streamingEngineInstance: HermesStreamingEngine | null = null;

export function getHermesStreamingEngine(): HermesStreamingEngine {
  if (!streamingEngineInstance) {
    streamingEngineInstance = new HermesStreamingEngine();
  }
  return streamingEngineInstance;
}
