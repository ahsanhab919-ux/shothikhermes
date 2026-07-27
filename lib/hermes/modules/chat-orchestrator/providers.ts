import type { ModelRoute } from "@/lib/hermes/modules/model-router";
import { forwardRouteAdapterRequest } from "@/lib/hermes/modules/model-router/route-adapter";
import type {
  ChatVendorName,
  ChatVendorSelection,
  ChatVendorTransport,
} from "@/lib/hermes/modules/chat-orchestrator/vendor-manager";

export interface ChatProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProviderSelection extends ChatVendorSelection {
  route: ModelRoute;
}

export interface StartChatProviderStreamInput {
  selection: ChatProviderSelection;
  messages: ChatProviderMessage[];
  systemPrompt: string;
  signal?: AbortSignal;
  temperature?: number;
  maxOutputTokens?: number;
}

export class ChatProviderError extends Error {
  constructor(
    message: string,
    public errorCode: string,
    public statusCode: number = 503,
  ) {
    super(message);
    this.name = "ChatProviderError";
  }
}

export async function startChatProviderStream({
  selection,
  messages,
  systemPrompt,
  signal,
  temperature = 0.8,
  maxOutputTokens = 4096,
}: StartChatProviderStreamInput): Promise<Response> {
  if (!selection.apiKey) {
    throw new ChatProviderError(
      `${selection.provider} is not configured`,
      "provider_not_configured",
    );
  }

  return forwardRouteAdapterRequest({
    route: selection.route,
    payload: {
      selection,
      messages,
      systemPrompt,
      temperature,
      maxOutputTokens,
    },
    signal,
  });
}

function extractOpenAiDeltaText(chunk: unknown): string {
  const delta = (chunk as { choices?: Array<{ delta?: { content?: unknown } }> })
    ?.choices?.[0]?.delta?.content;

  if (typeof delta === "string") {
    return delta;
  }

  if (Array.isArray(delta)) {
    return delta
      .map((part) =>
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .join("");
  }

  return "";
}

function extractGeminiDeltaText(chunk: unknown): string {
  const text = (chunk as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  })?.candidates?.[0]?.content?.parts?.[0]?.text;

  return typeof text === "string" ? text : "";
}

function createAbortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

export async function* readChatProviderDeltas(params: {
  response: Response;
  selection: {
    provider: ChatVendorName;
    transport: ChatVendorTransport;
  };
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const reader = params.response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (params.signal?.aborted) {
      throw createAbortError();
    }

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      const text =
        params.selection.transport === "gemini_sse"
          ? extractGeminiDeltaText(parsed)
          : extractOpenAiDeltaText(parsed);

      if (text) {
        yield text;
      }
    }
  }
}

export type { ChatVendorName as ChatProviderName };
