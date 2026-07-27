/**
 * Hermes Workspace Manager
 * 
 * Manages workspace lifecycle, navigation state, and cross-workspace operations.
 * Provides the entry point for chat-to-workspace handoffs and artifact opening.
 */

import { randomUUID } from "crypto";
import { getHermesDatabase } from "@/lib/hermes/infra/db";
import { getHermesStreamingEngine } from "@/lib/hermes/modules/streaming-engine";
import logger from "@/lib/logger";
import type { 
  HermesWorkspace, 
  HermesEventEnvelope,
  WorkspaceId, 
  UserId,
  RunId 
} from "@/lib/hermes/contracts/core";

export interface CreateWorkspaceRequest {
  userId: UserId;
  title: string;
  description?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkspaceRequest {
  workspaceId: WorkspaceId;
  title?: string;
  description?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceHandoffRequest {
  workspaceId: WorkspaceId;
  fromRunId?: RunId;
  context: {
    intent: string;
    source: 'chat' | 'direct' | 'artifact';
    metadata: Record<string, unknown>;
  };
}

export class HermesWorkspaceManager {
  private db = getHermesDatabase();
  private streaming = getHermesStreamingEngine();

  /**
   * Create a new workspace
   */
  async createWorkspace(request: CreateWorkspaceRequest): Promise<HermesWorkspace> {
    const workspaceId = `ws_${randomUUID()}`;

    const workspace: Omit<HermesWorkspace, 'createdAt' | 'updatedAt'> = {
      id: workspaceId,
      userId: request.userId,
      title: request.title,
      description: request.description,
      settings: request.settings || {},
      metadata: request.metadata || {},
    };

    try {
      const createdWorkspace = await this.db.createWorkspace(workspace);

      // Emit workspace created event
      await this.emitWorkspaceEvent(createdWorkspace, 'workspace_created', {
        title: createdWorkspace.title,
        hasDescription: !!createdWorkspace.description,
        settingsCount: Object.keys(createdWorkspace.settings).length
      });

      logger.info('[hermes-workspaces] Workspace created', { 
        workspaceId,
        userId: request.userId,
        title: request.title 
      });

      return createdWorkspace;
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to create workspace', { 
        userId: request.userId,
        title: request.title,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Get a workspace by ID
   */
  async getWorkspace(workspaceId: WorkspaceId): Promise<HermesWorkspace | null> {
    try {
      return await this.db.getWorkspace(workspaceId);
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to get workspace', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(userId: UserId, limit: number = 50): Promise<HermesWorkspace[]> {
    try {
      return await this.db.getUserWorkspaces(userId, limit);
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to get user workspaces', { 
        userId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(request: UpdateWorkspaceRequest): Promise<HermesWorkspace> {
    const existing = await this.getWorkspace(request.workspaceId);
    if (!existing) {
      throw new Error(`Workspace not found: ${request.workspaceId}`);
    }

    const updates: Partial<HermesWorkspace> = {};

    if (request.title !== undefined) {
      updates.title = request.title;
    }

    if (request.description !== undefined) {
      updates.description = request.description;
    }

    if (request.settings !== undefined) {
      updates.settings = { ...existing.settings, ...request.settings };
    }

    if (request.metadata !== undefined) {
      updates.metadata = { ...existing.metadata, ...request.metadata };
    }

    try {
      // Apply updates to database
      await this.db.updateWorkspace(request.workspaceId, updates);

      // Get the updated workspace
      const updatedWorkspace = await this.getWorkspace(request.workspaceId);
      if (!updatedWorkspace) {
        throw new Error('Failed to retrieve updated workspace');
      }

      // Emit workspace updated event
      await this.emitWorkspaceEvent(updatedWorkspace, 'workspace_updated', {
        fieldsUpdated: Object.keys(updates),
        titleChanged: 'title' in updates,
        settingsChanged: 'settings' in updates,
      });

      logger.info('[hermes-workspaces] Workspace updated', { 
        workspaceId: request.workspaceId,
        fieldsUpdated: Object.keys(updates) 
      });

      return updatedWorkspace;
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to update workspace', { 
        workspaceId: request.workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Handle handoff from chat or other source to workspace
   */
  async handleHandoff(request: WorkspaceHandoffRequest): Promise<{ 
    workspace: HermesWorkspace;
    handoffId: string;
    resumeUrl: string; 
  }> {
    const workspace = await this.getWorkspace(request.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${request.workspaceId}`);
    }

    const handoffId = `handoff_${randomUUID()}`;
    const resumeUrl = `/workspace/${request.workspaceId}?handoff=${handoffId}`;

    try {
      // Update workspace with handoff context
      const handoffMetadata = {
        ...workspace.metadata,
        lastHandoff: {
          id: handoffId,
          timestamp: new Date().toISOString(),
          fromRunId: request.fromRunId,
          context: request.context,
        }
      };

      await this.updateWorkspace({
        workspaceId: request.workspaceId,
        metadata: handoffMetadata,
      });

      // Emit handoff event
      await this.emitWorkspaceEvent(workspace, 'workspace_handoff', {
        handoffId,
        fromRunId: request.fromRunId,
        intent: request.context.intent,
        source: request.context.source,
        resumeUrl,
      });

      logger.info('[hermes-workspaces] Workspace handoff completed', { 
        workspaceId: request.workspaceId,
        handoffId,
        fromRunId: request.fromRunId,
        source: request.context.source 
      });

      return {
        workspace: await this.getWorkspace(request.workspaceId) as HermesWorkspace,
        handoffId,
        resumeUrl,
      };
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to handle workspace handoff', { 
        workspaceId: request.workspaceId,
        fromRunId: request.fromRunId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Open workspace for editing/viewing
   */
  async openWorkspace(
    workspaceId: WorkspaceId, 
    userId: UserId,
    mode: 'view' | 'edit' = 'view'
  ): Promise<{
    workspace: HermesWorkspace;
    sessionId: string;
    canEdit: boolean;
  }> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Check permissions
    const canEdit = workspace.userId === userId || mode === 'view';
    
    const sessionId = `session_${randomUUID()}`;

    try {
      // Update workspace with session info
      const sessionMetadata = {
        ...workspace.metadata,
        lastSession: {
          id: sessionId,
          userId,
          mode,
          openedAt: new Date().toISOString(),
        }
      };

      await this.updateWorkspace({
        workspaceId,
        metadata: sessionMetadata,
      });

      // Emit workspace opened event
      await this.emitWorkspaceEvent(workspace, 'workspace_opened', {
        sessionId,
        userId,
        mode,
        canEdit,
      });

      logger.info('[hermes-workspaces] Workspace opened', { 
        workspaceId,
        userId,
        sessionId,
        mode 
      });

      return {
        workspace: await this.getWorkspace(workspaceId) as HermesWorkspace,
        sessionId,
        canEdit,
      };
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to open workspace', { 
        workspaceId,
        userId,
        mode,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Create a workspace from a successful run/chat
   */
  async createFromRun(
    runId: RunId, 
    userId: UserId, 
    title: string,
    description?: string
  ): Promise<HermesWorkspace> {
    const workspace = await this.createWorkspace({
      userId,
      title,
      description,
      metadata: {
        createdFromRun: runId,
        sourceType: 'run_completion',
        createdAt: new Date().toISOString(),
      }
    });

    logger.info('[hermes-workspaces] Workspace created from run', { 
      workspaceId: workspace.id,
      runId,
      userId 
    });

    return workspace;
  }

  /**
   * Archive a workspace
   */
  async archiveWorkspace(workspaceId: WorkspaceId): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    try {
      await this.updateWorkspace({
        workspaceId,
        metadata: {
          ...workspace.metadata,
          archived: true,
          archivedAt: new Date().toISOString(),
        }
      });

      // Emit workspace archived event
      await this.emitWorkspaceEvent(workspace, 'workspace_archived', {
        archivedAt: new Date().toISOString(),
      });

      logger.info('[hermes-workspaces] Workspace archived', { workspaceId });
    } catch (error) {
      logger.error('[hermes-workspaces] Failed to archive workspace', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Emit an event related to this workspace
   */
  private async emitWorkspaceEvent(
    workspace: HermesWorkspace,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const event: HermesEventEnvelope = {
      eventId: randomUUID(),
      runId: `workspace_${workspace.id}`, // Workspace-level events use synthetic run ID
      workspaceId: workspace.id,
      domain: 'workspace' as any, // Workspace events are cross-domain
      eventType: eventType as any,
      timestamp: new Date().toISOString(),
      sequence: 0, // Will be set by streaming engine
      payload,
      metadata: {
        workspaceTitle: workspace.title,
        workspaceOwner: workspace.userId,
      }
    };

    try {
      await this.streaming.emitRunEvent(event);
    } catch (error) {
      logger.warn('[hermes-workspaces] Failed to emit workspace event', { 
        workspaceId: workspace.id,
        eventType,
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't throw - event emission failure shouldn't break workspace operations
    }
  }
}

// Singleton instance
let workspaceManagerInstance: HermesWorkspaceManager | null = null;

export function getHermesWorkspaceManager(): HermesWorkspaceManager {
  if (!workspaceManagerInstance) {
    workspaceManagerInstance = new HermesWorkspaceManager();
  }
  return workspaceManagerInstance;
}