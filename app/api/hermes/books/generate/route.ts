/**
 * Hermes Books Generation API
 * 
 * Provides artifact-first book authoring and manuscript generation through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateBookRequestSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  outline: z.array(z.string()).optional(),
  genre: z.string().default("non-fiction"),
  targetChapterCount: z.number().int().min(1).max(100).default(10),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to start book generation.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/books/generate - Create new book artifact run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateBookRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "books",
      config: {
        title: validated.title,
        outline: validated.outline || [],
        genre: validated.genre,
        targetChapterCount: validated.targetChapterCount,
      },
      metadata: {
        requestId: validated.requestId || `book-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-books] Book generation started", {
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

    logger.error("[hermes-books] Book generation failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start book generation",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
