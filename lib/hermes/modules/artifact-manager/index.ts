/**
 * Hermes Artifact Manager
 * 
 * Manages artifact lifecycle, versioning, and cross-artifact linking.
 * Implements the canonical artifact contracts from ADR-001.
 */

import { randomUUID } from "crypto";
import { getHermesDatabase } from "@/lib/hermes/infra/db";
import { getHermesStreamingEngine } from "@/lib/hermes/modules/streaming-engine";
import logger from "@/lib/logger";
import type { 
  HermesArtifact, 
  HermesEventEnvelope,
  ArtifactId, 
  RunId, 
  WorkspaceId, 
  UserId,
  ArtifactDomain,
  ArtifactStatus 
} from "@/lib/hermes/contracts/core";

export interface CreateArtifactRequest {
  workspaceId: WorkspaceId;
  runId: RunId;
  userId: UserId;
  domain: ArtifactDomain;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateArtifactRequest {
  artifactId: ArtifactId;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  title?: string;
  description?: string;
  status?: ArtifactStatus;
}

export interface ArtifactPatch {
  path: string; // JSONPath to the field being updated
  operation: 'set' | 'delete' | 'append' | 'merge';
  value?: unknown;
}

export class HermesArtifactManager {
  private db = getHermesDatabase();
  private streaming = getHermesStreamingEngine();

  /**
   * Create a new artifact
   */
  async createArtifact(request: CreateArtifactRequest): Promise<HermesArtifact> {
    const artifactId = `art_${randomUUID()}`;
    const now = new Date().toISOString();

    const artifact: Omit<HermesArtifact, 'createdAt' | 'updatedAt'> = {
      id: artifactId,
      workspaceId: request.workspaceId,
      runId: request.runId,
      userId: request.userId,
      domain: request.domain,
      status: 'initializing',
      title: request.title,
      description: request.description,
      content: request.content || {},
      metadata: request.metadata || {},
      version: 1,
    };

    try {
      const createdArtifact = await this.db.createArtifact(artifact);

      // Emit artifact created event
      await this.emitArtifactEvent(createdArtifact, 'artifact_created', {
        title: createdArtifact.title,
        domain: createdArtifact.domain,
        initialContent: !!Object.keys(createdArtifact.content).length
      });

      logger.info('[hermes-artifacts] Artifact created', { 
        artifactId,
        domain: request.domain,
        runId: request.runId 
      });

      return createdArtifact;
    } catch (error) {
      logger.error('[hermes-artifacts] Failed to create artifact', { 
        runId: request.runId,
        domain: request.domain,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Get an artifact by ID
   */
  async getArtifact(artifactId: ArtifactId): Promise<HermesArtifact | null> {
    try {
      return await this.db.getArtifact(artifactId);
    } catch (error) {
      logger.error('[hermes-artifacts] Failed to get artifact', { 
        artifactId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Update artifact with structured patches
   */
  async updateArtifact(request: UpdateArtifactRequest): Promise<HermesArtifact> {
    const existing = await this.getArtifact(request.artifactId);
    if (!existing) {
      throw new Error(`Artifact not found: ${request.artifactId}`);
    }

    const updates: Partial<HermesArtifact> = {};

    if (request.content !== undefined) {
      updates.content = request.content;
    }

    if (request.metadata !== undefined) {
      updates.metadata = request.metadata;
    }

    if (request.title !== undefined) {
      updates.title = request.title;
    }

    if (request.description !== undefined) {
      updates.description = request.description;
    }

    if (request.status !== undefined) {
      updates.status = request.status;
    }

    try {
      await this.db.updateArtifact(request.artifactId, updates);

      // Get the updated artifact
      const updatedArtifact = await this.getArtifact(request.artifactId);
      if (!updatedArtifact) {
        throw new Error('Failed to retrieve updated artifact');
      }

      // Emit artifact updated event
      await this.emitArtifactEvent(updatedArtifact, 'artifact_updated', {
        fieldsUpdated: Object.keys(updates),
        contentChanged: 'content' in updates,
        statusChanged: 'status' in updates ? { 
          from: existing.status, 
          to: request.status 
        } : undefined
      });

      logger.info('[hermes-artifacts] Artifact updated', { 
        artifactId: request.artifactId,
        fieldsUpdated: Object.keys(updates) 
      });

      return updatedArtifact;
    } catch (error) {
      logger.error('[hermes-artifacts] Failed to update artifact', { 
        artifactId: request.artifactId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Apply structured patches to artifact content
   */
  async applyPatches(artifactId: ArtifactId, patches: ArtifactPatch[]): Promise<HermesArtifact> {
    const existing = await this.getArtifact(artifactId);
    if (!existing) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    let updatedContent = { ...existing.content };

    for (const patch of patches) {
      try {
        updatedContent = this.applyPatch(updatedContent, patch);
      } catch (patchError) {
        logger.error('[hermes-artifacts] Failed to apply patch', { 
          artifactId,
          patch,
          error: patchError instanceof Error ? patchError.message : String(patchError) 
        });
        throw new Error(`Patch application failed at path '${patch.path}': ${patchError}`);
      }
    }

    return await this.updateArtifact({
      artifactId,
      content: updatedContent,
    });
  }

  /**
   * Create a new version of an artifact
   */
  async createVersion(artifactId: ArtifactId, label?: string): Promise<HermesArtifact> {
    const existing = await this.getArtifact(artifactId);
    if (!existing) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const newVersion = existing.version + 1;

    try {
      const versionedArtifact = await this.updateArtifact({
        artifactId,
        status: 'versioned',
        metadata: {
          ...existing.metadata,
          versionLabel: label,
          versionCreatedAt: new Date().toISOString(),
          previousVersion: existing.version,
        }
      });

      // Update version number
      await this.db.updateArtifact(artifactId, { version: newVersion });

      // Get the final versioned artifact
      const finalArtifact = await this.getArtifact(artifactId);
      if (!finalArtifact) {
        throw new Error('Failed to retrieve versioned artifact');
      }

      // Emit version created event
      await this.emitArtifactEvent(finalArtifact, 'artifact_versioned', {
        version: newVersion,
        previousVersion: existing.version,
        label: label,
        snapshotSize: JSON.stringify(finalArtifact.content).length
      });

      logger.info('[hermes-artifacts] Artifact version created', { 
        artifactId,
        version: newVersion,
        label 
      });

      return finalArtifact;
    } catch (error) {
      logger.error('[hermes-artifacts] Failed to create artifact version', { 
        artifactId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Mark artifact as ready for use
   */
  async markReady(artifactId: ArtifactId): Promise<HermesArtifact> {
    return await this.updateArtifact({
      artifactId,
      status: 'ready',
    });
  }

  /**
   * Archive an artifact
   */
  async archive(artifactId: ArtifactId): Promise<HermesArtifact> {
    return await this.updateArtifact({
      artifactId,
      status: 'archived',
    });
  }

  /**
   * Apply a single patch to content
   */
  private applyPatch(content: Record<string, unknown>, patch: ArtifactPatch): Record<string, unknown> {
    const pathParts = patch.path.split('.');
    const result = JSON.parse(JSON.stringify(content)); // Deep clone

    if (pathParts.length === 0) {
      throw new Error('Invalid patch path: empty');
    }

    // Navigate to parent and apply operation
    let current = result;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const finalKey = pathParts[pathParts.length - 1];

    switch (patch.operation) {
      case 'set':
        current[finalKey] = patch.value;
        break;
        
      case 'delete':
        delete current[finalKey];
        break;
        
      case 'append':
        if (!Array.isArray(current[finalKey])) {
          current[finalKey] = [];
        }
        (current[finalKey] as unknown[]).push(patch.value);
        break;
        
      case 'merge':
        if (typeof current[finalKey] !== 'object' || current[finalKey] === null) {
          current[finalKey] = {};
        }
        Object.assign(current[finalKey] as Record<string, unknown>, patch.value);
        break;
        
      default:
        throw new Error(`Unknown patch operation: ${patch.operation}`);
    }

    return result;
  }

  /**
   * Emit an event related to this artifact
   */
  private async emitArtifactEvent(
    artifact: HermesArtifact, 
    eventType: 'artifact_created' | 'artifact_updated' | 'artifact_versioned',
    payload: Record<string, unknown>
  ): Promise<void> {
    const event: HermesEventEnvelope = {
      eventId: randomUUID(),
      runId: artifact.runId,
      workspaceId: artifact.workspaceId,
      artifactId: artifact.id,
      domain: artifact.domain,
      eventType,
      timestamp: new Date().toISOString(),
      sequence: 0, // Will be set by the streaming engine
      payload,
      metadata: {
        artifactTitle: artifact.title,
        artifactStatus: artifact.status,
        artifactVersion: artifact.version,
      }
    };

    try {
      await this.streaming.emitRunEvent(event);
    } catch (error) {
      logger.warn('[hermes-artifacts] Failed to emit artifact event', { 
        artifactId: artifact.id,
        eventType,
        error: error instanceof Error ? error.message : String(error) 
      });
      // Don't throw - event emission failure shouldn't break artifact operations
    }
  }
}

// Singleton instance
let artifactManagerInstance: HermesArtifactManager | null = null;

export function getHermesArtifactManager(): HermesArtifactManager {
  if (!artifactManagerInstance) {
    artifactManagerInstance = new HermesArtifactManager();
  }
  return artifactManagerInstance;
}