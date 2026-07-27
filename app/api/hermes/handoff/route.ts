/**
 * Hermes Cross-Domain Handoff API
 * 
 * Orchestrates seamless cross-domain run transitions:
 * chat <-> research <-> sheets <-> slides <-> writing <-> books <-> publish
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { CrossDomainHandoffSchema } from "@/lib/hermes/contracts/handoff";
import { z } from "zod";
import logger from "@/lib/logger";

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      message: "Please sign in to perform cross-domain handoff.",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/handoff - Create a cross-domain run handoff
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = CrossDomainHandoffSchema.parse(body);

    const hermes = getHermesOrchestrator();

    const run = await hermes.createRun({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      domain: validated.targetDomain,
      config: {
        sourceDomain: validated.sourceDomain,
        sourceRunId: validated.sourceRunId,
        sourceSessionId: validated.sourceSessionId,
        contextSummary: validated.contextSummary,
        artifacts: validated.artifacts,
        instructions: validated.instructions,
      },
      metadata: {
        handoffId: `handoff-${Date.now()}`,
      },
    });

    await hermes.startRun(run.id);

    logger.info("[hermes-handoff] Cross-domain handoff executed", {
      runId: run.id,
      sourceDomain: validated.sourceDomain,
      targetDomain: validated.targetDomain,
      workspaceId: validated.workspaceId,
      userId: String(user._id),
    });

    return Response.json(
      {
        data: {
          handoffId: `handoff-${Date.now()}`,
          targetRunId: run.id,
          streamUrl: `/api/hermes/runs/${run.id}`,
          sourceDomain: validated.sourceDomain,
          targetDomain: validated.targetDomain,
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

    logger.error("[hermes-handoff] Handoff execution failed", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to execute cross-domain handoff",
        code: "HANDOFF_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
