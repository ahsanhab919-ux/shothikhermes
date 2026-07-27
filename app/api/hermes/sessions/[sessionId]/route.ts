import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "HERMES_AUTH_REQUIRED",
      message: "Please sign in to access Hermes sessions.",
    },
    { status: 401 },
  );
}

const SessionActionBodySchema = z.object({
  action: z.enum(["resume", "pause", "archive"]),
});

/**
 * GET /api/hermes/sessions/[sessionId] - Get session context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { sessionId } = await params;

  try {
    const context = await getHermesOrchestrator().getSessionContext(sessionId);

    if (!context) {
      return Response.json(
        { error: "Session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (context.session.userId !== String(user._id)) {
      return Response.json(
        { error: "Access denied", code: "ACCESS_DENIED" },
        { status: 403 },
      );
    }

    return Response.json({
      data: {
        session: context.session,
        workspace: context.workspace,
        runs: context.runs,
        canResume: context.canResume,
      },
    });
  } catch (error) {
    logger.error("[api] Failed to get session context", {
      sessionId,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to get session context",
        code: "GET_SESSION_CONTEXT_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/hermes/sessions/[sessionId] - Control a session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { sessionId } = await params;

  try {
    const context = await getHermesOrchestrator().getSessionContext(sessionId);

    if (!context) {
      return Response.json(
        { error: "Session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (context.session.userId !== String(user._id)) {
      return Response.json(
        { error: "Access denied", code: "ACCESS_DENIED" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = SessionActionBodySchema.parse(body);
    const hermes = getHermesOrchestrator();

    switch (validated.action) {
      case "resume":
        await hermes.resumeSession(sessionId);
        break;
      case "pause":
        await hermes.pauseSession(sessionId);
        break;
      case "archive":
        await hermes.archiveSession(sessionId);
        break;
    }

    return Response.json({ success: true });
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

    logger.error("[api] Failed to control session", {
      sessionId,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to control session",
        code: "SESSION_CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
