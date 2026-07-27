import { z } from "zod";

/**
 * Core Hermes Domain Types (ADR-001 Extension)
 * 
 * Defines the canonical run/artifact/workspace contracts for the
 * modular monolith backend orchestration layer.
 */

export const WorkspaceIdSchema = z.string().min(1);
export const SessionIdSchema = z.string().min(1);
export const RunIdSchema = z.string().min(1);
export const ArtifactIdSchema = z.string().min(1);
export const UserIdSchema = z.string().min(1);

export type WorkspaceId = z.infer<typeof WorkspaceIdSchema>;
export type SessionId = z.infer<typeof SessionIdSchema>;
export type RunId = z.infer<typeof RunIdSchema>;
export type ArtifactId = z.infer<typeof ArtifactIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;

/**
 * Chat workflow and planning metadata
 */
export const ChatWorkflowSchema = z.enum([
  "default",
  "spec",
]);

export type ChatWorkflow = z.infer<typeof ChatWorkflowSchema>;

export const ChatExecutionIntentSchema = z.object({
  intentClass: z.enum([
    "answer",
    "retrieve",
    "tool",
    "execute",
    "interactive_terminal",
  ]),
  complexity: z.enum(["low", "medium", "high"]),
  privacyMode: z.enum(["normal", "sensitive", "local_only"]),
  latencyBudget: z.enum(["realtime", "interactive", "background"]),
  artifactExpectation: z.enum(["none", "possible", "expected"]),
  requiresNetwork: z.boolean(),
  requiresFilesystem: z.boolean(),
  requiresShell: z.boolean(),
  requiresLongLivedSession: z.boolean(),
});

export type ChatExecutionIntent = z.infer<typeof ChatExecutionIntentSchema>;

export const HermesRetrievalPlanSchema = z.object({
  intent: z.enum([
    "known_item_lookup",
    "workspace_knowledge_lookup",
    "open_web_research",
    "entity_relationship_reasoning",
    "recommendation",
    "action_grounded_retrieval",
    "none",
  ]),
  preferredSources: z.array(
    z.enum(["workspace", "artifacts", "session_memory", "web", "docs", "graph"]),
  ),
  mode: z.enum(["none", "keyword", "semantic", "hybrid", "graph", "blended"]),
  freshness: z.enum(["cached", "recent", "live"]).default("cached"),
  trustWeighting: z.enum(["default", "authority", "workspace_first"]).default("default"),
  personalizationScope: z.enum(["none", "session", "user", "workspace"]).default("none"),
  costBudget: z.enum(["low", "medium", "high"]).default("low"),
});

export type HermesRetrievalPlan = z.infer<typeof HermesRetrievalPlanSchema>;

export const ChatExecutionMetadataSchema = z.object({
  workflow: ChatWorkflowSchema.default("default"),
  workflowArgument: z.string().min(1).optional(),
  lane: z.enum(["lane_0", "lane_1", "lane_2", "lane_3", "lane_4"]),
  maxModelTier: z.enum(["cheap", "standard", "advanced", "frontier"]),
  estimatedCostTier: z.enum(["low", "medium", "high"]),
  resumeMode: z.enum(["new_session", "resume_session", "resume_run"]).default("new_session"),
  intent: ChatExecutionIntentSchema,
  retrievalPlan: HermesRetrievalPlanSchema,
});

export type ChatExecutionMetadata = z.infer<typeof ChatExecutionMetadataSchema>;

/**
 * Artifact Domain Types
 */
export const ArtifactDomainSchema = z.enum([
  "chat",
  "documents",
  "notes",
  "slides",
  "sheets",
  "research",
  "writing",
  "books",
  "ai-detector",
  "plagiarism",
  "publish"
]);

export type ArtifactDomain = z.infer<typeof ArtifactDomainSchema>;

/**
 * Run Status Lifecycle
 */
export const RunStatusSchema = z.enum([
  "created",
  "planning", 
  "running",
  "paused",
  "resumed",
  "completed",
  "failed",
  "cancelled"
]);

export type RunStatus = z.infer<typeof RunStatusSchema>;

/**
 * Artifact Status Lifecycle  
 */
export const ArtifactStatusSchema = z.enum([
  "initializing",
  "generating",
  "ready",
  "updating", 
  "versioned",
  "archived"
]);

export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

/**
 * Canonical Hermes Run Record
 */
export const HermesRunSchema = z.object({
  id: RunIdSchema,
  sessionId: SessionIdSchema.optional(),
  workspaceId: WorkspaceIdSchema,
  userId: UserIdSchema,
  domain: ArtifactDomainSchema,
  status: RunStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  config: z.record(z.string(), z.unknown()).default({}),
});

export type HermesRun = z.infer<typeof HermesRunSchema>;

/**
 * Canonical Hermes Artifact Record
 */
export const HermesArtifactSchema = z.object({
  id: ArtifactIdSchema,
  workspaceId: WorkspaceIdSchema,
  runId: RunIdSchema,
  userId: UserIdSchema,
  domain: ArtifactDomainSchema,
  status: ArtifactStatusSchema,
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  content: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  version: z.number().int().positive().default(1),
});

export type HermesArtifact = z.infer<typeof HermesArtifactSchema>;

/**
 * Canonical Hermes Workspace Record
 */
export const HermesWorkspaceSchema = z.object({
  id: WorkspaceIdSchema,
  userId: UserIdSchema,
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  settings: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type HermesWorkspace = z.infer<typeof HermesWorkspaceSchema>;

/**
 * Session Status Lifecycle
 */
export const SessionStatusSchema = z.enum([
  "active",
  "paused",
  "archived",
  "expired"
]);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Canonical Hermes Session Record
 */
export const HermesSessionSchema = z.object({
  id: SessionIdSchema,
  workspaceId: WorkspaceIdSchema,
  userId: UserIdSchema,
  title: z.string(),
  description: z.string().optional(),
  status: SessionStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  lastActiveAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type HermesSession = z.infer<typeof HermesSessionSchema>;

/**
 * Event Types for Streaming Engine
 */
export const HermesEventTypeSchema = z.enum([
  "session_created",
  "session_resumed",
  "session_paused",
  "session_archived",
  "run_created",
  "run_started", 
  "run_paused",
  "run_resumed",
  "plan_generated",
  "tool_call_start",
  "tool_call_complete",
  "tool_call_error",
  "progress_update",
  "artifact_created",
  "artifact_updated", 
  "artifact_versioned",
  "artifact_ready",
  "checkpoint_created",
  "handoff_requested",
  "document_ingestion_started",
  "document_ingestion_progress",
  "document_ingestion_completed",
  "document_structure_detected",
  "document_semantics_ready",
  "export_started",
  "export_completed",
  "run_completed",
  "run_failed",
  "run_cancelled"
]);

export type HermesEventType = z.infer<typeof HermesEventTypeSchema>;

/**
 * Enhanced Event Envelope (extends existing slides contract)
 */
export const HermesEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: SessionIdSchema.optional(),
  runId: RunIdSchema.optional(),
  workspaceId: WorkspaceIdSchema,
  artifactId: ArtifactIdSchema.optional(),
  domain: ArtifactDomainSchema.optional(),
  eventType: HermesEventTypeSchema,
  timestamp: z.string().datetime({ offset: true }),
  sequence: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type HermesEventEnvelope = z.infer<typeof HermesEventEnvelopeSchema>;

/**
 * Lightweight Redis-backed run snapshot for UI bootstrap and polling.
 */
export const HermesRunHotStateSchema = z.object({
  runId: RunIdSchema,
  workspaceId: WorkspaceIdSchema,
  status: RunStatusSchema.optional(),
  domain: ArtifactDomainSchema.optional(),
  lastEventType: HermesEventTypeSchema,
  lastSequence: z.number().int().nonnegative(),
  message: z.string().optional(),
  artifactId: ArtifactIdSchema.optional(),
  updatedAt: z.string().datetime({ offset: true }),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type HermesRunHotState = z.infer<typeof HermesRunHotStateSchema>;

/**
 * Tool Invocation Contract
 */
export const HermesToolCallSchema = z.object({
  id: z.string(),
  runId: RunIdSchema,
  toolName: z.string(),
  input: z.record(z.string(), z.unknown()),
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "failed"]),
});

export type HermesToolCall = z.infer<typeof HermesToolCallSchema>;

/**
 * Command Base Interface
 */
export const HermesCommandBaseSchema = z.object({
  requestId: z.string().min(1),
  workspaceId: WorkspaceIdSchema,
  userId: UserIdSchema,
  timestamp: z.string().datetime({ offset: true }).optional(),
});

export type HermesCommandBase = z.infer<typeof HermesCommandBaseSchema>;

/**
 * Error Response Contract
 */
export const HermesErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime({ offset: true }),
  requestId: z.string().optional(),
});

export type HermesError = z.infer<typeof HermesErrorSchema>;

/**
 * API Response Envelope
 */
export const HermesResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: HermesErrorSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type HermesResponse<T = unknown> = Omit<z.infer<typeof HermesResponseSchema>, 'data'> & {
  data?: T;
};

/**
 * Session API Commands
 */
export const CreateSessionCommandSchema = HermesCommandBaseSchema.extend({
  title: z.string(),
  description: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
});

export const ResumeSessionCommandSchema = HermesCommandBaseSchema.extend({
  sessionId: SessionIdSchema,
});

export const ListSessionsCommandSchema = HermesCommandBaseSchema.extend({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  status: SessionStatusSchema.optional(),
});

export type CreateSessionCommand = z.infer<typeof CreateSessionCommandSchema>;
export type ResumeSessionCommand = z.infer<typeof ResumeSessionCommandSchema>;
export type ListSessionsCommand = z.infer<typeof ListSessionsCommandSchema>;

/**
 * Run API Commands  
 */
export const CreateRunCommandSchema = HermesCommandBaseSchema.extend({
  sessionId: SessionIdSchema.optional(),
  domain: ArtifactDomainSchema,
  config: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const GetRunStatusCommandSchema = HermesCommandBaseSchema.extend({
  runId: RunIdSchema,
});

export const ListRunsCommandSchema = HermesCommandBaseSchema.extend({
  sessionId: SessionIdSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  status: RunStatusSchema.optional(),
});

export type CreateRunCommand = z.infer<typeof CreateRunCommandSchema>;
export type GetRunStatusCommand = z.infer<typeof GetRunStatusCommandSchema>;
export type ListRunsCommand = z.infer<typeof ListRunsCommandSchema>;

/**
 * Capability Registry Contracts
 */
export const CapabilityTypeSchema = z.enum([
  "tool",
  "model",
  "integration",
  "workflow"
]);

export const ModelProviderSchema = z.enum([
  "openai", 
  "anthropic",
  "google",
  "mistral",
  "cohere",
  "custom"
]);

export const CapabilityMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: CapabilityTypeSchema,
  version: z.string(),
  enabled: z.boolean(),
  configuration: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const ModelCapabilitySchema = CapabilityMetadataSchema.extend({
  type: z.literal("model"),
  provider: ModelProviderSchema,
  modelId: z.string(),
  contextWindow: z.number().int().positive(),
  maxTokens: z.number().int().positive(),
  supportsStreaming: z.boolean(),
  supportsFunctionCalling: z.boolean(),
  supportsVision: z.boolean(),
  pricing: z.object({
    inputTokensPerMillion: z.number().nonnegative().optional(),
    outputTokensPerMillion: z.number().nonnegative().optional(),
    currency: z.string().default("USD"),
  }).optional(),
});

export const ToolCapabilitySchema = CapabilityMetadataSchema.extend({
  type: z.literal("tool"),
  toolName: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()),
  requiredPermissions: z.array(z.string()).default([]),
});

export const CapabilityRegistrySchema = z.object({
  capabilities: z.array(CapabilityMetadataSchema),
  models: z.array(ModelCapabilitySchema),
  tools: z.array(ToolCapabilitySchema),
  lastUpdated: z.string().datetime({ offset: true }),
  version: z.string(),
});

export type CapabilityType = z.infer<typeof CapabilityTypeSchema>;
export type ModelProvider = z.infer<typeof ModelProviderSchema>;
export type CapabilityMetadata = z.infer<typeof CapabilityMetadataSchema>;
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;
export type ToolCapability = z.infer<typeof ToolCapabilitySchema>;
export type CapabilityRegistry = z.infer<typeof CapabilityRegistrySchema>;
