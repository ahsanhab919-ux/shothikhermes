import { NextRequest } from "next/server";
import type { ChatAttachment } from "@/lib/chat/types";
import type {
  ChatEncryptedEnvelope,
  ChatPrivacyProfile,
  ChatSyncDescriptor,
} from "@/lib/chat/types";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getChatOrchestrator, ChatOrchestratorError } from "@/lib/hermes/modules/chat-orchestrator";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import {
  adjustGauge,
  incrementCounter,
  maybeLogMetrics,
  recordDistribution,
  setGauge,
} from "@/lib/runtime-metrics";

/**
 * Chat API Gateway Handler
 *
 * Per ADR-003, this route is a thin gateway:
 *   authenticate → rate-limit → validate → delegate to ChatOrchestrator → relay SSE
 *
 * All orchestration (provider calls, message lifecycle, run management)
 * lives in lib/hermes/modules/chat-orchestrator.
 */

function recordChatRequestMetrics(status: number, durationMs: number): void {
  incrementCounter(`chat.responses.${status}`);
  incrementCounter(`chat.responses.${Math.floor(status / 100)}xx`);
  recordDistribution("chat.request.duration_ms", durationMs);
  recordDistribution(
    `chat.request.duration_ms.${Math.floor(status / 100)}xx`,
    durationMs,
  );
  setGauge("chat.requests.last_status_code", status);
  setGauge("chat.requests.last_duration_ms", durationMs);
  maybeLogMetrics();
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let responseStatus = 500;

  incrementCounter("chat.requests.total");
  adjustGauge("chat.requests.active", 1);

  try {
    // --- 1. Authenticate ---
    const user = await getChatAuthenticatedUser();
    if (!user?._id) {
      responseStatus = 401;
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "INSFORGE_SESSION_REQUIRED",
          message: "Please sign in again to continue using chat.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // --- 2. Rate limit ---
    const identifier = getRateLimitKey(request, "chat");
    const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
      windowMs: 60_000,
      maxRequests: 30,
    });
    if (!allowed) {
      incrementCounter("chat.rate_limit.exceeded");
      responseStatus = 429;
      return rateLimitResponse(remaining, resetAt);
    }

    // --- 3. Parse & validate request body ---
    const body = await request.json();
    const {
      messages,
      context,
      attachments,
      conversationId,
      surface,
      modelHandle,
      contextRef,
      sessionId: providedSessionId,
      runId: providedRunId,
      documentIntent,
      sourceUrl,
      privacy,
      sync,
      clientEncrypted,
    } = body as {
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
      sessionId?: string;
      runId?: string;
      contextRef?: {
        projectId?: string;
        bookId?: string;
        sheetId?: string;
        researchId?: string;
        localProjectId?: string;
        agentType?: string;
      };
      /** Document intelligence intent (e.g. "ingest", "summarize", "notes") */
      documentIntent?: string;
      /** Optional document source URL (e.g. pasted PDF link) */
      sourceUrl?: string;
      privacy?: ChatPrivacyProfile;
      sync?: ChatSyncDescriptor;
      clientEncrypted?: ChatEncryptedEnvelope;
    };

    if (surface) {
      incrementCounter(`chat.surface.${surface}.requests`);
    }

    if (!messages || messages.length === 0) {
      incrementCounter("chat.validation.failed");
      responseStatus = 400;
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // --- 4. Delegate to ChatOrchestrator ---
    const orchestrator = getChatOrchestrator();

    const result = await orchestrator.executeChatTurn({
      userId: String(user._id),
      messages,
      context,
      attachments,
      conversationId,
      surface,
      modelHandle,
      contextRef,
      sessionId: providedSessionId,
      runId: providedRunId,
      documentIntent,
      sourceUrl,
      privacy,
      sync,
      clientEncrypted,
      sourceRequestPath: request.nextUrl.pathname,
      sourceRequestUrl: request.url,
      signal: request.signal,
    });

    // --- 5. Relay the SSE stream ---
    responseStatus = 200;
    return new Response(result.stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof ChatOrchestratorError) {
      incrementCounter("chat.errors.orchestrator");
      responseStatus = error.statusCode;
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    incrementCounter("chat.errors.unhandled");
    console.error("[chat] Gateway error:", message);
    responseStatus = 500;
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  } finally {
    adjustGauge("chat.requests.active", -1);
    recordChatRequestMetrics(responseStatus, Date.now() - startedAt);
  }
}
