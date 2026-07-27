/**
 * Hermes Main Orchestrator
 * 
 * Entry point for the Hermes modular monolith. Provides the main API
 * for creating runs, managing artifacts, and coordinating workflows.
 */

import { randomUUID } from "crypto";
import { getHermesDatabase } from "./infra/db";
import { getHermesStreamingEngine } from "./modules/streaming-engine";
import { getHermesArtifactManager } from "./modules/artifact-manager";
import { getHermesWorkspaceManager } from "./modules/workspace-manager";
import { getHermesSlidesOrchestrator } from "./modules/slides-orchestrator";
import logger from "@/lib/logger";
export { getHermesCapabilityRegistry } from "./modules/capability-registry";
export {
  getHermesCapabilityRegistry as getCapabilityRegistry,
} from "./modules/capability-registry";
export { resolveHermesModelRoute } from "./modules/model-router";

// Frontend Client Exports
export { hermesClient, HermesClient, HermesClientError, type CreateSessionRequest, type CreateRunRequest, type ListSessionsParams, type SessionContext, type RunContext, type SessionAction } from "./client";
export { useHermesSessionList, useHermesSession, useCreateHermesSession, useControlHermesSession, useHermesRun, useCreateHermesRun, useHermesRunStream, useOptimisticSessionAction, hermesQueryKeys } from "./hooks";
import type { 
  HermesRun,
  HermesArtifact,
  HermesWorkspace,
  HermesSession,
  RunId,
  SessionId,
  WorkspaceId,
  UserId,
  ArtifactDomain,
  HermesEventEnvelope 
} from "./contracts/core";

export interface CreateRunRequest {
  sessionId?: SessionId;
  workspaceId: WorkspaceId;
  userId: UserId;
  domain: ArtifactDomain;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateSessionRequest {
  workspaceId: WorkspaceId;
  userId: UserId;
  title: string;
  description?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ListSessionsRequest {
  userId: UserId;
  workspaceId?: WorkspaceId;
  limit?: number;
  offset?: number;
  status?: HermesSession["status"];
}

export interface RunPlanRequest {
  runId: RunId;
  intent: string;
  context?: Record<string, unknown>;
}

export interface HermesRunContext {
  run: HermesRun;
  workspace: HermesWorkspace;
  streaming: ReadableStream;
  canResume: boolean;
}

export interface HermesSessionContext {
  session: HermesSession;
  workspace: HermesWorkspace;
  runs: HermesRun[];
  canResume: boolean;
}

export class HermesOrchestrator {
  private db = getHermesDatabase();
  private streaming = getHermesStreamingEngine();
  private artifacts = getHermesArtifactManager();
  private workspaces = getHermesWorkspaceManager();
  private slides = getHermesSlidesOrchestrator();

  /**
   * Create a new run
   */
  async createRun(request: CreateRunRequest): Promise<HermesRun> {
    const runId = `run_${randomUUID()}`;

    // Verify workspace exists and user has access
    const workspace = await this.workspaces.getWorkspace(request.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${request.workspaceId}`);
    }

    if (workspace.userId !== request.userId) {
      throw new Error(`Access denied to workspace: ${request.workspaceId}`);
    }

    if (request.sessionId) {
      const session = await this.db.getSession(request.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${request.sessionId}`);
      }

      if (session.userId !== request.userId || session.workspaceId !== request.workspaceId) {
        throw new Error(`Access denied to session: ${request.sessionId}`);
      }
    }

    const run: Omit<HermesRun, 'createdAt' | 'updatedAt'> = {
      id: runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      domain: request.domain,
      status: 'created',
      config: request.config || {},
      metadata: request.metadata || {},
    };

    try {
      const createdRun = await this.db.createRun(run);

      // Emit run created event
      await this.emitRunEvent(createdRun, 'run_created', {
        domain: createdRun.domain,
        workspaceTitle: workspace.title,
        hasConfig: Object.keys(createdRun.config).length > 0,
        hasSession: !!createdRun.sessionId,
      });

      logger.info('[hermes] Run created', { 
        runId,
        domain: request.domain,
        workspaceId: request.workspaceId 
      });

      return createdRun;
    } catch (error) {
      logger.error('[hermes] Failed to create run', { 
        domain: request.domain,
        workspaceId: request.workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(request: CreateSessionRequest): Promise<HermesSession> {
    const sessionId = `session_${randomUUID()}`;

    const workspace = await this.workspaces.getWorkspace(request.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${request.workspaceId}`);
    }

    if (workspace.userId !== request.userId) {
      throw new Error(`Access denied to workspace: ${request.workspaceId}`);
    }

    const session: Omit<HermesSession, "createdAt" | "updatedAt" | "lastActiveAt"> = {
      id: sessionId,
      workspaceId: request.workspaceId,
      userId: request.userId,
      title: request.title,
      description: request.description,
      status: "active",
      expiresAt: undefined,
      settings: request.settings || {},
      metadata: request.metadata || {},
    };

    try {
      const createdSession = await this.db.createSession(session);

      await this.emitSessionEvent(createdSession, "session_created", {
        workspaceTitle: workspace.title,
        hasDescription: !!createdSession.description,
      });

      logger.info("[hermes] Session created", {
        sessionId,
        workspaceId: request.workspaceId,
      });

      return createdSession;
    } catch (error) {
      logger.error("[hermes] Failed to create session", {
        workspaceId: request.workspaceId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * List sessions for a user or workspace
   */
  async listSessions(request: ListSessionsRequest): Promise<HermesSession[]> {
    const limit = request.limit ?? 20;
    const offset = request.offset ?? 0;

    if (request.workspaceId) {
      const workspace = await this.workspaces.getWorkspace(request.workspaceId);
      if (!workspace) {
        throw new Error(`Workspace not found: ${request.workspaceId}`);
      }

      if (workspace.userId !== request.userId) {
        throw new Error(`Access denied to workspace: ${request.workspaceId}`);
      }

      return this.db.getWorkspaceSessions(
        request.workspaceId,
        limit,
        offset,
        request.status,
      );
    }

    return this.db.getUserSessions(request.userId, limit, offset, request.status);
  }

  /**
   * Get session context (session + workspace + runs)
   */
  async getSessionContext(sessionId: SessionId): Promise<HermesSessionContext | null> {
    try {
      const session = await this.db.getSession(sessionId);
      if (!session) return null;

      const workspace = await this.workspaces.getWorkspace(session.workspaceId);
      if (!workspace) {
        logger.warn("[hermes] Session references non-existent workspace", {
          sessionId,
          workspaceId: session.workspaceId,
        });
        return null;
      }

      const runs = await this.db.getSessionRuns(sessionId);

      return {
        session,
        workspace,
        runs,
        canResume: session.status === "paused",
      };
    } catch (error) {
      logger.error("[hermes] Failed to get session context", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get run context (run + workspace + streaming)
   */
  async getRunContext(runId: RunId): Promise<HermesRunContext | null> {
    try {
      const run = await this.db.getRun(runId);
      if (!run) return null;

      const workspace = await this.workspaces.getWorkspace(run.workspaceId);
      if (!workspace) {
        logger.warn('[hermes] Run references non-existent workspace', { 
          runId, 
          workspaceId: run.workspaceId 
        });
        return null;
      }

      const streaming = this.streaming.createSSEStream(runId);
      const canResume = run.status === 'paused' || run.status === 'running';

      return {
        run,
        workspace,
        streaming,
        canResume,
      };
    } catch (error) {
      logger.error('[hermes] Failed to get run context', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Start a run (move from created to running)
   */
  async startRun(runId: RunId): Promise<void> {
    try {
      await this.db.updateRunStatus(runId, 'running');

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_started', {
          startedAt: new Date().toISOString(),
        });
      }

      logger.info('[hermes] Run started', { runId });
    } catch (error) {
      logger.error('[hermes] Failed to start run', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Complete a run
   */
  async completeRun(runId: RunId, result?: Record<string, unknown>): Promise<void> {
    try {
      const metadata = result ? { result } : undefined;
      await this.db.updateRunStatus(runId, 'completed', metadata);

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_completed', {
          completedAt: new Date().toISOString(),
          hasResult: !!result,
          resultSize: result ? JSON.stringify(result).length : 0,
        });
      }

      logger.info('[hermes] Run completed', { runId });
    } catch (error) {
      logger.error('[hermes] Failed to complete run', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Fail a run with error information
   */
  async failRun(runId: RunId, error: string, details?: Record<string, unknown>): Promise<void> {
    try {
      const metadata = { error, details, failedAt: new Date().toISOString() };
      await this.db.updateRunStatus(runId, 'failed', metadata);

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_failed', {
          failedAt: new Date().toISOString(),
          error,
          hasDetails: !!details,
        });
      }

      logger.error('[hermes] Run failed', { runId, error });
    } catch (dbError) {
      logger.error('[hermes] Failed to mark run as failed', { 
        runId,
        originalError: error,
        dbError: dbError instanceof Error ? dbError.message : String(dbError) 
      });
      throw dbError;
    }
  }

  /**
   * Pause a run
   */
  async pauseRun(runId: RunId): Promise<void> {
    try {
      await this.db.updateRunStatus(runId, 'paused');

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_paused', {
          pausedAt: new Date().toISOString(),
        });
      }

      logger.info('[hermes] Run paused', { runId });
    } catch (error) {
      logger.error('[hermes] Failed to pause run', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Resume a paused run
   */
  async resumeRun(runId: RunId): Promise<void> {
    try {
      await this.db.updateRunStatus(runId, 'resumed');

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_resumed', {
          resumedAt: new Date().toISOString(),
        });
      }

      logger.info('[hermes] Run resumed', { runId });
    } catch (error) {
      logger.error('[hermes] Failed to resume run', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: SessionId): Promise<void> {
    try {
      await this.db.updateSessionStatus(sessionId, "active");
      await this.db.updateSessionLastActive(sessionId);

      const session = await this.db.getSession(sessionId);
      if (session) {
        await this.emitSessionEvent(session, "session_resumed", {
          resumedAt: new Date().toISOString(),
        });
      }

      logger.info("[hermes] Session resumed", { sessionId });
    } catch (error) {
      logger.error("[hermes] Failed to resume session", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Pause an active session
   */
  async pauseSession(sessionId: SessionId): Promise<void> {
    try {
      await this.db.updateSessionStatus(sessionId, "paused");

      const session = await this.db.getSession(sessionId);
      if (session) {
        await this.emitSessionEvent(session, "session_paused", {
          pausedAt: new Date().toISOString(),
        });
      }

      logger.info("[hermes] Session paused", { sessionId });
    } catch (error) {
      logger.error("[hermes] Failed to pause session", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Archive a session
   */
  async archiveSession(sessionId: SessionId): Promise<void> {
    try {
      await this.db.updateSessionStatus(sessionId, "archived");

      const session = await this.db.getSession(sessionId);
      if (session) {
        await this.emitSessionEvent(session, "session_archived", {
          archivedAt: new Date().toISOString(),
        });
      }

      logger.info("[hermes] Session archived", { sessionId });
    } catch (error) {
      logger.error("[hermes] Failed to archive session", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cancel a run
   */
  async cancelRun(runId: RunId): Promise<void> {
    try {
      await this.db.updateRunStatus(runId, 'cancelled');

      const run = await this.db.getRun(runId);
      if (run) {
        await this.emitRunEvent(run, 'run_cancelled', {
          cancelledAt: new Date().toISOString(),
        });
      }

      logger.info('[hermes] Run cancelled', { runId });
    } catch (error) {
      logger.error('[hermes] Failed to cancel run', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Report progress for a run
   */
  async reportProgress(
    runId: RunId, 
    message: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const run = await this.db.getRun(runId);
      if (!run) {
        logger.warn('[hermes] Cannot report progress for non-existent run', { runId });
        return;
      }

      await this.emitRunEvent(run, 'progress_update', {
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      });

      logger.debug('[hermes] Progress reported', { runId, message });
    } catch (error) {
      logger.error('[hermes] Failed to report progress', { 
        runId,
        message,
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't throw - progress reporting failure shouldn't break the main flow
    }
  }

  /**
   * Access to sub-modules
   */
  get artifactManager() {
    return this.artifacts;
  }

  get workspaceManager() {
    return this.workspaces;
  }

  get slidesOrchestrator() {
    return this.slides;
  }

  get events() {
    return this.streaming;
  }

  /**
   * Emit a run-specific event
   */
  private async emitRunEvent(
    run: HermesRun,
    eventType: HermesEventEnvelope['eventType'],
    payload: Record<string, unknown>
  ): Promise<void> {
    const routeMetadata =
      run.metadata &&
      typeof run.metadata === "object" &&
      "routeMetadata" in run.metadata &&
      run.metadata.routeMetadata &&
      typeof run.metadata.routeMetadata === "object"
        ? (run.metadata.routeMetadata as Record<string, unknown>)
        : {};
    const event: HermesEventEnvelope = {
      eventId: randomUUID(),
      runId: run.id,
      workspaceId: run.workspaceId,
      domain: run.domain,
      eventType,
      timestamp: new Date().toISOString(),
      sequence: 0, // Will be set by streaming engine
      payload,
      metadata: {
        ...routeMetadata,
        runStatus: run.status,
        runDomain: run.domain,
      }
    };

    try {
      // Store event in database
      await this.db.appendEvent(event);
      
      // Emit via streaming engine
      await this.streaming.emitRunEvent(event);
    } catch (error) {
      logger.warn('[hermes] Failed to emit run event', { 
        runId: run.id,
        eventType,
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't throw - event emission failure shouldn't break main operations
    }
  }

  /**
   * Emit a session-specific event using a synthetic stream key.
   */
  private async emitSessionEvent(
    session: HermesSession,
    eventType: Extract<
      HermesEventEnvelope["eventType"],
      "session_created" | "session_resumed" | "session_paused" | "session_archived"
    >,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: HermesEventEnvelope = {
      eventId: randomUUID(),
      sessionId: session.id,
      runId: `session_stream_${session.id}`,
      workspaceId: session.workspaceId,
      eventType,
      timestamp: new Date().toISOString(),
      sequence: 0,
      payload,
      metadata: {
        sessionStatus: session.status,
        sessionTitle: session.title,
      },
    };

    try {
      await this.db.appendEvent(event);
      await this.streaming.emitRunEvent(event);
    } catch (error) {
      logger.warn("[hermes] Failed to emit session event", {
        sessionId: session.id,
        eventType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Singleton instance
let hermesInstance: HermesOrchestrator | null = null;

export function getHermesOrchestrator(): HermesOrchestrator {
  if (!hermesInstance) {
    hermesInstance = new HermesOrchestrator();
  }
  return hermesInstance;
}
