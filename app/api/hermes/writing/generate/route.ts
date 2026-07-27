/**
 * Hermes Writing Generation API
 * 
 * Provides artifact-first writing and document drafting through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateWritingRequestSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  genre: z.string().default("article"),
  targetLength: z.number().int().min(100).max(50000).default(1000),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to start writing.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/writing/generate - Create new writing artifact run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateWritingRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "writing",
      config: {
        title: validated.title,
        prompt: validated.prompt,
        genre: validated.genre,
        targetLength: validated.targetLength,
      },
      metadata: {
        requestId: validated.requestId || `writing-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-writing] Writing generation started", {
      runId: run.id,
      workspaceId: validated.workspaceId,
      title: validated.title,
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

    logger.error("[hermes-writing] Writing generation failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start writing generation",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
