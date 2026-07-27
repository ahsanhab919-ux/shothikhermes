/**
 * Hermes Sheets Generation API
 * 
 * Provides artifact-first spreadsheet generation through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GenerateSheetsRequestSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  columns: z.array(z.string()).optional(),
  rowCount: z.number().int().min(1).max(1000).default(20),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to generate sheets.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/sheets/generate - Create new sheet artifact run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GenerateSheetsRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();
    
    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "sheets",
      config: {
        title: validated.title,
        prompt: validated.prompt,
        columns: validated.columns || [],
        rowCount: validated.rowCount,
      },
      metadata: {
        requestId: validated.requestId || `sheets-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-sheets] Sheet generation started", {
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

    logger.error("[hermes-sheets] Sheet generation failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start sheet generation",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
