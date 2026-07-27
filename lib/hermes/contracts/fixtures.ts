/**
 * Test Fixtures for Hermes Contracts
 * 
 * Provides reusable test data for unit tests, integration tests,
 * and development scenarios.
 */

import type {
  HermesSession,
  HermesRun,
  HermesEventEnvelope,
  HermesError,
  HermesResponse,
  CreateSessionCommand,
  CreateRunCommand,
  CapabilityRegistry,
  ModelCapability,
  ToolCapability,
} from "./core";

/**
 * Session Fixtures
 */
export const mockHermesSession: HermesSession = {
  id: "sess_test_12345",
  workspaceId: "ws_test_67890", 
  userId: "user_test_11111",
  title: "Test Session",
  description: "A test session for development and testing",
  status: "active",
  createdAt: "2026-07-25T15:30:00.000Z",
  updatedAt: "2026-07-25T15:35:00.000Z", 
  lastActiveAt: "2026-07-25T15:40:00.000Z",
  expiresAt: "2026-07-26T15:30:00.000Z",
  settings: {
    theme: "dark",
    autoSave: true,
    notifications: true,
  },
  metadata: {
    source: "api_test",
    version: "1.0.0",
    testFlag: true,
  },
};

export const mockPausedSession: HermesSession = {
  ...mockHermesSession,
  id: "sess_paused_12345",
  title: "Paused Test Session", 
  status: "paused",
  lastActiveAt: "2026-07-25T14:30:00.000Z", // Earlier activity
};

export const mockArchivedSession: HermesSession = {
  ...mockHermesSession,
  id: "sess_archived_12345",
  title: "Archived Test Session",
  status: "archived",
  lastActiveAt: "2026-07-24T15:30:00.000Z", // Yesterday
  expiresAt: undefined, // Archived sessions don't expire
};

/**
 * Run Fixtures
 */
export const mockHermesRun: HermesRun = {
  id: "run_test_98765",
  sessionId: "sess_test_12345",
  workspaceId: "ws_test_67890",
  userId: "user_test_11111",
  domain: "slides",
  status: "created",
  createdAt: "2026-07-25T15:30:00.000Z",
  updatedAt: "2026-07-25T15:30:00.000Z",
  config: {
    template: "modern",
    slideCount: 10,
    theme: "corporate",
  },
  metadata: {
    source: "frontend",
    requestId: "req_test_55555",
  },
};

export const mockRunningRun: HermesRun = {
  ...mockHermesRun,
  id: "run_running_98765",
  status: "running",
  updatedAt: "2026-07-25T15:35:00.000Z",
};

export const mockCompletedRun: HermesRun = {
  ...mockHermesRun,
  id: "run_completed_98765", 
  status: "completed",
  updatedAt: "2026-07-25T15:45:00.000Z",
  completedAt: "2026-07-25T15:45:00.000Z",
  metadata: {
    ...mockHermesRun.metadata,
    result: {
      artifactId: "art_slides_12345",
      slideCount: 12,
      duration: 900, // 15 minutes
    },
  },
};

export const mockFailedRun: HermesRun = {
  ...mockHermesRun,
  id: "run_failed_98765",
  status: "failed", 
  updatedAt: "2026-07-25T15:32:00.000Z",
  metadata: {
    ...mockHermesRun.metadata,
    error: "Template not found",
    errorCode: "TEMPLATE_MISSING",
    failedAt: "2026-07-25T15:32:00.000Z",
  },
};

/**
 * Event Fixtures
 */
export const mockSessionCreatedEvent: HermesEventEnvelope = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  sessionId: "sess_test_12345",
  workspaceId: "ws_test_67890",
  eventType: "session_created",
  timestamp: "2026-07-25T15:30:00.000Z",
  sequence: 1,
  payload: {
    sessionTitle: "Test Session",
    workspaceTitle: "Test Workspace",
  },
  metadata: {
    source: "session_service",
    version: "1.0.0",
  },
};

export const mockRunCreatedEvent: HermesEventEnvelope = {
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  sessionId: "sess_test_12345", 
  runId: "run_test_98765",
  workspaceId: "ws_test_67890",
  domain: "slides",
  eventType: "run_created",
  timestamp: "2026-07-25T15:30:05.000Z",
  sequence: 2,
  payload: {
    runDomain: "slides",
    config: {
      template: "modern", 
      slideCount: 10,
    },
  },
  metadata: {
    source: "run_service",
    sessionTitle: "Test Session",
  },
};

export const mockProgressUpdateEvent: HermesEventEnvelope = {
  eventId: "550e8400-e29b-41d4-a716-446655440002",
  sessionId: "sess_test_12345",
  runId: "run_test_98765", 
  workspaceId: "ws_test_67890",
  domain: "slides",
  eventType: "progress_update",
  timestamp: "2026-07-25T15:32:00.000Z",
  sequence: 15,
  payload: {
    message: "Generating slide content",
    progress: 0.6,
    currentSlide: 6,
    totalSlides: 10,
  },
  metadata: {
    source: "slides_orchestrator",
    step: "content_generation",
  },
};

export const mockRunCompletedEvent: HermesEventEnvelope = {
  eventId: "550e8400-e29b-41d4-a716-446655440003", 
  sessionId: "sess_test_12345",
  runId: "run_test_98765",
  workspaceId: "ws_test_67890",
  artifactId: "art_slides_12345",
  domain: "slides",
  eventType: "run_completed",
  timestamp: "2026-07-25T15:45:00.000Z",
  sequence: 42,
  payload: {
    result: {
      artifactId: "art_slides_12345",
      slideCount: 12,
      exportFormats: ["pptx", "pdf"],
    },
    duration: 900,
  },
  metadata: {
    source: "run_service",
    finalStatus: "completed",
  },
};

/**
 * Error Fixtures
 */
export const mockValidationError: HermesError = {
  code: "VALIDATION_ERROR",
  message: "Invalid request parameters",
  details: {
    field: "sessionId", 
    value: "",
    constraint: "must be non-empty string",
  },
  timestamp: "2026-07-25T15:30:00.000Z",
  requestId: "req_test_error_123",
};

export const mockNotFoundError: HermesError = {
  code: "NOT_FOUND",
  message: "Session not found",
  details: {
    sessionId: "sess_nonexistent_12345",
    workspaceId: "ws_test_67890",
  },
  timestamp: "2026-07-25T15:30:00.000Z",
  requestId: "req_test_error_456",
};

export const mockInternalError: HermesError = {
  code: "INTERNAL_ERROR",
  message: "An unexpected error occurred",
  timestamp: "2026-07-25T15:30:00.000Z",
  requestId: "req_test_error_789",
};

/**
 * Response Fixtures
 */
export const mockSuccessResponse: HermesResponse<HermesSession> = {
  success: true,
  data: mockHermesSession,
  metadata: {
    processedAt: "2026-07-25T15:30:00.000Z",
    duration: 150,
    version: "1.0.0",
  },
};

export const mockErrorResponse: HermesResponse = {
  success: false,
  error: mockValidationError,
  metadata: {
    processedAt: "2026-07-25T15:30:00.000Z",
    duration: 25,
    version: "1.0.0",
  },
};

/**
 * Command Fixtures
 */
export const mockCreateSessionCommand: CreateSessionCommand = {
  requestId: "req_create_session_123",
  workspaceId: "ws_test_67890",
  userId: "user_test_11111", 
  title: "New Test Session",
  description: "Creating a new session for testing",
  settings: {
    theme: "light",
    autoSave: true,
  },
};

export const mockCreateRunCommand: CreateRunCommand = {
  requestId: "req_create_run_456",
  workspaceId: "ws_test_67890",
  userId: "user_test_11111",
  sessionId: "sess_test_12345", 
  domain: "slides",
  config: {
    template: "minimal",
    slideCount: 8,
    includeNotes: true,
  },
  metadata: {
    source: "frontend_wizard",
    userAgent: "test_agent",
  },
};

/**
 * Capability Registry Fixtures  
 */
export const mockModelCapability: ModelCapability = {
  id: "model_gpt4_turbo",
  name: "GPT-4 Turbo",
  description: "OpenAI's most capable model with 128k context",
  type: "model",
  version: "gpt-4-1106-preview",
  enabled: true,
  configuration: {},
  metadata: {
    releaseDate: "2023-11-06", 
    deprecated: false,
  },
  provider: "openai",
  modelId: "gpt-4-1106-preview",
  contextWindow: 128000,
  maxTokens: 4096,
  supportsStreaming: true,
  supportsFunctionCalling: true,
  supportsVision: true,
  pricing: {
    inputTokensPerMillion: 10000,
    outputTokensPerMillion: 30000,
    currency: "USD",
  },
};

export const mockLocalModelCapability: ModelCapability = {
  id: "model_local_llama",
  name: "Local LLaMA", 
  description: "Self-hosted LLaMA model",
  type: "model",
  version: "llama-2-7b-chat",
  enabled: true,
  configuration: {
    endpoint: "http://localhost:8000",
    maxConcurrency: 4,
  },
  metadata: {
    deploymentType: "local",
    gpuRequired: true,
  },
  provider: "custom",
  modelId: "llama-2-7b-chat",
  contextWindow: 4096,
  maxTokens: 2048, 
  supportsStreaming: false,
  supportsFunctionCalling: false,
  supportsVision: false,
};

export const mockToolCapability: ToolCapability = {
  id: "tool_web_search",
  name: "Web Search",
  description: "Search the web for current information",
  type: "tool",
  version: "2.1.0",
  enabled: true,
  configuration: {
    apiKey: "configured",
    maxResults: 10,
    timeout: 5000,
  },
  metadata: {
    provider: "serper_api", 
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 2500,
    },
  },
  toolName: "web_search",
  inputSchema: {
    query: {
      type: "string",
      description: "Search query",
      required: true,
    },
    maxResults: {
      type: "number", 
      description: "Maximum number of results",
      default: 10,
      minimum: 1,
      maximum: 20,
    },
    freshness: {
      type: "string",
      description: "Recency filter for results",
      enum: ["day", "week", "month", "year"],
      default: "month",
    },
  },
  outputSchema: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string", format: "uri" },
          snippet: { type: "string" },
          publishedDate: { type: "string", format: "date-time" },
        },
      },
    },
    query: { type: "string" },
    totalResults: { type: "number" },
    searchTime: { type: "number" },
  },
  requiredPermissions: [
    "network.http",
    "api.search",
  ],
};

export const mockCapabilityRegistry: CapabilityRegistry = {
  capabilities: [
    mockModelCapability,
    mockLocalModelCapability,
    mockToolCapability,
  ],
  models: [
    mockModelCapability,
    mockLocalModelCapability,
  ],
  tools: [
    mockToolCapability,
  ],
  lastUpdated: "2026-07-25T15:30:00.000Z",
  version: "1.0.0",
};

/**
 * Utility Functions for Test Data Generation
 */
export function createMockSession(overrides: Partial<HermesSession> = {}): HermesSession {
  return {
    ...mockHermesSession,
    ...overrides,
    id: overrides.id || `sess_${Date.now()}`,
  };
}

export function createMockRun(overrides: Partial<HermesRun> = {}): HermesRun {
  return {
    ...mockHermesRun,
    ...overrides, 
    id: overrides.id || `run_${Date.now()}`,
  };
}

export function createMockEvent(overrides: Partial<HermesEventEnvelope> = {}): HermesEventEnvelope {
  return {
    ...mockSessionCreatedEvent,
    ...overrides,
    eventId: overrides.eventId || crypto.randomUUID(),
    sequence: overrides.sequence || Math.floor(Math.random() * 100),
  };
}

export function createMockError(overrides: Partial<HermesError> = {}): HermesError {
  return {
    ...mockValidationError,
    ...overrides,
    timestamp: overrides.timestamp || new Date().toISOString(),
  };
}