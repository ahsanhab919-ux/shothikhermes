/**
 * Hermes Frontend Client Adapter
 * 
 * Thin client layer that interfaces with backend-owned session and run APIs.
 * Keeps orchestration logic in the backend, provides typed frontend interface.
 */

import { 
  HermesSession, 
  HermesRun, 
  HermesRunHotState,
  ArtifactDomain, 
  SessionStatus, 
  RunStatus,
  WorkspaceId,
  SessionId,
  RunId,
  HermesResponse 
} from './contracts/core';

export interface CreateSessionRequest {
  workspaceId: WorkspaceId;
  title: string;
  description?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateRunRequest {
  sessionId?: SessionId;
  workspaceId: WorkspaceId;
  domain: ArtifactDomain;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ListSessionsParams {
  workspaceId?: WorkspaceId;
  status?: SessionStatus;
  limit?: number;
  offset?: number;
}

export interface SessionContext {
  session: HermesSession;
  workspace: any; // TODO: Type from workspace contracts
  runs: HermesRun[];
  canResume: boolean;
}

export interface RunContext {
  run: HermesRun;
  workspace: any; // TODO: Type from workspace contracts
  canResume: boolean;
  hotState?: HermesRunHotState;
}

export interface SessionAction {
  action: 'resume' | 'pause' | 'archive';
}

export interface RunAction {
  action: 'pause' | 'resume' | 'cancel';
}

export interface GenerateSlidesRequest {
  workspaceId: WorkspaceId;
  topic: string;
  slideCount?: number;
  template?: string;
  targetAudience?: string;
  language?: string;
  requestId?: string;
}

export interface PauseResumeSlidesRequest {
  runId: string;
  jobId: string;
  workspaceId: string;
  requestId: string;
}

export interface UpdateSlideContentRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  jobId: string;
  slideIndex: number;
  content: {
    title?: string;
    bulletPoints?: string[];
    notes?: string;
  };
}

export interface ExportSlideDeckRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  jobId: string;
  format?: 'pdf' | 'pptx' | 'html' | 'json';
}

export interface GenerateSheetsRequest {
  workspaceId: WorkspaceId;
  title: string;
  prompt: string;
  columns?: string[];
  rowCount?: number;
  requestId?: string;
}

export interface ControlSheetsRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  cellUpdates?: Array<{ row: number; col: number; value: unknown }>;
  format?: 'csv' | 'xlsx' | 'json';
}

export interface GenerateResearchRequest {
  workspaceId: WorkspaceId;
  topic: string;
  depth?: 'quick' | 'standard' | 'deep';
  preferredSources?: string[];
  requestId?: string;
}

export interface ControlResearchRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  sectionTitle?: string;
  content?: string;
  citations?: string[];
  format?: 'pdf' | 'markdown' | 'html' | 'json';
}

export interface GenerateWritingRequest {
  workspaceId: WorkspaceId;
  title: string;
  prompt: string;
  genre?: string;
  targetLength?: number;
  requestId?: string;
}

export interface ControlWritingRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  content?: string;
  format?: 'pdf' | 'docx' | 'markdown' | 'txt';
}

export interface GenerateBookRequest {
  workspaceId: WorkspaceId;
  title: string;
  outline?: string[];
  genre?: string;
  targetChapterCount?: number;
  requestId?: string;
}

export interface ControlBookRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  chapterIndex?: number;
  chapterTitle?: string;
  content?: string;
  format?: 'epub' | 'pdf' | 'docx' | 'markdown';
}

export interface GenerateAIDetectorRequest {
  workspaceId: WorkspaceId;
  text: string;
  title?: string;
  requestId?: string;
}

export interface ControlAIDetectorRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  notes?: string;
  format?: 'pdf' | 'json' | 'html';
}

export interface GeneratePlagiarismRequest {
  workspaceId: WorkspaceId;
  text: string;
  title?: string;
  requestId?: string;
}

export interface ControlPlagiarismRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  notes?: string;
  format?: 'pdf' | 'json' | 'html';
}

export interface GeneratePublishRequest {
  workspaceId: WorkspaceId;
  artifactId: string;
  channel?: 'community' | 'marketplace' | 'web' | 'export';
  title?: string;
  requestId?: string;
}

export interface ControlPublishRequest {
  runId: string;
  workspaceId: string;
  requestId: string;
  statusMessage?: string;
  format?: 'zip' | 'json' | 'bundle';
}

export interface HandoffRequest {
  workspaceId: WorkspaceId;
  sourceDomain: string;
  targetDomain: string;
  sourceRunId?: string;
  sourceSessionId?: string;
  contextSummary: string;
  artifacts?: string[];
  instructions?: string;
  metadata?: Record<string, unknown>;
}



class HermesClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HermesClientError';
  }
}

export class HermesClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/hermes') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new HermesClientError(
        data.code || 'UNKNOWN_ERROR',
        data.message || 'Unknown error occurred',
        data.details
      );
    }

    return data.data || data;
  }

  // Session Management
  
  async createSession(request: CreateSessionRequest): Promise<HermesSession> {
    const response = await this.request<{ session: HermesSession }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    return response.session;
  }

  async listSessions(params: ListSessionsParams = {}): Promise<HermesSession[]> {
    const searchParams = new URLSearchParams();
    
    if (params.workspaceId) searchParams.set('workspaceId', params.workspaceId);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    const response = await this.request<{ sessions: HermesSession[] }>(
      `/sessions?${searchParams.toString()}`
    );
    
    return response.sessions;
  }

  async getSessionContext(sessionId: SessionId): Promise<SessionContext> {
    return this.request<SessionContext>(`/sessions/${sessionId}`);
  }

  async controlSession(sessionId: SessionId, action: SessionAction): Promise<void> {
    await this.request(`/sessions/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
  }

  // Run Management

  async createRun(request: CreateRunRequest): Promise<{ run: HermesRun; streamUrl: string }> {
    return this.request<{ run: HermesRun; streamUrl: string }>('/runs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRunContext(runId: RunId): Promise<RunContext> {
    return this.request<RunContext>(`/runs/${runId}`);
  }

  async controlRun(runId: RunId, action: RunAction): Promise<void> {
    await this.request(`/runs/${runId}`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
  }

  // Slide Artifact Management

  async generateSlides(
    request: GenerateSlidesRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/slides/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlSlides<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: PauseResumeSlidesRequest | UpdateSlideContentRequest | ExportSlideDeckRequest
  ): Promise<T> {
    return this.request<T>(`/slides/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Sheet Artifact Management

  async generateSheets(
    request: GenerateSheetsRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/sheets/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlSheets<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlSheetsRequest
  ): Promise<T> {
    return this.request<T>(`/sheets/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Research Artifact Management

  async generateResearch(
    request: GenerateResearchRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/research/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlResearch<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlResearchRequest
  ): Promise<T> {
    return this.request<T>(`/research/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Writing Artifact Management

  async generateWriting(
    request: GenerateWritingRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/writing/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlWriting<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlWritingRequest
  ): Promise<T> {
    return this.request<T>(`/writing/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Book Artifact Management

  async generateBook(
    request: GenerateBookRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/books/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlBook<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlBookRequest
  ): Promise<T> {
    return this.request<T>(`/books/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // AI Detector Artifact Management

  async generateAIDetector(
    request: GenerateAIDetectorRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/ai-detector/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlAIDetector<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlAIDetectorRequest
  ): Promise<T> {
    return this.request<T>(`/ai-detector/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Plagiarism Artifact Management

  async generatePlagiarism(
    request: GeneratePlagiarismRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/plagiarism/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlPlagiarism<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlPlagiarismRequest
  ): Promise<T> {
    return this.request<T>(`/plagiarism/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Publish Artifact Management

  async generatePublish(
    request: GeneratePublishRequest
  ): Promise<{ runId: string; streamUrl: string; workspaceId: string }> {
    return this.request<{ runId: string; streamUrl: string; workspaceId: string }>(
      '/publish/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async controlPublish<T = unknown>(
    action: 'pause' | 'resume' | 'update' | 'export',
    body: ControlPublishRequest
  ): Promise<T> {
    return this.request<T>(`/publish/control/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Cross-Domain Handoff Management

  async handoff(
    request: HandoffRequest
  ): Promise<{ handoffId: string; targetRunId: string; streamUrl: string; sourceDomain: string; targetDomain: string; workspaceId: string }> {
    return this.request<{ handoffId: string; targetRunId: string; streamUrl: string; sourceDomain: string; targetDomain: string; workspaceId: string }>(
      '/handoff',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }




  async getRunStream(runId: RunId): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.baseUrl}/runs/${runId}`, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new HermesClientError(
        error.code || 'STREAM_ERROR',
        error.message || 'Failed to get run stream'
      );
    }

    return response.body!;
  }

  // Streaming Utilities

  async *parseEventStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<MessageEvent, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield new MessageEvent('message', { data: parsed });
            } catch (error) {
              console.warn('Failed to parse SSE data:', data, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Default client instance
export const hermesClient = new HermesClient();

// Re-export error for consumer convenience
export { HermesClientError };