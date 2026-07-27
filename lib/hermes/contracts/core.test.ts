import { describe, it, expect } from "vitest";
import {
  // Session contracts
  SessionIdSchema,
  SessionStatusSchema,
  HermesSessionSchema,
  
  // Updated run contracts
  HermesRunSchema,
  
  // Event contracts
  HermesEventTypeSchema,
  HermesEventEnvelopeSchema,
  
  // Error contracts
  HermesErrorSchema,
  HermesResponseSchema,
  
  // Command contracts
  CreateSessionCommandSchema,
  ResumeSessionCommandSchema,
  ListSessionsCommandSchema,
  CreateRunCommandSchema,
  GetRunStatusCommandSchema,
  ListRunsCommandSchema,

  // Chat planning metadata
  ChatWorkflowSchema,
  ChatExecutionIntentSchema,
  HermesRetrievalPlanSchema,
  ChatExecutionMetadataSchema,
  
  // Capability contracts
  CapabilityTypeSchema,
  ModelProviderSchema,
  CapabilityMetadataSchema,
  ModelCapabilitySchema,
  ToolCapabilitySchema,
  CapabilityRegistrySchema,
} from "./core";

describe("Session Contracts", () => {
  describe("SessionIdSchema", () => {
    it("validates valid session IDs", () => {
      expect(() => SessionIdSchema.parse("sess_123")).not.toThrow();
      expect(() => SessionIdSchema.parse("session-abc-def")).not.toThrow();
    });

    it("rejects invalid session IDs", () => {
      expect(() => SessionIdSchema.parse("")).toThrow();
      expect(() => SessionIdSchema.parse(null)).toThrow();
      expect(() => SessionIdSchema.parse(123)).toThrow();
    });
  });

  describe("SessionStatusSchema", () => {
    it("validates valid session statuses", () => {
      const validStatuses = ["active", "paused", "archived", "expired"];
      validStatuses.forEach(status => {
        expect(() => SessionStatusSchema.parse(status)).not.toThrow();
      });
    });

    it("rejects invalid session statuses", () => {
      const invalidStatuses = ["running", "completed", "invalid"];
      invalidStatuses.forEach(status => {
        expect(() => SessionStatusSchema.parse(status)).toThrow();
      });
    });
  });

  describe("HermesSessionSchema", () => {
    it("validates complete session record", () => {
      const validSession = {
        id: "sess_123",
        workspaceId: "ws_456", 
        userId: "user_789",
        title: "Test Session",
        description: "A test session",
        status: "active" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        lastActiveAt: "2026-07-25T15:30:00Z",
        expiresAt: "2026-07-26T15:30:00Z",
        settings: { theme: "dark" },
        metadata: { source: "api" },
      };

      expect(() => HermesSessionSchema.parse(validSession)).not.toThrow();
    });

    it("validates minimal session record", () => {
      const minimalSession = {
        id: "sess_123",
        workspaceId: "ws_456",
        userId: "user_789", 
        title: "Test Session",
        status: "active" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        lastActiveAt: "2026-07-25T15:30:00Z",
      };

      const result = HermesSessionSchema.parse(minimalSession);
      expect(result.settings).toEqual({});
      expect(result.metadata).toEqual({});
    });

    it("validates ISO timestamp formats", () => {
      const sessionWithTimestamps = {
        id: "sess_123",
        workspaceId: "ws_456",
        userId: "user_789",
        title: "Test Session",
        status: "active" as const,
        createdAt: "2026-07-25T15:30:00.000Z",
        updatedAt: "2026-07-25T15:35:00+00:00",
        lastActiveAt: "2026-07-25T15:40:00-05:00",
      };

      expect(() => HermesSessionSchema.parse(sessionWithTimestamps)).not.toThrow();
    });

    it("rejects invalid timestamp formats", () => {
      const sessionWithInvalidTimestamp = {
        id: "sess_123",
        workspaceId: "ws_456",
        userId: "user_789",
        title: "Test Session",
        status: "active" as const,
        createdAt: "2026-07-25 15:30:00", // Missing timezone
        updatedAt: "2026-07-25T15:30:00Z",
        lastActiveAt: "2026-07-25T15:30:00Z",
      };

      expect(() => HermesSessionSchema.parse(sessionWithInvalidTimestamp)).toThrow();
    });
  });
});

describe("Updated Run Contracts", () => {
  describe("HermesRunSchema with sessionId", () => {
    it("validates run with sessionId", () => {
      const runWithSession = {
        id: "run_123",
        sessionId: "sess_456",
        workspaceId: "ws_789",
        userId: "user_123",
        domain: "slides" as const,
        status: "created" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        config: {},
        metadata: {},
      };

      expect(() => HermesRunSchema.parse(runWithSession)).not.toThrow();
    });

    it("validates run without sessionId", () => {
      const runWithoutSession = {
        id: "run_123", 
        workspaceId: "ws_789",
        userId: "user_123",
        domain: "slides" as const,
        status: "created" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        config: {},
        metadata: {},
      };

      expect(() => HermesRunSchema.parse(runWithoutSession)).not.toThrow();
    });

    it("validates run with documents domain", () => {
      const documentRun = {
        id: "run_doc_123",
        workspaceId: "ws_789",
        userId: "user_123",
        domain: "documents" as const,
        status: "running" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        config: {},
        metadata: { documentIntent: "ingest" },
      };

      expect(() => HermesRunSchema.parse(documentRun)).not.toThrow();
    });
  });
});

describe("Chat Planning Contracts", () => {
  it("validates supported chat workflows", () => {
    expect(() => ChatWorkflowSchema.parse("default")).not.toThrow();
    expect(() => ChatWorkflowSchema.parse("spec")).not.toThrow();
    expect(() => ChatWorkflowSchema.parse("unknown")).toThrow();
  });

  it("validates execution intent metadata", () => {
    expect(() =>
      ChatExecutionIntentSchema.parse({
        intentClass: "retrieve",
        complexity: "medium",
        privacyMode: "normal",
        latencyBudget: "interactive",
        artifactExpectation: "possible",
        requiresNetwork: true,
        requiresFilesystem: false,
        requiresShell: false,
        requiresLongLivedSession: false,
      }),
    ).not.toThrow();
  });

  it("validates retrieval planning metadata", () => {
    expect(() =>
      HermesRetrievalPlanSchema.parse({
        intent: "workspace_knowledge_lookup",
        preferredSources: ["workspace", "session_memory"],
        mode: "hybrid",
        freshness: "recent",
        trustWeighting: "workspace_first",
        personalizationScope: "workspace",
        costBudget: "medium",
      }),
    ).not.toThrow();
  });

  it("validates cost-aware execution metadata for /spec turns", () => {
    expect(() =>
      ChatExecutionMetadataSchema.parse({
        workflow: "spec",
        workflowArgument: "Draft a scalable chat runtime spec",
        lane: "lane_1",
        maxModelTier: "advanced",
        estimatedCostTier: "high",
        resumeMode: "resume_session",
        intent: {
          intentClass: "retrieve",
          complexity: "medium",
          privacyMode: "normal",
          latencyBudget: "interactive",
          artifactExpectation: "expected",
          requiresNetwork: false,
          requiresFilesystem: false,
          requiresShell: false,
          requiresLongLivedSession: true,
        },
        retrievalPlan: {
          intent: "action_grounded_retrieval",
          preferredSources: ["workspace", "artifacts", "session_memory"],
          mode: "hybrid",
          freshness: "recent",
          trustWeighting: "workspace_first",
          personalizationScope: "workspace",
          costBudget: "medium",
        },
      }),
    ).not.toThrow();
  });
});

describe("Event Contracts", () => {
  describe("HermesEventTypeSchema", () => {
    it("validates session event types", () => {
      const sessionEvents = [
        "session_created",
        "session_resumed", 
        "session_paused",
        "session_archived"
      ];

      sessionEvents.forEach(eventType => {
        expect(() => HermesEventTypeSchema.parse(eventType)).not.toThrow();
      });
    });

    it("validates run event types", () => {
      const runEvents = [
        "run_created",
        "run_started",
        "run_completed",
        "run_failed"
      ];

      runEvents.forEach(eventType => {
        expect(() => HermesEventTypeSchema.parse(eventType)).not.toThrow();
      });
    });

    it("validates document intelligence event types", () => {
      const documentEvents = [
        "document_ingestion_started",
        "document_ingestion_progress",
        "document_ingestion_completed",
        "document_structure_detected",
        "document_semantics_ready",
        "artifact_ready",
        "export_started",
        "export_completed",
      ];

      documentEvents.forEach(eventType => {
        expect(() => HermesEventTypeSchema.parse(eventType)).not.toThrow();
      });
    });

    it("rejects unknown event types", () => {
      expect(() => HermesEventTypeSchema.parse("document_uploaded")).toThrow();
      expect(() => HermesEventTypeSchema.parse("artifact_deleted")).toThrow();
    });
  });

  describe("HermesEventEnvelopeSchema", () => {
    it("validates session-only event", () => {
      const sessionEvent = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "sess_123",
        workspaceId: "ws_456",
        eventType: "session_created" as const,
        timestamp: "2026-07-25T15:30:00Z",
        sequence: 1,
        payload: { sessionTitle: "New Session" },
        metadata: { source: "api" },
      };

      expect(() => HermesEventEnvelopeSchema.parse(sessionEvent)).not.toThrow();
    });

    it("validates run event with session", () => {
      const runEvent = {
        eventId: "550e8400-e29b-41d4-a716-446655440001", 
        sessionId: "sess_123",
        runId: "run_456",
        workspaceId: "ws_789",
        domain: "slides" as const,
        eventType: "run_created" as const,
        timestamp: "2026-07-25T15:30:00Z",
        sequence: 2,
        payload: { runDomain: "slides" },
        metadata: {},
      };

      expect(() => HermesEventEnvelopeSchema.parse(runEvent)).not.toThrow();
    });

    it("validates minimal event envelope", () => {
      const minimalEvent = {
        eventId: "550e8400-e29b-41d4-a716-446655440002",
        workspaceId: "ws_123",
        eventType: "progress_update" as const,
        timestamp: "2026-07-25T15:30:00Z",
        sequence: 1,
      };

      const result = HermesEventEnvelopeSchema.parse(minimalEvent);
      expect(result.payload).toEqual({});
      expect(result.metadata).toEqual({});
    });
  });
});

describe("Error and Response Contracts", () => {
  describe("HermesErrorSchema", () => {
    it("validates complete error", () => {
      const completeError = {
        code: "VALIDATION_ERROR",
        message: "Invalid input provided",
        details: { field: "sessionId", reason: "missing" },
        timestamp: "2026-07-25T15:30:00Z",
        requestId: "req_123",
      };

      expect(() => HermesErrorSchema.parse(completeError)).not.toThrow();
    });

    it("validates minimal error", () => {
      const minimalError = {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        timestamp: "2026-07-25T15:30:00Z",
      };

      expect(() => HermesErrorSchema.parse(minimalError)).not.toThrow();
    });
  });

  describe("HermesResponseSchema", () => {
    it("validates successful response", () => {
      const successResponse = {
        success: true,
        data: { sessionId: "sess_123" },
        metadata: { processedAt: "2026-07-25T15:30:00Z" },
      };

      expect(() => HermesResponseSchema.parse(successResponse)).not.toThrow();
    });

    it("validates error response", () => {
      const errorResponse = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Session not found",
          timestamp: "2026-07-25T15:30:00Z",
        },
        metadata: {},
      };

      expect(() => HermesResponseSchema.parse(errorResponse)).not.toThrow();
    });
  });
});

describe("Command Contracts", () => {
  describe("Session Commands", () => {
    it("validates CreateSessionCommand", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456", 
        userId: "user_789",
        title: "New Session",
        description: "A new Hermes session",
        settings: { autoSave: true },
      };

      expect(() => CreateSessionCommandSchema.parse(command)).not.toThrow();
    });

    it("validates ResumeSessionCommand", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456",
        userId: "user_789", 
        sessionId: "sess_123",
      };

      expect(() => ResumeSessionCommandSchema.parse(command)).not.toThrow();
    });

    it("validates ListSessionsCommand with defaults", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456",
        userId: "user_789",
      };

      const result = ListSessionsCommandSchema.parse(command);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("validates ListSessionsCommand with parameters", () => {
      const command = {
        requestId: "req_123", 
        workspaceId: "ws_456",
        userId: "user_789",
        limit: 50,
        offset: 20,
        status: "active" as const,
      };

      expect(() => ListSessionsCommandSchema.parse(command)).not.toThrow();
    });

    it("rejects invalid limit values", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456", 
        userId: "user_789",
        limit: 150, // Exceeds max of 100
      };

      expect(() => ListSessionsCommandSchema.parse(command)).toThrow();
    });
  });

  describe("Run Commands", () => {
    it("validates CreateRunCommand", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456",
        userId: "user_789",
        sessionId: "sess_123",
        domain: "slides" as const,
        config: { template: "modern" },
        metadata: { source: "ui" },
      };

      expect(() => CreateRunCommandSchema.parse(command)).not.toThrow();
    });

    it("validates CreateRunCommand without sessionId", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456", 
        userId: "user_789",
        domain: "slides" as const,
      };

      const result = CreateRunCommandSchema.parse(command);
      expect(result.config).toEqual({});
      expect(result.metadata).toEqual({});
    });

    it("validates GetRunStatusCommand", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456",
        userId: "user_789",
        runId: "run_123",
      };

      expect(() => GetRunStatusCommandSchema.parse(command)).not.toThrow();
    });

    it("validates ListRunsCommand", () => {
      const command = {
        requestId: "req_123",
        workspaceId: "ws_456",
        userId: "user_789",
        sessionId: "sess_123",
        limit: 10,
        status: "running" as const,
      };

      expect(() => ListRunsCommandSchema.parse(command)).not.toThrow();
    });
  });
});

describe("Capability Registry Contracts", () => {
  describe("CapabilityMetadataSchema", () => {
    it("validates basic capability", () => {
      const capability = {
        id: "cap_123",
        name: "Test Capability", 
        description: "A test capability",
        type: "tool" as const,
        version: "1.0.0",
        enabled: true,
      };

      const result = CapabilityMetadataSchema.parse(capability);
      expect(result.configuration).toEqual({});
      expect(result.metadata).toEqual({});
    });
  });

  describe("ModelCapabilitySchema", () => {
    it("validates complete model capability", () => {
      const modelCapability = {
        id: "model_gpt4",
        name: "GPT-4",
        description: "OpenAI GPT-4 model",
        type: "model" as const,
        version: "gpt-4-0613",
        enabled: true,
        provider: "openai" as const,
        modelId: "gpt-4",
        contextWindow: 8192,
        maxTokens: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        supportsVision: false,
        pricing: {
          inputTokensPerMillion: 30000,
          outputTokensPerMillion: 60000,
          currency: "USD",
        },
      };

      expect(() => ModelCapabilitySchema.parse(modelCapability)).not.toThrow();
    });

    it("validates model without pricing", () => {
      const modelCapability = {
        id: "model_local",
        name: "Local Model",
        description: "Local inference model", 
        type: "model" as const,
        version: "1.0.0",
        enabled: true,
        provider: "custom" as const,
        modelId: "local-llm",
        contextWindow: 4096,
        maxTokens: 2048,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        supportsVision: false,
      };

      expect(() => ModelCapabilitySchema.parse(modelCapability)).not.toThrow();
    });
  });

  describe("ToolCapabilitySchema", () => {
    it("validates tool capability", () => {
      const toolCapability = {
        id: "tool_search",
        name: "Web Search",
        description: "Search the web for information",
        type: "tool" as const,
        version: "2.1.0",
        enabled: true,
        toolName: "web_search",
        inputSchema: {
          query: { type: "string", required: true },
          maxResults: { type: "number", default: 10 },
        },
        outputSchema: {
          results: { type: "array", items: { type: "object" } },
        },
        requiredPermissions: ["network.http"],
      };

      expect(() => ToolCapabilitySchema.parse(toolCapability)).not.toThrow();
    });
  });

  describe("CapabilityRegistrySchema", () => {
    it("validates capability registry", () => {
      const registry = {
        capabilities: [],
        models: [],
        tools: [],
        lastUpdated: "2026-07-25T15:30:00Z",
        version: "1.0.0",
      };

      expect(() => CapabilityRegistrySchema.parse(registry)).not.toThrow();
    });
  });
});

describe("Status Transition Validation", () => {
  it("validates session status transitions", () => {
    // Valid session statuses
    const validStatuses = ["active", "paused", "archived", "expired"];
    validStatuses.forEach(status => {
      expect(() => SessionStatusSchema.parse(status)).not.toThrow();
    });
  });

  it("validates run status transitions", () => {
    // Test that existing run statuses still work
    const validRunStatuses = ["created", "planning", "running", "paused", "resumed", "completed", "failed", "cancelled"];
    validRunStatuses.forEach(status => {
      expect(() => HermesRunSchema.parse({
        id: "run_123",
        workspaceId: "ws_456",
        userId: "user_789", 
        domain: "slides",
        status,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
        config: {},
        metadata: {},
      })).not.toThrow();
    });
  });
});
