/**
 * Hermes Deep Research Generation API
 * 
 * Provides artifact-first research report generation through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateResearchRequestSchema = z.object({
  workspaceId: z.string().min(1),
  topic: z.string().min(1),
  depth: z.enum(["quick", "standard", "deep"]).default("standard"),
  preferredSources: z.array(z.string()).optional(),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to generate research.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/research/generate - Create new research artifact run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateResearchRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "research",
      config: {
        topic: validated.topic,
        depth: validated.depth,
        preferredSources: validated.preferredSources || [],
      },
      metadata: {
        requestId: validated.requestId || `research-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-research] Research generation started", {
      runId: run.id,
      workspaceId: validated.workspaceId,
      topic: validated.topic,
      userId: String(user._id),
    });

    return Response.json(
      {
        data: {
          runId: run.id,
          streamUrl: `/api/hermes/runs/${run.id}`,
          workspaceId: validated.workspaceId,
        },
      },
      { status: 201 }
    );
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

    logger.error("[hermes-research] Research generation failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start research generation",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
