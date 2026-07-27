import type { ChatProviderMessage } from "@/lib/hermes/modules/chat-orchestrator/providers";
import type { ChatVendorSelection } from "@/lib/hermes/modules/chat-orchestrator/vendor-manager";
import type { ModelRoute } from "@/lib/hermes/modules/model-router";

export interface RouteAdapterPayload {
  selection: ChatVendorSelection;
  messages: ChatProviderMessage[];
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface RouteAdapterResolvedTarget {
  ruleId: string;
  targetService: string;
  requestUrl: string;
  headers: Record<string, string>;
  body: string;
}

interface RouteAdapterRule {
  id: string;
  matches(route: ModelRoute, selection: ChatVendorSelection): boolean;
  resolve(route: ModelRoute, payload: RouteAdapterPayload): RouteAdapterResolvedTarget;
}

function buildGeminiContents(messages: ChatProviderMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function buildOpenAiMessages(
  messages: ChatProviderMessage[],
  systemPrompt: string,
) {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const ROUTE_ADAPTER_RULES: RouteAdapterRule[] = [
  {
    id: "nine_router_openai_forward",
    matches: (route, selection) =>
      route.backend === "nine_router" && selection.transport === "openai_sse",
    resolve(route, payload) {
      return {
        ruleId: "nine_router_openai_forward",
        targetService: "9router_gateway",
        requestUrl: `${trimTrailingSlash(payload.selection.baseUrl)}/chat/completions`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.selection.apiKey ?? ""}`,
        },
        body: JSON.stringify({
          model: payload.selection.model,
          stream: true,
          temperature: payload.temperature,
          max_tokens: payload.maxOutputTokens,
          messages: buildOpenAiMessages(payload.messages, payload.systemPrompt),
        }),
      };
    },
  },
  {
    id: "direct_provider_gemini_stream",
    matches: (route, selection) =>
      route.backend === "direct_provider" && selection.transport === "gemini_sse",
    resolve(route, payload) {
      return {
        ruleId: "direct_provider_gemini_stream",
        targetService: "google_generative_language",
        requestUrl: `${trimTrailingSlash(payload.selection.baseUrl)}/models/${payload.selection.model}:streamGenerateContent?alt=sse&key=${payload.selection.apiKey ?? ""}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: buildGeminiContents(payload.messages),
          system_instruction: { parts: [{ text: payload.systemPrompt }] },
          generationConfig: {
            maxOutputTokens: payload.maxOutputTokens,
            temperature: payload.temperature,
          },
        }),
      };
    },
  },
  {
    id: "direct_provider_openai_compatible_stream",
    matches: (route, selection) =>
      route.backend === "direct_provider" && selection.transport === "openai_sse",
    resolve(route, payload) {
      const serviceMap: Record<ModelRoute["provider"], string> = {
        gemini: "google_generative_language",
        openai: "openai_api",
        deepseek: "deepseek_api",
        kimi: "moonshot_api",
      };

      return {
        ruleId: "direct_provider_openai_compatible_stream",
        targetService: serviceMap[route.provider],
        requestUrl: `${trimTrailingSlash(payload.selection.baseUrl)}/chat/completions`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.selection.apiKey ?? ""}`,
        },
        body: JSON.stringify({
          model: payload.selection.model,
          stream: true,
          temperature: payload.temperature,
          max_tokens: payload.maxOutputTokens,
          messages: buildOpenAiMessages(payload.messages, payload.systemPrompt),
        }),
      };
    },
  },
];

export function describeRouteAdapterTarget(
  route: ModelRoute,
  selection: ChatVendorSelection,
) {
  const matchedRule = ROUTE_ADAPTER_RULES.find((rule) =>
    rule.matches(route, selection),
  );

  if (!matchedRule) {
    throw new Error(
      `No route adapter rule matched backend=${route.backend} provider=${route.provider} transport=${selection.transport}`,
    );
  }

  const requestUrl =
    route.backend === "nine_router"
      ? `${trimTrailingSlash(selection.baseUrl)}/chat/completions`
      : selection.transport === "gemini_sse"
        ? `${trimTrailingSlash(selection.baseUrl)}/models/${selection.model}:streamGenerateContent`
        : `${trimTrailingSlash(selection.baseUrl)}/chat/completions`;

  const targetService =
    matchedRule.id === "nine_router_openai_forward"
      ? "9router_gateway"
      : matchedRule.id === "direct_provider_gemini_stream"
        ? "google_generative_language"
        : route.provider === "openai"
          ? "openai_api"
          : route.provider === "deepseek"
            ? "deepseek_api"
            : route.provider === "kimi"
              ? "moonshot_api"
              : "google_generative_language";

  return {
    ruleId: matchedRule.id,
    targetService,
    requestUrl,
  };
}

export function resolveRouteAdapterTarget(
  route: ModelRoute,
  payload: RouteAdapterPayload,
) {
  const matchedRule = ROUTE_ADAPTER_RULES.find((rule) =>
    rule.matches(route, payload.selection),
  );

  if (!matchedRule) {
    throw new Error(
      `No route adapter rule matched backend=${route.backend} provider=${route.provider} transport=${payload.selection.transport}`,
    );
  }

  return matchedRule.resolve(route, payload);
}

export async function forwardRouteAdapterRequest(params: {
  route: ModelRoute;
  payload: RouteAdapterPayload;
  signal?: AbortSignal;
}) {
  const target = resolveRouteAdapterTarget(params.route, params.payload);

  return fetch(target.requestUrl, {
    method: "POST",
    headers: target.headers,
    body: target.body,
    signal: params.signal,
  });
}
