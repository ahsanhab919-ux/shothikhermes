import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readChatProviderDeltas,
  startChatProviderStream,
} from "@/lib/hermes/modules/chat-orchestrator/providers";

describe("chat provider transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("forwards an OpenAI-compatible streaming request through the route adapter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await startChatProviderStream({
      selection: {
        provider: "openai",
        model: "gpt-4o-mini",
        modelHandle: "openai/gpt-4o-mini",
        transport: "openai_sse",
        apiKey: "openai-key",
        baseUrl: "https://api.openai.com/v1",
        priority: 20,
        route: {
          routeId: "route_1",
          capabilityId: "conversation.respond",
          backend: "direct_provider",
          provider: "openai",
          model: "gpt-4o-mini",
          modelHandle: "openai/gpt-4o-mini",
          transport: "openai_sse",
          reason: "test",
          fallbackChain: [],
          observabilityLabels: {},
        },
      },
      systemPrompt: "You are Shothik.",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer openai-key",
        }),
        body: expect.any(String),
      }),
    );

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body as string);
    expect(body).toMatchObject({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: "You are Shothik." },
        { role: "user", content: "Hello" },
      ],
    });
  });

  it("parses Gemini SSE deltas", async () => {
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n',
            ),
          );
          controller.enqueue(
            encoder.encode(
              'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n',
            ),
          );
          controller.close();
        },
      }),
    );

    const chunks: string[] = [];
    for await (const chunk of readChatProviderDeltas({
      response,
      selection: {
        provider: "gemini",
        transport: "gemini_sse",
      },
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Hello", " world"]);
  });

  it("parses OpenAI-compatible SSE deltas", async () => {
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
            ),
          );
          controller.enqueue(
            encoder.encode(
              'data: {"choices":[{"delta":{"content":" world"}}]}\n',
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n"));
          controller.close();
        },
      }),
    );

    const chunks: string[] = [];
    for await (const chunk of readChatProviderDeltas({
      response,
      selection: {
        provider: "openai",
        transport: "openai_sse",
      },
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Hello", " world"]);
  });
});
