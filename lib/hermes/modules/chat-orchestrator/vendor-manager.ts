import { z } from "zod";

import type { ModelRoute } from "@/lib/hermes/modules/model-router";

export const ChatVendorNameSchema = z.enum([
  "gemini",
  "openai",
  "deepseek",
  "kimi",
]);
export const ChatVendorTransportSchema = z.enum([
  "gemini_sse",
  "openai_sse",
]);

export type ChatVendorName = z.infer<typeof ChatVendorNameSchema>;
export type ChatVendorTransport = z.infer<typeof ChatVendorTransportSchema>;

interface ChatVendorDefinition {
  defaultModel: string;
  transport: ChatVendorTransport;
  apiKeyEnv: string[];
  baseUrlEnv?: string;
  defaultBaseUrl: string;
  defaultPriority: number;
  supportedBackends: Array<ModelRoute["backend"]>;
}

export interface ChatVendorConfig {
  vendor: ChatVendorName;
  defaultModel: string;
  transport: ChatVendorTransport;
  apiKey?: string;
  baseUrl: string;
  priority: number;
  enabled: boolean;
  supportedBackends: Array<ModelRoute["backend"]>;
}

export interface ChatVendorSelection {
  provider: ChatVendorName;
  model: string;
  modelHandle: string;
  transport: ChatVendorTransport;
  apiKey?: string;
  baseUrl: string;
  priority: number;
}

const CHAT_VENDORS: Record<ChatVendorName, ChatVendorDefinition> = {
  gemini: {
    defaultModel: "gemini-2.5-flash",
    transport: "gemini_sse",
    apiKeyEnv: ["AI_INTEGRATIONS_GEMINI_API_KEY", "GEMINI_API_KEY"],
    baseUrlEnv: "AI_INTEGRATIONS_GEMINI_BASE_URL",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    defaultPriority: 10,
    supportedBackends: ["direct_provider"],
  },
  openai: {
    defaultModel: "gpt-4o-mini",
    transport: "openai_sse",
    apiKeyEnv: ["OPENAI_API_KEY"],
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultPriority: 20,
    supportedBackends: ["direct_provider", "nine_router"],
  },
  deepseek: {
    defaultModel: "deepseek-chat",
    transport: "openai_sse",
    apiKeyEnv: ["DEEPSEEK_API_KEY"],
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultPriority: 30,
    supportedBackends: ["direct_provider", "nine_router"],
  },
  kimi: {
    defaultModel: "kimi-k2-thinking",
    transport: "openai_sse",
    apiKeyEnv: ["KIMI_API_KEY"],
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    defaultPriority: 40,
    supportedBackends: ["direct_provider", "nine_router"],
  },
};

function getEnvValue(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return undefined;
}

function isChatVendorName(value: string): value is ChatVendorName {
  return value in CHAT_VENDORS;
}

function parsePriorityOrder() {
  const raw = process.env.CHAT_VENDOR_PRIORITY?.trim();
  if (!raw) {
    return [] as ChatVendorName[];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(isChatVendorName);
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getNineRouterConfig() {
  const baseUrl = process.env.NINE_ROUTER_BASE_URL?.trim();
  const apiKey = process.env.NINE_ROUTER_API_KEY?.trim();

  return {
    baseUrl: baseUrl ? trimTrailingSlash(baseUrl).concat("/v1") : undefined,
    apiKey,
  };
}

function parseRequestedModelHandle(modelHandle?: string) {
  const normalizedHandle = modelHandle?.trim();
  const [prefix, suffix] = normalizedHandle?.split("/", 2) ?? [];
  const hasExplicitVendor =
    Boolean(prefix) && Boolean(suffix) && isChatVendorName(prefix);
  const vendor = hasExplicitVendor ? prefix : undefined;

  return {
    normalizedHandle,
    vendor,
    model: hasExplicitVendor ? suffix : normalizedHandle,
  };
}

export function loadChatVendorConfigs(): ChatVendorConfig[] {
  const explicitPriority = parsePriorityOrder();

  return Object.entries(CHAT_VENDORS)
    .map(([vendorName, definition]) => {
      const vendor = vendorName as ChatVendorName;
      const configuredPriority = explicitPriority.indexOf(vendor);
      const baseUrl =
        (definition.baseUrlEnv && process.env[definition.baseUrlEnv]?.trim()) ||
        definition.defaultBaseUrl;

      return {
        vendor,
        defaultModel: definition.defaultModel,
        transport: definition.transport,
        apiKey: getEnvValue(definition.apiKeyEnv),
        baseUrl: trimTrailingSlash(baseUrl),
        priority:
          configuredPriority >= 0
            ? (configuredPriority + 1) * 10
            : definition.defaultPriority,
        enabled: Boolean(getEnvValue(definition.apiKeyEnv)),
        supportedBackends: definition.supportedBackends,
      };
    })
    .sort((left, right) => left.priority - right.priority);
}

export function listChatVendorCandidates(params?: {
  modelHandle?: string;
  requireConfigured?: boolean;
  backend?: ModelRoute["backend"];
}) {
  const requested = parseRequestedModelHandle(params?.modelHandle);

  return loadChatVendorConfigs().filter((config) => {
    if (params?.requireConfigured && !config.enabled) {
      return false;
    }

    if (params?.backend && !config.supportedBackends.includes(params.backend)) {
      return false;
    }

    if (requested.vendor && config.vendor !== requested.vendor) {
      return false;
    }

    return true;
  });
}

export function verifyChatVendorAdaptation(params: {
  selection: ChatVendorSelection;
  backend: ModelRoute["backend"];
  expectedTransport?: ChatVendorTransport;
}) {
  const definition = CHAT_VENDORS[params.selection.provider];
  if (!definition.supportedBackends.includes(params.backend)) {
    return false;
  }

  if (
    params.expectedTransport &&
    params.selection.transport !== params.expectedTransport
  ) {
    return false;
  }

  if (
    params.backend === "nine_router" &&
    params.selection.transport !== "openai_sse"
  ) {
    return false;
  }

  return true;
}

export function resolveChatVendorSelection(params: {
  modelHandle?: string;
  backend?: ModelRoute["backend"];
  requireConfigured?: boolean;
} = {}): ChatVendorSelection {
  const requested = parseRequestedModelHandle(params.modelHandle);
  const candidates = listChatVendorCandidates({
    modelHandle: params.modelHandle,
    requireConfigured: params.requireConfigured,
    backend: params.backend,
  });

  if (candidates.length === 0) {
    throw new Error(
      requested.vendor
        ? `No chat vendor candidates available for ${requested.vendor}`
        : "No chat vendor candidates available",
    );
  }

  const selected = candidates[0];
  const model = requested.vendor
    ? requested.model || selected.defaultModel
    : requested.normalizedHandle || selected.defaultModel;
  const modelHandle = `${selected.vendor}/${model}`;

  return {
    provider: selected.vendor,
    model,
    modelHandle,
    transport: selected.transport,
    apiKey: selected.apiKey,
    baseUrl: selected.baseUrl,
    priority: selected.priority,
  };
}

export function resolveChatVendorSelectionForRoute(route: ModelRoute) {
  const selection = resolveChatVendorSelection({
    modelHandle: route.modelHandle,
    backend: route.backend,
    requireConfigured: false,
  });
  const nineRouterConfig =
    route.backend === "nine_router" ? getNineRouterConfig() : null;

  const adapted: ChatVendorSelection = {
    ...selection,
    model: route.backend === "nine_router" ? route.modelHandle : route.model,
    modelHandle: route.modelHandle,
    transport: route.transport,
    apiKey: route.apiKey ?? nineRouterConfig?.apiKey ?? selection.apiKey,
    baseUrl: route.baseUrl ?? nineRouterConfig?.baseUrl ?? selection.baseUrl,
  };

  if (
    !verifyChatVendorAdaptation({
      selection: adapted,
      backend: route.backend,
      expectedTransport: route.transport,
    })
  ) {
    throw new Error(
      `Chat vendor adaptation failed for ${route.provider} on backend ${route.backend}`,
    );
  }

  return adapted;
}
