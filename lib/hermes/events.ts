/**
 * Canonical Hermes Event Contract
 * 
 * All AI workflows should emit events conforming to this envelope.
 * Based on docs/HERMES_PHASE_0_TO_5_ARCHITECTURE_PLAN.md
 */

export interface HermesEvent {
  runId: string;
  seq: number;
  timestamp: string;
  type: HermesEventType;
  workspaceId?: string;
  artifactType?: string;
  artifactId?: string;
  status?: RunStatus;
  label?: string;
  message?: string;
  payload?: Record<string, any>;
}

export type HermesEventType = 
  | "run_created"
  | "plan" 
  | "tool_call"
  | "tool_result"
  | "progress"
  | "artifact_create"
  | "artifact_patch"
  | "checkpoint"
  | "version_create"
  | "handoff"
  | "done"
  | "error";

export type RunStatus = 
  | "created"
  | "planning" 
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export class HermesEventEmitter {
  private eventSeq = 0;

  constructor(private runId: string) {}

  emit(
    type: HermesEventType,
    options: {
      workspaceId?: string;
      artifactType?: string;
      artifactId?: string;
      status?: RunStatus;
      label?: string;
      message?: string;
      payload?: Record<string, any>;
    } = {}
  ): HermesEvent {
    this.eventSeq++;
    
    const event: HermesEvent = {
      runId: this.runId,
      seq: this.eventSeq,
      timestamp: new Date().toISOString(),
      type,
      ...options,
    };

    console.log(`[hermes-event] ${this.runId}:${this.eventSeq} ${type}`, {
      label: options.label,
      message: options.message,
    });

    return event;
  }

  progress(label: string, message?: string, payload?: Record<string, any>): HermesEvent {
    return this.emit("progress", { label, message, payload, status: "running" });
  }

  error(message: string, payload?: Record<string, any>): HermesEvent {
    return this.emit("error", { message, payload, status: "failed" });
  }

  done(message?: string): HermesEvent {
    return this.emit("done", { message, status: "completed" });
  }

  toolCall(toolName: string, payload?: Record<string, any>): HermesEvent {
    return this.emit("tool_call", {
      label: `Calling ${toolName}`,
      payload: { toolName, ...payload },
    });
  }

  toolResult(toolName: string, result: any): HermesEvent {
    return this.emit("tool_result", {
      label: `${toolName} completed`,
      payload: { toolName, result },
    });
  }
}

/**
 * Server-Sent Events streaming utility for Hermes events
 */
export class HermesEventStream {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  constructor(
    private runId: string,
    private onClose?: () => void
  ) {}

  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller;
        // Emit initial run_created event
        const emitter = new HermesEventEmitter(this.runId);
        const createEvent = emitter.emit("run_created", {
          label: "Run started",
          status: "created",
        });
        this.sendEvent(createEvent);
      },
      cancel: () => {
        this.onClose?.();
      },
    });
  }

  sendEvent(event: HermesEvent): void {
    if (!this.controller) return;
    
    const sseData = `data: ${JSON.stringify(event)}\n\n`;
    this.controller.enqueue(this.encoder.encode(sseData));
  }

  close(): void {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }
}

/**
 * Response helper for Hermes-compatible SSE streams
 */
export function createHermesEventStreamResponse(runId: string): {
  stream: ReadableStream<Uint8Array>;
  emitter: HermesEventEmitter;
  response: Response;
} {
  const emitter = new HermesEventEmitter(runId);
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      // Send initial event
      const createEvent = emitter.emit("run_created", {
        status: "created",
        label: "Initializing run",
      });
      const sseData = `data: ${JSON.stringify(createEvent)}\n\n`;
      controller.enqueue(encoder.encode(sseData));
    },
    cancel() {
      streamController = null;
    },
  });

  // Patch emitter to automatically send events to stream
  const originalEmit = emitter.emit.bind(emitter);
  emitter.emit = (type, options = {}) => {
    const event = originalEmit(type, options);
    if (streamController) {
      const sseData = `data: ${JSON.stringify(event)}\n\n`;
      streamController.enqueue(encoder.encode(sseData));
    }
    return event;
  };

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "Connection": "keep-alive",
    },
  });

  return { stream, emitter, response };
}