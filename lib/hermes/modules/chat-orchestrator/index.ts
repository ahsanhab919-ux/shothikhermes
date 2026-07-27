/**
 * Hermes Chat Orchestrator
 *
 * Backend-owned chat execution module. Moves provider calls, message
 * lifecycle, and run/session coordination out of the API gateway route
 * handler into the Hermes modular monolith — per ADR-003.
 *
 * Responsibilities:
 *   - create or resume a Hermes workspace for the user's chat surface
 *   - create or resume a Hermes session per chat conversation
 *   - create or reuse a Hermes run for each chat turn
 *   - persist user + assistant messages (via lib/chat/server)
 *   - call the model provider (currently Gemini) and stream deltas back
 *   - emit canonical Hermes events (session + run) into the SSE stream
 *   - handle abort, error, and completion states
 *
 * The route handler (app/api/chat/route.ts) becomes a thin gateway:
 *   auth → validate → call executeChatTurn() → relay SSE stream
 */

import {
  getConversationForUser,
  createPersistedConversation,
  appendPersistedUserMessage,
  createPersistedAssistantMessage,
  appendPersistedAssistantChunk,
  completePersistedAssistantMessage,
  stopPersistedAssistantMessage,
  failPersistedAssistantMessage,
} from "@/lib/chat/server";
import { parseFlagshipSlashCommand } from "@/lib/chat/commands";
import { buildChatPrivacyProfile } from "@/lib/chat/privacy";
import type { ChatAttachment } from "@/lib/chat/types";
import type {
  ChatEncryptedEnvelope,
  ChatPrivacyProfile,
  ChatSyncDescriptor,
} from "@/lib/chat/types";
import { getHermesOrchestrator } from "@/lib/hermes";
import { getDocumentIngestionOrchestrator } from "@/lib/hermes/modules/document-ingestion-orchestrator";
import {
  mapChatPrivacyModeToModelRouteClass,
  resolveHermesModelRoute,
} from "@/lib/hermes/modules/model-router";
import { describeRouteAdapterTarget } from "@/lib/hermes/modules/model-router/route-adapter";
import type {
  ArtifactDomain,
  ChatExecutionIntent,
  ChatExecutionMetadata,
  HermesRetrievalPlan,
  HermesSession,
  HermesWorkspace,
} from "@/lib/hermes/contracts/core";
import {
  ChatProviderError,
  readChatProviderDeltas,
  startChatProviderStream,
  type ChatProviderMessage,
} from "./providers";
import { resolveChatVendorSelectionForRoute } from "./vendor-manager";
import { ChatStreamBridge, type SSEController } from "./stream-bridge";
import logger from "@/lib/logger";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ChatTurnRequest {
  userId: string;
  messages: { role: "user" | "assistant"; content: string }[];
  context?: string;
  attachments?: ChatAttachment[];
  conversationId?: string;
  surface?:
    | "flagship"
    | "writing-studio"
    | "sheet"
    | "research"
    | "book-agent";
  modelHandle?: string;
  contextRef?: {
    projectId?: string;
    bookId?: string;
    sheetId?: string;
    researchId?: string;
    localProjectId?: string;
    agentType?: string;
  };
  /** Reuse an existing Hermes session (resume path) */
  sessionId?: string;
  /** Reuse an existing run (resume path) */
  runId?: string;
  /** Optional explicit workflow hint from the caller */
  workflowHint?: "default" | "spec";
  /** Privacy controls applied to this user turn */
  privacy?: ChatPrivacyProfile;
  /** Multi-device sync metadata supplied by the client */
  sync?: ChatSyncDescriptor;
  /** Optional client-encrypted replica for BYOK sync */
  clientEncrypted?: ChatEncryptedEnvelope;
  /**
   * Document intelligence intent. When present (or when a document
   * attachment is detected), the orchestrator runs the document
   * ingestion pipeline before streaming the model response, creating
   * a durable document artifact and emitting artifact_ready.
   */
  documentIntent?: string;
  /** Optional document source URL (e.g. pasted PDF link) */
  sourceUrl?: string;
  /** Original request path supplied by the API gateway for observability */
  sourceRequestPath?: string;
  /** Full request URL supplied by the API gateway for observability */
  sourceRequestUrl?: string;
  /** The HTTP request signal, for abort propagation */
  signal?: AbortSignal;
}

export interface ChatTurnResult {
  runId: string;
  sessionId: string;
  workspaceId: string;
  conversationId: string;
  /** SSE stream ready to be relayed by the gateway */
  stream: ReadableStream<Uint8Array>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Shothik, an intelligent AI assistant built for university students and STEM researchers. You help with:
- Academic writing, research, and study questions
- Explaining complex concepts clearly
- Summarizing papers and topics
- Generating ideas and outlines
- Answering questions about science, technology, engineering, and mathematics
- General knowledge and curiosity-driven conversations

Be concise, warm, and accurate. If you don't know something, say so honestly.`;

/**
 * Detect whether a chat attachment represents a document that should
 * trigger the document ingestion pipeline. PDFs and any file attachment
 * with a document-like MIME type qualify. URL attachments are NOT
 * matched here — sourceUrl is handled separately as a document turn
 * trigger.
 */
function isDocumentAttachment(attachment: ChatAttachment): boolean {
  if (attachment.kind === "url") return false;
  const mime = (attachment.mimeType ?? "").toLowerCase();
  const name = (attachment.name ?? "").toLowerCase();
  return (
    mime === "application/pdf" ||
    mime.includes("pdf") ||
    name.endsWith(".pdf") ||
    // Broad document MIME families — refined in later phases
    mime.startsWith("application/vnd.") ||
    mime === "application/msword" ||
    mime.includes("officedocument") ||
    mime === "text/plain"
  );
}

/**
 * Best-effort extraction of the document text carried by attachments.
 *
 * The chat attachment path already extracts PDF text via
 * /api/extract-pdf-v2 and stores it on the PendingAttachment.text
 * field on the client. That text is not part of the ChatAttachment
 * wire type (only id/kind/name/mimeType/preview/sourceUrl are sent),
 * so for Phase 1 we rely on the `context` string the route handler
 * forwards (which already contains the attachment text) and treat the
 * attachment metadata as the source descriptor. When no context is
 * available, the ingestion orchestrator will record an empty
 * extractedText and mark the source as scanned.
 *
 * To bridge the gap for tests and future direct callers, we also accept
 * a per-attachment `text` field if present (the PendingAttachment shape
 * carries it on the client, and tests may inject it).
 */
function extractAttachmentText(
  attachments: ChatAttachment[] | undefined,
): string {
  if (!attachments || attachments.length === 0) return "";
  // Sum any text-like field attachments carry. The wire type doesn't
  // include `text`, but we tolerate it for forward compatibility.
  const parts: string[] = [];
  for (const a of attachments as Array<ChatAttachment & { text?: string }>) {
    if (typeof a.text === "string" && a.text.length > 0) {
      parts.push(a.text);
    }
  }
  return parts.join("\n\n---\n\n");
}

// Re-export the SSE controller type from the stream bridge
export type { SSEController } from "./stream-bridge";

// ---------------------------------------------------------------------------
// Resolved context — shared state for a single chat turn
// ---------------------------------------------------------------------------

interface ResolvedContext {
  workspace: HermesWorkspace;
  session: HermesSession;
  conversationId: string;
  sessionResumeMode: "new_session" | "resume_session";
}

function normalizeSlashCommandInput(
  input: string,
  workflowHint?: ChatTurnRequest["workflowHint"],
) {
  const slashCommand = parseFlagshipSlashCommand(input);
  const workflow =
    workflowHint === "spec" || slashCommand?.name === "spec" ? "spec" : "default";
  const normalizedContent =
    workflow === "spec"
      ? slashCommand?.argument?.trim() || "Create a specification from the available context."
      : input;

  return {
    workflow,
    slashCommand,
    normalizedContent,
  } as const;
}

function buildRetrievalPlan(params: {
  workflow: "default" | "spec";
  hasDocumentContext: boolean;
  hasProvidedContext: boolean;
}): HermesRetrievalPlan {
  if (params.workflow === "spec") {
    return {
      intent: "action_grounded_retrieval",
      preferredSources: ["workspace", "artifacts", "session_memory"],
      mode: "hybrid",
      freshness: "recent",
      trustWeighting: "workspace_first",
      personalizationScope: "workspace",
      costBudget: "medium",
    };
  }

  if (params.hasDocumentContext || params.hasProvidedContext) {
    return {
      intent: "workspace_knowledge_lookup",
      preferredSources: ["artifacts", "workspace", "session_memory"],
      mode: "hybrid",
      freshness: "recent",
      trustWeighting: "workspace_first",
      personalizationScope: "session",
      costBudget: "medium",
    };
  }

  return {
    intent: "none",
    preferredSources: [],
    mode: "none",
    freshness: "cached",
    trustWeighting: "default",
    personalizationScope: "none",
    costBudget: "low",
  };
}

function mapSurfaceToArtifactDomain(
  surface: NonNullable<ChatTurnRequest["surface"]>,
): ArtifactDomain {
  switch (surface) {
    case "writing-studio":
      return "writing";
    case "sheet":
      return "sheets";
    case "research":
      return "research";
    case "book-agent":
      return "books";
    default:
      return "chat";
  }
}

function buildExecutionIntent(params: {
  workflow: "default" | "spec";
  retrievalPlan: HermesRetrievalPlan;
  providedSessionId?: string;
}): ChatExecutionIntent {
  if (params.workflow === "spec") {
    return {
      intentClass: "retrieve",
      complexity: "medium",
      privacyMode: "normal",
      latencyBudget: "interactive",
      artifactExpectation: "expected",
      requiresNetwork: false,
      requiresFilesystem: false,
      requiresShell: false,
      requiresLongLivedSession: true,
    };
  }

  if (params.retrievalPlan.intent !== "none") {
    return {
      intentClass: "retrieve",
      complexity: "medium",
      privacyMode: "normal",
      latencyBudget: "interactive",
      artifactExpectation: "possible",
      requiresNetwork: false,
      requiresFilesystem: false,
      requiresShell: false,
      requiresLongLivedSession: Boolean(params.providedSessionId),
    };
  }

  return {
    intentClass: "answer",
    complexity: "low",
    privacyMode: "normal",
    latencyBudget: "realtime",
    artifactExpectation: "none",
    requiresNetwork: false,
    requiresFilesystem: false,
    requiresShell: false,
    requiresLongLivedSession: Boolean(params.providedSessionId),
  };
}

function buildExecutionMetadata(params: {
  workflow: "default" | "spec";
  slashArgument?: string;
  retrievalPlan: HermesRetrievalPlan;
  intent: ChatExecutionIntent;
  providedSessionId?: string;
  providedRunId?: string;
}): ChatExecutionMetadata {
  const lane = params.intent.intentClass === "retrieve" ? "lane_1" : "lane_0";
  const maxModelTier =
    params.workflow === "spec"
      ? "advanced"
      : lane === "lane_1"
        ? "standard"
        : "cheap";
  const estimatedCostTier =
    params.workflow === "spec"
      ? "high"
      : lane === "lane_1"
        ? "medium"
        : "low";

  return {
    workflow: params.workflow,
    workflowArgument: params.slashArgument,
    lane,
    maxModelTier,
    estimatedCostTier,
    resumeMode: params.providedRunId
      ? "resume_run"
      : params.providedSessionId
        ? "resume_session"
        : "new_session",
    intent: params.intent,
    retrievalPlan: params.retrievalPlan,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class ChatOrchestrator {
  /**
   * Execute a single chat turn end-to-end:
   *   resolve workspace + session → resolve conversation
   *   → persist user + assistant messages
   *   → create Hermes run → call provider → stream deltas + events
   *   → complete/fail/stop
   *
   * Returns a ReadableStream that the gateway can relay verbatim.
   */
  async executeChatTurn(request: ChatTurnRequest): Promise<ChatTurnResult> {
    const {
      userId,
      messages,
      context,
      attachments = [],
      conversationId,
      surface = "flagship",
      modelHandle = "gemini-2.5-flash",
      contextRef,
      sessionId: providedSessionId,
      runId: providedRunId,
      workflowHint,
      privacy,
      sync,
      clientEncrypted,
      documentIntent,
      sourceUrl,
      sourceRequestPath = "/api/chat",
      sourceRequestUrl,
      signal,
    } = request;

    if (!messages || messages.length === 0) {
      throw new ChatOrchestratorError("Messages are required", 400);
    }

    const lastUserMessage = [...messages].reverse().find(
      (m) => m.role === "user",
    );
    if (!lastUserMessage) {
      throw new ChatOrchestratorError("A user message is required", 400);
    }

    const slashHandling = normalizeSlashCommandInput(
      lastUserMessage.content,
      workflowHint,
    );
    const privacyProfile = buildChatPrivacyProfile(privacy);
    const hasDocumentTurnSignal =
      Boolean(documentIntent || sourceUrl) ||
      attachments.some(isDocumentAttachment);
    const capabilityId =
      slashHandling.workflow === "spec"
        ? "reasoning.plan"
        : hasDocumentTurnSignal
          ? "retrieval.search"
          : "conversation.respond";
    const modelRoute = resolveHermesModelRoute({
      capabilityId,
      modelHandle,
      domain: mapSurfaceToArtifactDomain(surface),
      taskType:
        slashHandling.workflow === "spec"
          ? "planning"
          : hasDocumentTurnSignal
            ? "document"
            : "conversation",
      privacyClass: mapChatPrivacyModeToModelRouteClass(privacyProfile.mode),
      latencyTarget:
        slashHandling.workflow === "spec" || hasDocumentTurnSignal
          ? "interactive"
          : "realtime",
      costPolicy: slashHandling.workflow === "spec" ? "highest_quality" : "balanced",
      streamingRequired: true,
    });
    const providerSelection = {
      ...resolveChatVendorSelectionForRoute(modelRoute),
      route: modelRoute,
    };
    const adapterTarget = describeRouteAdapterTarget(modelRoute, providerSelection);
    const routeMetadata = {
      routeId: modelRoute.routeId,
      routeRuleId: adapterTarget.ruleId,
      backend: modelRoute.backend,
      provider: modelRoute.provider,
      modelHandle: modelRoute.modelHandle,
      capabilityId: modelRoute.capabilityId,
      sourceRequestPath,
      ...(sourceRequestUrl ? { sourceRequestUrl } : {}),
      targetBackendService: adapterTarget.targetService,
      targetRequestAddress: adapterTarget.requestUrl,
    };

    // --- 1. Resolve workspace, session, and conversation --------------
    const ctx = await this.resolveContext({
      userId,
      conversationId,
      surface,
      modelHandle,
      contextRef,
      lastUserMessageContent: slashHandling.normalizedContent,
      providedSessionId,
    });

    // --- 2. Persist user + assistant messages ----------------------------
    const persistedUserMessage = await appendPersistedUserMessage({
      conversationId: ctx.conversationId,
      userId,
      content: lastUserMessage.content,
      metadata:
        attachments.length > 0 || slashHandling.slashCommand
          ? {
              ...(attachments.length > 0 ? { attachments } : {}),
              ...(slashHandling.slashCommand
                ? { slashCommand: slashHandling.slashCommand }
                : {}),
              privacy: privacyProfile,
              ...(sync ? { sync } : {}),
              ...(clientEncrypted ? { clientEncrypted } : {}),
            }
          : {
              privacy: privacyProfile,
              ...(sync ? { sync } : {}),
              ...(clientEncrypted ? { clientEncrypted } : {}),
            },
    });

    const { workspace, session } = ctx;
    const persistedAssistantMessage = await createPersistedAssistantMessage({
      conversationId: ctx.conversationId,
      userId,
      modelHandle,
      parentMessageId: String(persistedUserMessage._id),
      metadata: {
        sessionId: session.id,
        workspaceId: workspace.id,
        privacy: privacyProfile,
        modelRoute: routeMetadata,
        ...(sync ? { sync } : {}),
      },
    });

    // --- 3. Plan retrieval + execution before creating the run -----------
    // A chat turn is a "document turn" when the client passes an explicit
    // documentIntent, a sourceUrl, or when one or more attachments look
    // like documents (PDFs / uploads with extracted text). When detected,
    // the orchestrator runs the document ingestion pipeline inside the
    // SSE stream before the model response, creating a durable document
    // artifact and emitting artifact_ready back through chat.
    const documentAttachment = attachments.find((a) => isDocumentAttachment(a));
    const isDocumentTurn = Boolean(
      documentIntent || sourceUrl || documentAttachment,
    );
    const retrievalPlan = buildRetrievalPlan({
      workflow: slashHandling.workflow,
      hasDocumentContext: isDocumentTurn,
      hasProvidedContext: Boolean(context?.trim()),
    });
    const executionIntent = buildExecutionIntent({
      workflow: slashHandling.workflow,
      retrievalPlan,
      providedSessionId,
    });
    const executionMetadata = buildExecutionMetadata({
      workflow: slashHandling.workflow,
      slashArgument: slashHandling.slashCommand?.argument,
      retrievalPlan,
      intent: executionIntent,
      providedSessionId,
      providedRunId,
    });

    // --- 3a. Create Hermes run (or reuse provided) -----------------------
    const hermes = getHermesOrchestrator();

    let runId: string;
    if (providedRunId) {
      runId = providedRunId;
    } else {
      const run = await hermes.createRun({
        workspaceId: workspace.id,
        userId,
        domain: "chat" as any,
        sessionId: session.id,
        metadata: {
          surface,
          contextRef,
          conversationId: ctx.conversationId,
          modelHandle,
          execution: executionMetadata,
          routeMetadata,
        },
      });
      runId = run.id;
    }

    // --- 4. Build provider payload ---------------------------------------
    const providerMessages: ChatProviderMessage[] = [];

    if (context && context.trim()) {
      providerMessages.push({
        role: "user",
        content: `Document context for reference:\n${context.slice(0, 2000)}`,
      });
      providerMessages.push({
        role: "assistant",
        content: "Understood. I'll use this document context to inform my responses.",
      });
    }

    for (const m of messages) {
      const isCurrentUserTurn =
        m === lastUserMessage && m.role === "user";
      const normalizedContent = isCurrentUserTurn
        ? slashHandling.normalizedContent
        : m.content;
      providerMessages.push({
        role: m.role,
        content: normalizedContent,
      });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        const sse: SSEController = { controller, encoder };

        // Create the stream bridge — emits canonical HermesEventEnvelope
        // events through HermesStreamingEngine (Redis: replay + hot state)
        // and relays them to the client SSE stream.
        const bridge = new ChatStreamBridge(runId, workspace.id, session.id, {
          routeMetadata,
          ...routeMetadata,
        });

        const sessionEventType =
          ctx.sessionResumeMode === "resume_session"
            ? "session_resumed"
            : "session_created";

        await bridge.emit(sse, sessionEventType, {
          conversationId: ctx.conversationId,
          sessionStatus: session.status,
          workflow: executionMetadata.workflow,
        }, {
          sessionTitle: session.title,
          resumeMode: executionMetadata.resumeMode,
        });

        // Start the run (status: created → running)
        await hermes.startRun(runId).catch((err) => {
          logger.warn("[chat-orchestrator] Failed to start run", {
            runId,
            error: err instanceof Error ? err.message : String(err),
          });
        });

        // Emit run_started via the bridge (Redis + SSE)
        await bridge.emit(sse, "run_started", {
          conversationId: ctx.conversationId,
          modelHandle,
          workflow: executionMetadata.workflow,
        }, {
          runStatus: "running",
          lane: executionMetadata.lane,
        });

        await bridge.emit(sse, "plan_generated", {
          workflow: executionMetadata.workflow,
          execution: executionMetadata,
        }, {
          lane: executionMetadata.lane,
          maxModelTier: executionMetadata.maxModelTier,
        });

        // --- Document intelligence ingestion ------------------------------
        // If this is a document turn, run the ingestion pipeline now so
        // the durable document artifact exists before the model responds.
        // The ingestion orchestrator emits document_ingestion_started,
        // progress, completed, and artifact_ready through the same bridge,
        // making the ingestion state visible in the chat event stream.
        if (isDocumentTurn) {
          try {
            const ingestion = getDocumentIngestionOrchestrator();
            await ingestion.ingest(
              {
                userId,
                workspaceId: workspace.id,
                runId,
                intent: (documentIntent as any) || "ingest",
                kind: documentAttachment ? "upload" : sourceUrl ? "url" : "upload",
                fileName: documentAttachment?.name,
                mimeType: documentAttachment?.mimeType,
                sourceUrl,
                // The chat attachment path extracts PDF text on the client
                // and forwards it as the `context` string. Use that as the
                // ingestion text source so the document artifact carries
                // real extracted content, not just metadata.
                extractedText: context || extractAttachmentText(attachments),
              },
              sse,
              bridge,
            );
          } catch (ingestErr) {
            logger.warn(
              "[chat-orchestrator] Document ingestion failed, continuing to model",
              {
                runId,
                error:
                  ingestErr instanceof Error
                    ? ingestErr.message
                    : String(ingestErr),
              },
            );
          }
        }

        // Legacy compatibility events (frontend expects these)
        bridge.writeLegacy(sse, {
          type: "conversation",
          conversationId: ctx.conversationId,
        });
        bridge.writeLegacy(sse, {
          type: "message_start",
          messageId: String(persistedAssistantMessage._id),
        });

        if (!providerSelection.apiKey) {
          await failPersistedAssistantMessage({
            messageId: String(persistedAssistantMessage._id),
            userId,
            errorCode: "provider_not_configured",
            fallbackText: `${providerSelection.provider} is not configured. Please contact support.`,
          });
          await bridge.emit(sse, "run_failed", {
            error: `${providerSelection.provider} is not configured`,
            errorCode: "provider_not_configured",
          }, { runStatus: "failed" });
          bridge.writeLegacy(sse, {
            type: "error",
            messageId: String(persistedAssistantMessage._id),
            error: `${providerSelection.provider} is not configured`,
          });
          bridge.writeLegacy(sse, {
            type: "done",
            messageId: String(persistedAssistantMessage._id),
          });
          bridge.close(sse);
          return;
        }

        // --- 6. Call provider --------------------------------------------
        let providerResponse: Response;
        try {
          providerResponse = await startChatProviderStream({
            selection: providerSelection,
            messages: providerMessages,
            systemPrompt: SYSTEM_PROMPT,
            signal,
          });
        } catch (fetchErr) {
          const isAbort =
            fetchErr instanceof Error &&
            fetchErr.name === "AbortError";
          if (isAbort) {
            await stopPersistedAssistantMessage({
              messageId: String(persistedAssistantMessage._id),
              userId,
            });
            await bridge.emit(sse, "run_cancelled", {
              reason: "aborted",
            }, { runStatus: "cancelled" });
            bridge.writeLegacy(sse, {
              type: "done",
              messageId: String(persistedAssistantMessage._id),
            });
            bridge.close(sse);
            return;
          }
          const errorCode =
            fetchErr instanceof ChatProviderError
              ? fetchErr.errorCode
              : "provider_fetch_error";
          const userFacingError =
            fetchErr instanceof ChatProviderError
              ? fetchErr.message
              : "Failed to reach AI provider";
          await failPersistedAssistantMessage({
            messageId: String(persistedAssistantMessage._id),
            userId,
            errorCode,
            fallbackText: "Sorry, something went wrong. Please try again.",
          });
          await bridge.emit(sse, "run_failed", {
            error: userFacingError,
            errorCode,
          }, { runStatus: "failed" });
          bridge.writeLegacy(sse, {
            type: "error",
            messageId: String(persistedAssistantMessage._id),
            error: userFacingError,
          });
          bridge.writeLegacy(sse, {
            type: "done",
            messageId: String(persistedAssistantMessage._id),
          });
          bridge.close(sse);
          return;
        }

        if (!providerResponse.ok || !providerResponse.body) {
          const errText = await providerResponse.text().catch(() => "unknown");
          logger.error("[chat-orchestrator] Provider error", {
            provider: providerSelection.provider,
            status: providerResponse.status,
            errText,
          });
          await failPersistedAssistantMessage({
            messageId: String(persistedAssistantMessage._id),
            userId,
            errorCode: `provider_${providerResponse.status}`,
            fallbackText: "Sorry, something went wrong. Please try again.",
          });
          await bridge.emit(sse, "run_failed", {
            error: `AI service error (${providerResponse.status})`,
            errorCode: `provider_${providerResponse.status}`,
          }, { runStatus: "failed" });
          bridge.writeLegacy(sse, {
            type: "error",
            messageId: String(persistedAssistantMessage._id),
            error: `AI service error (${providerResponse.status})`,
          });
          bridge.writeLegacy(sse, {
            type: "done",
            messageId: String(persistedAssistantMessage._id),
          });
          bridge.close(sse);
          return;
        }

        // --- 7. Stream deltas from provider → client ---------------------
        let aborted = false;
        let failed = false;
        let chunkCount = 0;

        try {
          for await (const text of readChatProviderDeltas({
            response: providerResponse,
            selection: providerSelection,
            signal,
          })) {
            await appendPersistedAssistantChunk({
              messageId: String(persistedAssistantMessage._id),
              userId,
              delta: text,
            });

            chunkCount++;
            await bridge.emit(sse, "progress_update", {
              message: "Streaming response",
              delta: text,
              chunkIndex: chunkCount,
              messageId: String(persistedAssistantMessage._id),
            }, {
              runStatus: "running",
            });

            bridge.writeLegacy(sse, {
              type: "chunk",
              messageId: String(persistedAssistantMessage._id),
              content: text,
            });
          }
        } catch (err) {
          failed = true;
          const msg = err instanceof Error ? err.message : "Stream error";

          if (err instanceof Error && err.name === "AbortError") {
            aborted = true;
            await stopPersistedAssistantMessage({
              messageId: String(persistedAssistantMessage._id),
              userId,
            });
          } else {
            await failPersistedAssistantMessage({
              messageId: String(persistedAssistantMessage._id),
              userId,
              errorCode: "stream_error",
              fallbackText: "Sorry, something went wrong. Please try again.",
            });
          }

          await bridge.emit(sse, "run_failed", {
            error: msg,
            errorCode: aborted ? "aborted" : "stream_error",
          }, { runStatus: "failed" });

          bridge.writeLegacy(sse, {
            type: "error",
            messageId: String(persistedAssistantMessage._id),
            error: msg,
          });
        } finally {
          if (!aborted && !failed) {
            await completePersistedAssistantMessage({
              messageId: String(persistedAssistantMessage._id),
              userId,
            });
            await hermes.completeRun(runId).catch((err) => {
              logger.warn("[chat-orchestrator] Failed to complete run", {
                runId,
                error: err instanceof Error ? err.message : String(err),
              });
            });

            // Update session lastActive timestamp
            await hermes.resumeSession(session.id).catch((err) => {
              logger.warn("[chat-orchestrator] Failed to touch session", {
                sessionId: session.id,
                error: err instanceof Error ? err.message : String(err),
              });
            });

            // Emit run_completed via the bridge (Redis + SSE)
            await bridge.emit(sse, "run_completed", {
              conversationId: ctx.conversationId,
              totalChunks: chunkCount,
            }, {
              runStatus: "completed",
            });
          }

          bridge.writeLegacy(sse, {
            type: "done",
            messageId: String(persistedAssistantMessage._id),
          });
          bridge.close(sse);
        }
      },
    });

    return {
      runId,
      sessionId: session.id,
      workspaceId: workspace.id,
      conversationId: ctx.conversationId,
      stream,
    };
  }

  /**
   * Resolve the Hermes workspace, session, and chat conversation for a
   * single chat turn.
   *
   * - Workspace: reused if the user already has a chat workspace, created
   *   otherwise. The workspace ID is deterministic per user+surface so
   *   repeated turns land in the same workspace.
   * - Session: if a sessionId is provided, the existing session is resumed.
   *   Otherwise a new session is created, titled from the conversation.
   * - Conversation: if a conversationId is provided, the existing
   *   conversation is loaded. Otherwise a new one is created.
   */
  private async resolveContext(params: {
    userId: string;
    conversationId?: string;
    surface: string;
    modelHandle: string;
    contextRef?: ChatTurnRequest["contextRef"];
    lastUserMessageContent: string;
    providedSessionId?: string;
  }): Promise<ResolvedContext> {
    const hermes = getHermesOrchestrator();

    // --- Resolve conversation (create or load) --------------------------
    let conversationId: string;
    let conversationTitle: string;

    if (params.conversationId) {
      const conv = await getConversationForUser(
        params.conversationId,
        params.userId,
      );
      conversationId = String(conv._id);
      conversationTitle = conv.title;
    } else {
      const conv = await createPersistedConversation({
        userId: params.userId,
        surface: params.surface as any,
        title: params.lastUserMessageContent.slice(0, 80) || "New chat",
        modelHandle: params.modelHandle,
        temporary: false,
        contextRef: params.contextRef,
      });
      conversationId = String(conv._id);
      conversationTitle = conv.title;
    }

    // --- Resolve workspace ----------------------------------------------
    // Reuse the user's chat workspace if one exists, otherwise create one.
    // We store the workspace ID in conversation metadata on first creation
    // so subsequent turns can find it. For now, we use the orchestrator's
    // workspace manager to list user workspaces and find an existing chat
    // workspace, or create a new one.
    const workspace = await this.resolveWorkspace(
      hermes,
      params.userId,
      conversationTitle,
    );

    // --- Resolve session -------------------------------------------------
    let session: HermesSession;
    let sessionResumeMode: ResolvedContext["sessionResumeMode"] = "new_session";
    if (params.providedSessionId) {
      // Resume existing session — verify it exists and belongs to the user
      const sessionCtx = await hermes.getSessionContext(params.providedSessionId);
      if (!sessionCtx) {
        throw new ChatOrchestratorError(
          `Session not found: ${params.providedSessionId}`,
          404,
        );
      }
      if (sessionCtx.session.userId !== params.userId) {
        throw new ChatOrchestratorError(
          "Access denied to session",
          403,
        );
      }
      // Resume the session (sets status to active, updates lastActiveAt)
      await hermes.resumeSession(params.providedSessionId).catch((err) => {
        logger.warn("[chat-orchestrator] Failed to resume session", {
          sessionId: params.providedSessionId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
      session = sessionCtx.session;
      sessionResumeMode = "resume_session";
    } else {
      // Create a new session for this conversation
      session = await hermes.createSession({
        workspaceId: workspace.id,
        userId: params.userId,
        title: conversationTitle,
        description: `Chat conversation: ${conversationTitle}`,
        metadata: {
          conversationId,
          surface: params.surface,
          modelHandle: params.modelHandle,
        },
      });
    }

    return {
      workspace,
      session,
      conversationId,
      sessionResumeMode,
    };
  }

  /**
   * Resolve the Hermes workspace for a user's chat surface.
   *
   * Looks for an existing chat workspace; if none exists, creates one.
   */
  private async resolveWorkspace(
    hermes: ReturnType<typeof getHermesOrchestrator>,
    userId: string,
    fallbackTitle: string,
  ): Promise<HermesWorkspace> {
    const workspaces = await hermes.workspaceManager.getUserWorkspaces(userId, 50);

    // Look for an existing chat workspace by metadata.sourceType
    const chatWorkspace = workspaces.find(
      (ws) =>
        ws.metadata?.sourceType === "chat" ||
        ws.metadata?.chatWorkspace === true,
    );

    if (chatWorkspace) {
      return chatWorkspace;
    }

    // Create a new chat workspace
    return hermes.workspaceManager.createWorkspace({
      userId,
      title: `Chat — ${fallbackTitle}`,
      description: "Default workspace for chat conversations",
      settings: {},
      metadata: {
        sourceType: "chat",
        chatWorkspace: true,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ChatOrchestratorError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "ChatOrchestratorError";
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let chatOrchestratorInstance: ChatOrchestrator | null = null;

export function getChatOrchestrator(): ChatOrchestrator {
  if (!chatOrchestratorInstance) {
    chatOrchestratorInstance = new ChatOrchestrator();
  }
  return chatOrchestratorInstance;
}
