import { z } from "zod";

import {
  ArtifactDomainSchema,
  CapabilityMetadataSchema,
  CapabilityRegistrySchema,
  ModelCapabilitySchema,
  ToolCapabilitySchema,
  type ArtifactDomain,
  type CapabilityRegistry,
  type ModelCapability,
  type ToolCapability,
} from "@/lib/hermes/contracts/core";

export const HermesCapabilityExecutionModeSchema = z.enum([
  "model",
  "tool",
  "internal",
  "hybrid",
]);

export const HermesCapabilityDefinitionSchema = CapabilityMetadataSchema.extend({
  ownerModule: z.string().min(1),
  executionMode: HermesCapabilityExecutionModeSchema,
  supportedDomains: z.array(ArtifactDomainSchema).min(1),
  requiresUserConsent: z.boolean().default(false),
  requiresElevatedBilling: z.boolean().default(false),
  modelDependencies: z.array(z.string()).default([]),
  toolDependencies: z.array(z.string()).default([]),
});

export type HermesCapabilityExecutionMode = z.infer<
  typeof HermesCapabilityExecutionModeSchema
>;
export type HermesCapabilityDefinition = z.infer<
  typeof HermesCapabilityDefinitionSchema
>;

const CAPABILITY_DEFINITIONS: HermesCapabilityDefinition[] = [
  HermesCapabilityDefinitionSchema.parse({
    id: "conversation.respond",
    name: "Conversation Response",
    description: "Generate an interactive assistant reply for a user turn.",
    type: "model",
    version: "1.0.0",
    enabled: true,
    ownerModule: "chat-orchestrator",
    executionMode: "model",
    supportedDomains: ["chat", "research", "writing", "books"],
    modelDependencies: ["gemini/gemini-2.5-flash", "openai/gpt-4o-mini"],
    metadata: {
      defaultTaskType: "conversation",
      defaultLatencyTarget: "realtime",
    },
  }),
  HermesCapabilityDefinitionSchema.parse({
    id: "reasoning.plan",
    name: "Reasoning Plan",
    description: "Produce a structured planning-oriented answer for complex turns.",
    type: "model",
    version: "1.0.0",
    enabled: true,
    ownerModule: "chat-orchestrator",
    executionMode: "model",
    supportedDomains: ["chat", "research", "writing", "books", "documents"],
    requiresElevatedBilling: true,
    modelDependencies: ["kimi/kimi-k2-thinking", "openai/gpt-4o-mini"],
    metadata: {
      defaultTaskType: "planning",
      defaultLatencyTarget: "interactive",
    },
  }),
  HermesCapabilityDefinitionSchema.parse({
    id: "retrieval.search",
    name: "Retrieval Search",
    description: "Blend retrieval context into a grounded response workflow.",
    type: "workflow",
    version: "1.0.0",
    enabled: true,
    ownerModule: "chat-orchestrator",
    executionMode: "hybrid",
    supportedDomains: ["chat", "research", "writing", "documents"],
    modelDependencies: ["openai/gpt-4o-mini"],
    toolDependencies: ["workspace.search"],
    metadata: {
      defaultTaskType: "retrieval",
      retrievalRequired: true,
    },
  }),
  HermesCapabilityDefinitionSchema.parse({
    id: "document.ingest",
    name: "Document Ingestion",
    description: "Ingest and normalize an uploaded or linked document.",
    type: "workflow",
    version: "1.0.0",
    enabled: true,
    ownerModule: "document-ingestion-orchestrator",
    executionMode: "internal",
    supportedDomains: ["documents", "chat", "research", "writing"],
    metadata: {
      defaultTaskType: "document",
    },
  }),
];

const MODEL_CAPABILITIES: ModelCapability[] = [
  ModelCapabilitySchema.parse({
    id: "gemini/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Low-latency Gemini model used for interactive turns.",
    type: "model",
    version: "gemini-2.5-flash",
    enabled: true,
    provider: "google",
    modelId: "gemini-2.5-flash",
    contextWindow: 1_000_000,
    maxTokens: 8_192,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: true,
  }),
  ModelCapabilitySchema.parse({
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Balanced OpenAI model for fast general-purpose responses.",
    type: "model",
    version: "gpt-4o-mini",
    enabled: true,
    provider: "openai",
    modelId: "gpt-4o-mini",
    contextWindow: 128_000,
    maxTokens: 16_384,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsVision: true,
  }),
  ModelCapabilitySchema.parse({
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    description: "Cost-efficient OpenAI-compatible fallback model.",
    type: "model",
    version: "deepseek-chat",
    enabled: true,
    provider: "custom",
    modelId: "deepseek-chat",
    contextWindow: 64_000,
    maxTokens: 8_192,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  }),
  ModelCapabilitySchema.parse({
    id: "kimi/kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    description: "Higher-reasoning Moonshot/Kimi model for planning-heavy turns.",
    type: "model",
    version: "kimi-k2-thinking",
    enabled: true,
    provider: "custom",
    modelId: "kimi-k2-thinking",
    contextWindow: 128_000,
    maxTokens: 16_384,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  }),
];

const TOOL_CAPABILITIES: ToolCapability[] = [
  ToolCapabilitySchema.parse({
    id: "workspace.search",
    name: "Workspace Search",
    description: "Search workspace-scoped context and artifacts.",
    type: "tool",
    version: "1.0.0",
    enabled: true,
    toolName: "workspace_search",
    inputSchema: {
      query: { type: "string", required: true },
      workspaceId: { type: "string", required: true },
    },
    outputSchema: {
      results: { type: "array" },
    },
    requiredPermissions: ["workspace.read"],
  }),
];

const REGISTRY_VERSION = "1.0.0";
const REGISTRY_UPDATED_AT = "2026-07-26T00:00:00.000Z";

export class HermesCapabilityRegistryService {
  private readonly registry: CapabilityRegistry;

  constructor() {
    this.registry = CapabilityRegistrySchema.parse({
      capabilities: CAPABILITY_DEFINITIONS,
      models: MODEL_CAPABILITIES,
      tools: TOOL_CAPABILITIES,
      lastUpdated: REGISTRY_UPDATED_AT,
      version: REGISTRY_VERSION,
    });
  }

  getRegistry(): CapabilityRegistry {
    return this.registry;
  }

  listCapabilities(params?: { domain?: ArtifactDomain; enabledOnly?: boolean }) {
    return CAPABILITY_DEFINITIONS.filter((capability) => {
      if (params?.enabledOnly !== false && !capability.enabled) {
        return false;
      }

      if (params?.domain && !capability.supportedDomains.includes(params.domain)) {
        return false;
      }

      return true;
    });
  }

  getCapability(id: string) {
    return CAPABILITY_DEFINITIONS.find((capability) => capability.id === id);
  }

  requireCapability(id: string) {
    const capability = this.getCapability(id);
    if (!capability) {
      throw new Error(`Unknown Hermes capability: ${id}`);
    }

    return capability;
  }

  getModelCapability(id: string) {
    return MODEL_CAPABILITIES.find((model) => model.id === id);
  }

  getToolCapability(id: string) {
    return TOOL_CAPABILITIES.find((tool) => tool.id === id);
  }
}

let capabilityRegistrySingleton: HermesCapabilityRegistryService | null = null;

export function getHermesCapabilityRegistry() {
  if (!capabilityRegistrySingleton) {
    capabilityRegistrySingleton = new HermesCapabilityRegistryService();
  }

  return capabilityRegistrySingleton;
}
