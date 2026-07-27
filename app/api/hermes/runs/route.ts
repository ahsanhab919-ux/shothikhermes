import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator, type CreateRunRequest } from "@/lib/hermes";
import {
  ArtifactDomainSchema,
  SessionIdSchema,
  WorkspaceIdSchema,
} from "@/lib/hermes/contracts/core";
import { z } from "zod";
import logger from "@/lib/logger";

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "HERMES_AUTH_REQUIRED",
      message: "Please sign in to create Hermes runs.",
    },
    { status: 401 },
  );
}

const CreateRunBodySchema = z.object({
  sessionId: SessionIdSchema.optional(),
  workspaceId: WorkspaceIdSchema,
  domain: ArtifactDomainSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/hermes/runs - Create a new run
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = CreateRunBodySchema.parse(body);

    const hermes = getHermesOrchestrator();

    const createRequest: CreateRunRequest = {
      sessionId: validated.sessionId,
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: validated.domain,
      config: validated.config,
      metadata: validated.metadata,
    };

    const run = await hermes.createRun(createRequest);

    logger.info("[api] Hermes run created", {
      runId: run.id,
      domain: run.domain,
      workspaceId: run.workspaceId,
      userId: String(user._id),
    });

    return Response.json(
      {
        data: {
          run,
          streamUrl: `/api/hermes/runs/${run.id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    logger.error("[api] Failed to create run", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to create run",
        code: "CREATE_RUN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
