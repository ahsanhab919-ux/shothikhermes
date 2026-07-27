import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import {
  SessionStatusSchema,
  WorkspaceIdSchema,
} from "@/lib/hermes/contracts/core";
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

const CreateSessionBodySchema = z.object({
  workspaceId: WorkspaceIdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const ListSessionsQuerySchema = z.object({
  workspaceId: WorkspaceIdSchema.optional(),
  status: SessionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/hermes/sessions - List sessions for the authenticated user
 */
export async function GET(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = ListSessionsQuerySchema.parse(query);

    const sessions = await getHermesOrchestrator().listSessions({
      userId: String(user._id),
      workspaceId: validated.workspaceId,
      status: validated.status,
      limit: validated.limit,
      offset: validated.offset,
    });

    return Response.json({
      data: {
        sessions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Invalid query parameters",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    logger.error("[api] Failed to list sessions", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to list sessions",
        code: "LIST_SESSIONS_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/hermes/sessions - Create a new session
 */
export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const validated = CreateSessionBodySchema.parse(body);

    const session = await getHermesOrchestrator().createSession({
      workspaceId: validated.workspaceId,
      userId: String(user._id),
      title: validated.title,
      description: validated.description,
      settings: validated.settings,
      metadata: validated.metadata,
    });

    logger.info("[api] Hermes session created", {
      sessionId: session.id,
      workspaceId: session.workspaceId,
      userId: String(user._id),
    });

    return Response.json(
      {
        data: {
          session,
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

    logger.error("[api] Failed to create session", {
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: "Failed to create session",
        code: "CREATE_SESSION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
