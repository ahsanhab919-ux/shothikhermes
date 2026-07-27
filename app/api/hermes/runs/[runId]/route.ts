import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import logger from "@/lib/logger";
import { z } from "zod";

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "HERMES_AUTH_REQUIRED",
      message: "Please sign in to create Hermes runs.",
    },
    { status: 401 }
  );
}

/**
 * GET /api/hermes/runs/[runId] - Get run context with streaming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { runId } = await params;
  
  try {
    const hermes = getHermesOrchestrator();
    const context = await hermes.getRunContext(runId);
    const hotState = await hermes.events.getRunHotState(runId);
    
    if (!context) {
      return Response.json(
        { error: "Run not found", code: "RUN_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify user has access to this run
    if (context.run.userId !== String(user._id)) {
      return Response.json(
        { error: "Access denied", code: "ACCESS_DENIED" },
        { status: 403 }
      );
    }

    // Check if client wants streaming response
    const accept = request.headers.get('accept');
    if (accept?.includes('text/event-stream')) {
      // Return Server-Sent Events stream
      return new Response(context.streaming, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable Nginx buffering
        },
      });
    }

    // Return JSON context without streaming
    return Response.json({
      data: {
        run: context.run,
        workspace: context.workspace,
        canResume: context.canResume,
        hotState,
      }
    });
  } catch (error) {
    logger.error('[api] Failed to get run context', {
      runId,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to get run context",
        code: "GET_RUN_CONTEXT_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

const RunActionBodySchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

/**
 * POST /api/hermes/runs/[runId] - Control a run (pause, resume, cancel)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { runId } = await params;

  try {
    const hermes = getHermesOrchestrator();
    const context = await hermes.getRunContext(runId);

    if (!context) {
      return Response.json(
        { error: "Run not found", code: "RUN_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (context.run.userId !== String(user._id)) {
      return Response.json(
        { error: "Access denied", code: "ACCESS_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = RunActionBodySchema.parse(body);

    switch (validated.action) {
      case "pause":
        await hermes.pauseRun(runId);
        break;
      case "resume":
        await hermes.resumeRun(runId);
        break;
      case "cancel":
        await hermes.cancelRun(runId);
        break;
    }

    logger.info("[api] Hermes run control executed", {
      runId,
      action: validated.action,
      userId: String(user._id),
    });

    return Response.json({ success: true });
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

    logger.error("[api] Failed to control run", {
      runId,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to control run",
        code: "RUN_CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
