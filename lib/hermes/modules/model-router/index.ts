import { randomUUID } from "crypto";
import { z } from "zod";

import { getHermesCapabilityRegistry } from "@/lib/hermes/modules/capability-registry";

type SupportedModelProvider = "gemini" | "openai" | "deepseek" | "kimi";
type ModelTransport = "gemini_sse" | "openai_sse";
const DEFAULT_MODEL_BY_PROVIDER: Record<SupportedModelProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  kimi: "kimi-k2-thinking",
};
const DEFAULT_TRANSPORT_BY_PROVIDER: Record<SupportedModelProvider, ModelTransport> = {
  gemini: "gemini_sse",
  openai: "openai_sse",
  deepseek: "openai_sse",
  kimi: "openai_sse",
};

export const ModelRouteBackendSchema = z.enum(["direct_provider", "nine_router"]);
export const ModelRoutePrivacyClassSchema = z.enum([
  "standard",
  "sensitive",
  "restricted",
]);
export const ModelRouteTaskTypeSchema = z.enum([
  "conversation",
  "planning",
  "retrieval",
  "document",
  "multimodal",
]);
export const ModelRouteLatencyTargetSchema = z.enum([
  "realtime",
  "interactive",
  "background",
]);
export const ModelRouteCostPolicySchema = z.enum([
  "lowest_cost",
  "balanced",
  "highest_quality",
]);
export const ModelRouteDomainSchema = z.enum([
  "chat",
  "documents",
  "slides",
  "sheets",
  "research",
  "writing",
  "books",
]);

export const ModelRouteRequestSchema = z.object({
  capabilityId: z.string().min(1),
  modelHandle: z.string().min(1).optional(),
  domain: ModelRouteDomainSchema.default("chat"),
  taskType: ModelRouteTaskTypeSchema,
  privacyClass: ModelRoutePrivacyClassSchema.default("standard"),
  latencyTarget: ModelRouteLatencyTargetSchema.default("interactive"),
  costPolicy: ModelRouteCostPolicySchema.default("balanced"),
  fallbackAllowed: z.boolean().default(true),
  streamingRequired: z.boolean().default(true),
  preferBackend: ModelRouteBackendSchema.optional(),
});

export const ModelRouteSchema = z.object({
  routeId: z.string().min(1),
  capabilityId: z.string().min(1),
  backend: ModelRouteBackendSchema,
  provider: z.enum(["gemini", "openai", "deepseek", "kimi"]),
  model: z.string().min(1),
  modelHandle: z.string().min(1),
  transport: z.enum(["gemini_sse", "openai_sse"]),
  baseUrl: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  reason: z.string().min(1),
  fallbackChain: z.array(z.string()),
  observabilityLabels: z.record(z.string(), z.string()),
});

export type ModelRouteBackend = z.infer<typeof ModelRouteBackendSchema>;
export type ModelRoutePrivacyClass = z.infer<
  typeof ModelRoutePrivacyClassSchema
>;
export type ModelRouteTaskType = z.infer<typeof ModelRouteTaskTypeSchema>;
export type ModelRouteLatencyTarget = z.infer<
  typeof ModelRouteLatencyTargetSchema
>;
export type ModelRouteCostPolicy = z.infer<typeof ModelRouteCostPolicySchema>;
export type ModelRouteDomain = z.infer<typeof ModelRouteDomainSchema>;
export type ResolveModelRouteInput = z.infer<typeof ModelRouteRequestSchema>;
export type ModelRoute = z.infer<typeof ModelRouteSchema>;

function isSupportedProvider(value: string): value is SupportedModelProvider {
  return value in DEFAULT_MODEL_BY_PROVIDER;
}

function parseRequestedModelHandle(modelHandle?: string) {
  const normalizedHandle = modelHandle?.trim();
  const [prefix, suffix] = normalizedHandle?.split("/", 2) ?? [];
  const provider: SupportedModelProvider =
    prefix && suffix && isSupportedProvider(prefix) ? prefix : "gemini";
  const providerModel =
    prefix && suffix && isSupportedProvider(prefix)
      ? suffix
      : normalizedHandle || DEFAULT_MODEL_BY_PROVIDER[provider];

  return {
    provider,
    providerModel,
    canonicalModelHandle: `${provider}/${providerModel}`,
  };
}

function buildFallbackChain(
  provider: SupportedModelProvider,
  fallbackAllowed: boolean,
) {
  if (!fallbackAllowed) {
    return [];
  }

  const candidates: Record<SupportedModelProvider, string[]> = {
    gemini: ["openai/gpt-4o-mini"],
    openai: ["deepseek/deepseek-chat", "kimi/kimi-k2-thinking"],
    deepseek: ["openai/gpt-4o-mini", "kimi/kimi-k2-thinking"],
    kimi: ["openai/gpt-4o-mini", "deepseek/deepseek-chat"],
  };

  return candidates[provider];
}

function supportsNineRouter(provider: SupportedModelProvider) {
  return provider !== "gemini";
}

function shouldUseNineRouter(
  input: ResolveModelRouteInput,
  provider: SupportedModelProvider,
) {
  if (!supportsNineRouter(provider)) {
    return false;
  }

  if (input.privacyClass !== "standard") {
    return false;
  }

  if (input.preferBackend === "direct_provider") {
    return false;
  }

  const baseUrl = process.env.NINE_ROUTER_BASE_URL?.trim();
  const apiKey = process.env.NINE_ROUTER_API_KEY?.trim();
  const enabled = process.env.NINE_ROUTER_DEFAULT_ENABLED?.trim() === "true";

  if (!(baseUrl && apiKey)) {
    return false;
  }

  if (input.preferBackend === "nine_router") {
    return true;
  }

  return enabled;
}

export function mapChatPrivacyModeToModelRouteClass(
  mode: "standard" | "sensitive" | "encrypted_sync" | undefined,
): ModelRoutePrivacyClass {
  if (mode === "encrypted_sync") {
    return "restricted";
  }

  if (mode === "sensitive") {
    return "sensitive";
  }

  return "standard";
}

export function resolveHermesModelRoute(rawInput: ResolveModelRouteInput) {
  const input = ModelRouteRequestSchema.parse(rawInput);
  const registry = getHermesCapabilityRegistry();
  registry.requireCapability(input.capabilityId);

  const requestedModel = parseRequestedModelHandle(input.modelHandle);
  const useNineRouter = shouldUseNineRouter(input, requestedModel.provider);

  if (useNineRouter) {
    return ModelRouteSchema.parse({
      routeId: `route_${randomUUID()}`,
      capabilityId: input.capabilityId,
      backend: "nine_router",
      provider: requestedModel.provider,
      model: requestedModel.canonicalModelHandle,
      modelHandle: requestedModel.canonicalModelHandle,
      transport: "openai_sse",
      reason:
        input.preferBackend === "nine_router"
          ? "9router requested explicitly for this route"
          : "9router enabled for standard traffic and supported provider",
      fallbackChain: buildFallbackChain(
        requestedModel.provider,
        input.fallbackAllowed,
      ),
      observabilityLabels: {
        capability: input.capabilityId,
        backend: "nine_router",
        provider: requestedModel.provider,
        domain: input.domain,
        taskType: input.taskType,
      },
    });
  }

  return ModelRouteSchema.parse({
    routeId: `route_${randomUUID()}`,
    capabilityId: input.capabilityId,
    backend: "direct_provider",
    provider: requestedModel.provider,
    model: requestedModel.providerModel,
    modelHandle: requestedModel.canonicalModelHandle,
    transport: DEFAULT_TRANSPORT_BY_PROVIDER[requestedModel.provider],
    reason:
      input.privacyClass !== "standard"
        ? "Direct provider route selected due to privacy policy"
        : "Direct provider route selected by default policy",
    fallbackChain: buildFallbackChain(
      requestedModel.provider,
      input.fallbackAllowed,
    ),
    observabilityLabels: {
      capability: input.capabilityId,
      backend: "direct_provider",
      provider: requestedModel.provider,
      domain: input.domain,
      taskType: input.taskType,
    },
  });
}
