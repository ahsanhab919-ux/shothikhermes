/**
 * Hermes Slides Generation API
 * 
 * Provides artifact-first slide generation through the Hermes backend.
 * Replaces direct calls to legacy slide generation services.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateSlidesRequestSchema = z.object({
  workspaceId: z.string().min(1),
  topic: z.string().min(1),
  slideCount: z.number().min(1).max(50).default(10),
  template: z.string().default("professional"),
  targetAudience: z.string().default("general"),
  language: z.string().default("en"),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to generate slides.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/slides/generate - Create new slide deck artifact
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateSlidesRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();
    const slidesOrchestrator = hermes.slidesOrchestrator;
    
    const runId = await slidesOrchestrator.generateSlides({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      topic: validated.topic,
      slideCount: validated.slideCount,
      template: validated.template,
      targetAudience: validated.targetAudience,
      language: validated.language,
      requestId: validated.requestId || `slides-${Date.now()}`,
    });

    logger.info('[hermes-slides] Slide generation started', {
      runId,
      workspaceId: validated.workspaceId,
      topic: validated.topic,
      userId: String(user._id),
    });

    return Response.json({
      data: {
        runId,
        streamUrl: `/api/hermes/runs/${runId}`,
        workspaceId: validated.workspaceId,
      }
    }, { status: 201 });
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

    logger.error('[hermes-slides] Slide generation failed', {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start slide generation",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}