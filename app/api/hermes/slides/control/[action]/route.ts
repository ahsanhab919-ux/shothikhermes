/**
 * Hermes Slides Control API
 * 
 * Provides run lifecycle control for slide generation:
 * - Pause/resume generation
 * - Update slide content
 * - Export slide decks
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const PauseResumeRequestSchema = z.object({
  runId: z.string().min(1),
  jobId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
});

const UpdateSlideRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  jobId: z.string().min(1),
  slideIndex: z.number().min(0),
  content: z.object({
    title: z.string().optional(),
    bulletPoints: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

const ExportRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  jobId: z.string().min(1),
  format: z.enum(["pdf", "pptx", "html", "json"]).default("pdf"),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/slides/control/pause - Pause slide generation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { action } = await params;

  try {
    const body = await request.json();
    const hermes = getHermesOrchestrator();
    const slidesOrchestrator = hermes.slidesOrchestrator;

    switch (action) {
      case "pause": {
        const validated = PauseResumeRequestSchema.parse(body);
        await slidesOrchestrator.pauseSlideGeneration({
          ...validated,
          userId: String(user._id),
        });
        logger.info('[hermes-slides] Generation paused', { runId: validated.runId, jobId: validated.jobId });
        return Response.json({ success: true });
      }

      case "resume": {
        const validated = PauseResumeRequestSchema.parse(body);
        await slidesOrchestrator.resumeSlideGeneration({
          ...validated,
          userId: String(user._id),
        });
        logger.info('[hermes-slides] Generation resumed', { runId: validated.runId, jobId: validated.jobId });
        return Response.json({ success: true });
      }

      case "update": {
        const validated = UpdateSlideRequestSchema.parse(body);
        await slidesOrchestrator.updateSlideContent({
          ...validated,
          userId: String(user._id),
        });
        logger.info('[hermes-slides] Slide content updated', { 
          runId: validated.runId, 
          slideIndex: validated.slideIndex 
        });
        return Response.json({ success: true });
      }

      case "export": {
        const validated = ExportRequestSchema.parse(body);
        const result = await slidesOrchestrator.exportSlideDeck({
          ...validated,
          userId: String(user._id),
        });
        logger.info('[hermes-slides] Deck exported', { 
          runId: validated.runId, 
          format: validated.format 
        });
        return Response.json({ data: result });
      }

      default:
        return Response.json(
          { error: "Invalid action", code: "INVALID_ACTION" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    logger.error('[hermes-slides] Control action failed', {
      action,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: `Failed to ${action} slide generation`,
        code: "CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}