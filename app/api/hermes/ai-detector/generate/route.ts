/**
 * Hermes AI Detector API
 * 
 * Provides artifact-first AI content detection report runs through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateAIDetectorRequestSchema = z.object({
  workspaceId: z.string().min(1),
  text: z.string().min(10),
  title: z.string().optional(),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to run AI detection.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/ai-detector/generate - Create new AI detector artifact run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateAIDetectorRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "ai-detector",
      config: {
        text: validated.text,
        title: validated.title || "AI Detection Report",
      },
      metadata: {
        requestId: validated.requestId || `ai-detector-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-ai-detector] AI detection started", {
      runId: run.id,
      workspaceId: validated.workspaceId,
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

    logger.error("[hermes-ai-detector] AI detection failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start AI detection",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
