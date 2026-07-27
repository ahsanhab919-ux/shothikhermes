/**
 * Hermes Slides Orchestrator Module
 * 
 * Provides the main orchestration layer for slide generation workflows,
 * integrating the existing slide-generation service with Hermes backend architecture.
 */

import { randomUUID } from "crypto";
import { getHermesDatabase } from "../../infra/db";
import { getHermesStreamingEngine } from "../streaming-engine";
import { getHermesArtifactManager } from "../artifact-manager";
import logger from "@/lib/logger";
import type { 
  GenerateSlidesCommand,
  ResumeSlideGenerationCommand,
  PauseSlideGenerationCommand,
  UpdateSlideContentCommand,
  ExportSlideDeckCommand,
  HermesRunEventEnvelope 
} from "../../contracts/slides";
import type { 
  RunId, 
  WorkspaceId, 
  UserId, 
  ArtifactId, 
  HermesRun 
} from "../../contracts/core";

// Import existing slide generation service (legacy adapter)
import { 
  createSlideJob,
  getSlideJobStatus,
  pauseSlideJob,
  resumeSlideJob,
  subscribeToJobProgress,
  SlideJob 
} from "@/services/slide-generation";

export interface SlidesOrchestrator {
  generateSlides: (command: GenerateSlidesCommand) => Promise<RunId>;
  resumeSlideGeneration: (command: ResumeSlideGenerationCommand) => Promise<void>;
  pauseSlideGeneration: (command: PauseSlideGenerationCommand) => Promise<void>;
  updateSlideContent: (command: UpdateSlideContentCommand) => Promise<void>;
  exportSlideDeck: (command: ExportSlideDeckCommand) => Promise<{ url: string; format: string }>;
  getRunStatus: (runId: RunId) => Promise<{ status: string; progress: number }>;
}

export function getHermesSlidesOrchestrator(): SlidesOrchestrator {
  const db = getHermesDatabase();
  const streaming = getHermesStreamingEngine();
  const artifacts = getHermesArtifactManager();

  return {
    generateSlides: async (command: GenerateSlidesCommand): Promise<RunId> => {
      const runId = randomUUID() as RunId;
      
      logger.info("Starting slide generation", { 
        runId, 
        workspaceId: command.workspaceId,
        topic: command.topic 
      });

      try {
        // Create Hermes run record
        const run: HermesRun = {
          id: runId,
          workspaceId: command.workspaceId,
          userId: command.userId as UserId,
          domain: "slides",
          status: "running",
          config: {
            topic: command.topic,
            slideCount: command.slideCount,
            template: command.template,
            targetAudience: command.targetAudience,
            language: command.language,
          },
          metadata: {
            requestId: command.requestId,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.createRun(run);

        // Create slide artifact placeholder
        const artifact = await artifacts.createArtifact({
          runId,
          workspaceId: command.workspaceId,
          userId: command.userId as UserId,
          domain: "slides",
          title: `Slides: ${command.topic}`,
          content: { slides: [], status: "generating" },
          metadata: {
            template: command.template,
            slideCount: command.slideCount,
          },
        });
        
        const artifactId = artifact.id;

        // Bridge to existing slide generation service
        const legacyJobResult = await createSlideJob({
          topic: command.topic,
          slideCount: command.slideCount,
          template: command.template,
          targetAudience: command.targetAudience || "",
          language: command.language || "en",
          userId: command.userId,
        });

        if (!legacyJobResult?.jobId) {
          throw new Error("Failed to create slide generation job");
        }

        // Store legacy job mapping for adapter pattern
        await db.updateRunStatus(runId, "running", {
          ...run.metadata,
          legacyJobId: legacyJobResult.jobId,
          artifactId,
        });

        // Emit start event
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId,
          workspaceId: command.workspaceId,
          artifactId,
          domain: "slides",
          eventType: "run_started",
          timestamp: new Date().toISOString(),
          sequence: 1,
          payload: {
            topic: command.topic,
            slideCount: command.slideCount,
            template: command.template,
          },
          metadata: {
            legacyJobId: legacyJobResult.jobId,
          },
        });

        // Start progress monitoring (non-blocking)
        monitorSlideProgress(runId, legacyJobResult.jobId, command.workspaceId, artifactId).catch(err => {
          logger.error("Slide progress monitoring failed", { runId, error: err.message });
        });

        return runId;
        
      } catch (error) {
        logger.error("Slide generation failed", { runId, error: error.message });
        
        await db.updateRunStatus(runId, "failed");
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId,
          workspaceId: command.workspaceId,
          domain: "slides",
          eventType: "run_failed",
          timestamp: new Date().toISOString(),
          sequence: 2,
          payload: { error: error.message },
          metadata: {
            errorSource: "generation",
          },
        });
        
        throw error;
      }
    },

    resumeSlideGeneration: async (command: ResumeSlideGenerationCommand): Promise<void> => {
      logger.info("Resuming slide generation", { runId: command.runId });
      
      try {
        await resumeSlideJob(command.jobId);
        await db.updateRunStatus(command.runId, "running");
        
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId: command.runId,
          workspaceId: command.workspaceId,
          domain: "slides",
          eventType: "run_resumed",
          timestamp: new Date().toISOString(),
          sequence: 1,
          payload: { jobId: command.jobId },
          metadata: {
            action: "resume",
            requestId: command.requestId,
          },
        });
        
      } catch (error) {
        logger.error("Failed to resume slide generation", { runId: command.runId, error: error.message });
        throw error;
      }
    },

    pauseSlideGeneration: async (command: PauseSlideGenerationCommand): Promise<void> => {
      logger.info("Pausing slide generation", { runId: command.runId });
      
      try {
        await pauseSlideJob(command.jobId);
        await db.updateRunStatus(command.runId, "paused");
        
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId: command.runId,
          workspaceId: command.workspaceId,
          domain: "slides",
          eventType: "run_paused",
          timestamp: new Date().toISOString(),
          sequence: 1,
          payload: { jobId: command.jobId },
          metadata: {
            action: "pause",
            requestId: command.requestId,
          },
        });
        
      } catch (error) {
        logger.error("Failed to pause slide generation", { runId: command.runId, error: error.message });
        throw error;
      }
    },

    updateSlideContent: async (command: UpdateSlideContentCommand): Promise<void> => {
      logger.info("Updating slide content", { runId: command.runId, slideIndex: command.slideIndex });
      
      try {
        // Get current artifact
        const run = await db.getRun(command.runId);
        if (!run?.metadata?.artifactId) {
          throw new Error("Run artifact not found");
        }
        
        const artifactId = run.metadata.artifactId as ArtifactId;
        const artifact = await artifacts.getArtifact(artifactId);
        
        if (!artifact) {
          throw new Error("Artifact not found");
        }
        
        // Update slide content via patch
        const slidePatch = {
          [`slides.${command.slideIndex}`]: command.content
        };
        
        await artifacts.updateArtifact({
          artifactId,
          content: slidePatch,
        });
        
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId: command.runId,
          workspaceId: command.workspaceId,
          artifactId,
          domain: "slides",
          eventType: "artifact_updated",
          timestamp: new Date().toISOString(),
          sequence: 1,
          payload: {
            slideIndex: command.slideIndex,
            content: command.content,
          },
          metadata: {
            action: "update",
            requestId: command.requestId,
            slideId: `slide_${command.slideIndex}`,
          },
        });
        
      } catch (error) {
        logger.error("Failed to update slide content", { runId: command.runId, error: error.message });
        throw error;
      }
    },

    exportSlideDeck: async (command: ExportSlideDeckCommand): Promise<{ url: string; format: string }> => {
      logger.info("Exporting slide deck", { runId: command.runId, format: command.format });
      
      try {
        // For now, return a placeholder URL - in production this would:
        // 1. Generate the export via the legacy service
        // 2. Store the result in blob storage
        // 3. Return the download URL
        
        const exportUrl = `/api/hermes/runs/${command.runId}/export?format=${command.format}`;
        
        await streaming.emitRunEvent({
          eventId: randomUUID(),
          runId: command.runId,
          workspaceId: command.workspaceId,
          domain: "slides",
          eventType: "run_completed",
          timestamp: new Date().toISOString(),
          sequence: 1,
          payload: {
            format: command.format,
            url: exportUrl,
          },
          metadata: {
            action: "export",
            requestId: command.requestId,
            exportFormat: command.format,
          },
        });
        
        return {
          url: exportUrl,
          format: command.format,
        };
        
      } catch (error) {
        logger.error("Failed to export slide deck", { runId: command.runId, error: error.message });
        throw error;
      }
    },

    getRunStatus: async (runId: RunId): Promise<{ status: string; progress: number }> => {
      try {
        const run = await db.getRun(runId);
        if (!run) {
          throw new Error("Run not found");
        }
        
        // Get progress from legacy job if available
        const legacyJobId = run.metadata?.legacyJobId as string;
        let progress = 0;
        
        if (legacyJobId) {
          const jobStatus = await getSlideJobStatus(legacyJobId);
          progress = jobStatus?.progress || 0;
        }
        
        return {
          status: run.status,
          progress,
        };
        
      } catch (error) {
        logger.error("Failed to get run status", { runId, error: error.message });
        throw error;
      }
    },
  };
}

/**
 * Monitor slide generation progress from legacy service and emit Hermes events
 */
async function monitorSlideProgress(
  runId: RunId, 
  legacyJobId: string, 
  workspaceId: WorkspaceId,
  artifactId: ArtifactId
): Promise<void> {
  const streaming = getHermesStreamingEngine();
  const artifacts = getHermesArtifactManager();
  const db = getHermesDatabase();
  
  logger.info("Starting slide progress monitoring", { runId, legacyJobId });

  try {
    // Subscribe to legacy progress events
    const unsubscribe = subscribeToJobProgress(legacyJobId, async (job: SlideJob) => {
      logger.debug("Slide progress update", { runId, status: job.status, progress: job.progress });
      
      // Convert legacy status to Hermes event
      const eventType = mapLegacyStatusToEvent(job.status);
      
      await streaming.emitRunEvent({
        eventId: randomUUID(),
        runId,
        workspaceId,
        artifactId,
        domain: "slides",
        eventType,
        timestamp: new Date().toISOString(),
        sequence: 1,
        payload: {
          status: job.status,
          progress: job.progress,
          currentStep: job.currentStep,
          slides: job.slides,
          error: job.error,
        },
        metadata: {
          legacyJobId,
          monitoringUpdate: true,
        },
      });
      
      // Update artifact content if slides are available
      if (job.slides && job.slides.length > 0) {
        await artifacts.updateArtifact({
          artifactId,
          content: {
            slides: job.slides,
            status: job.status,
            progress: job.progress,
          },
        });
      }
      
      // Update run status for terminal states
      if (job.status === "completed") {
        await db.updateRunStatus(runId, "completed");
        unsubscribe(); // Stop monitoring
        
      } else if (job.status === "failed") {
        await db.updateRunStatus(runId, "failed");
        unsubscribe(); // Stop monitoring
      }
    });
    
  } catch (error) {
    logger.error("Slide progress monitoring error", { runId, legacyJobId, error: error.message });
    
    await streaming.emitRunEvent({
      eventId: randomUUID(),
      runId,
      workspaceId,
      artifactId,
      domain: "slides",
      eventType: "run_failed",
      timestamp: new Date().toISOString(),
      sequence: 1,
      payload: { error: error.message },
      metadata: {
        legacyJobId,
        errorSource: "monitoring",
      },
    });
    
    await db.updateRunStatus(runId, "failed");
  }
}

/**
 * Map legacy slide job status to Hermes event types
 */
function mapLegacyStatusToEvent(status: string): "progress_update" | "run_paused" | "run_completed" | "run_failed" {
  const statusMap: Record<string, "progress_update" | "run_paused" | "run_completed" | "run_failed"> = {
    "outline": "progress_update",
    "design": "progress_update", 
    "content": "progress_update",
    "formatting": "progress_update",
    "review": "progress_update",
    "paused": "run_paused",
    "completed": "run_completed",
    "failed": "run_failed",
  };
  
  return statusMap[status] || "progress_update";
}