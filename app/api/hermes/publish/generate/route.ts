/**
 * Hermes Publish API
 * 
 * Provides artifact-first distribution and publishing runs through the Hermes backend.
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const GeneratePublishRequestSchema = z.object({
  workspaceId: z.string().min(1),
  artifactId: z.string().min(1),
  channel: z.enum(["community", "marketplace", "web", "export"]).default("web"),
  title: z.string().optional(),
  requestId: z.string().optional(),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to publish artifacts.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/publish/generate - Create new publish job run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = GeneratePublishRequestSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: "publish",
      config: {
        targetArtifactId: validated.artifactId,
        channel: validated.channel,
        title: validated.title || "Publish Job",
      },
      metadata: {
        requestId: validated.requestId || `publish-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-publish] Publish job started", {
      runId: run.id,
      workspaceId: validated.workspaceId,
      artifactId: validated.artifactId,
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

    logger.error("[hermes-publish] Publish job failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to start publish job",
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
