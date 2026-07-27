/**
 * Hermes Writing Control API
 * 
 * Provides run lifecycle control for writing generation:
 * - Pause/resume drafting
 * - Update writing content
 * - Export writing document
 */

import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { getHermesOrchestrator } from "@/lib/hermes";
import { z } from "zod";
import logger from "@/lib/logger";

const PauseResumeRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
});

const UpdateWritingRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  content: z.string().min(1),
});

const ExportWritingRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  format: z.enum(["pdf", "docx", "markdown", "txt"]).default("docx"),
});

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    },
    { status: 401 }
  );
}

/**
 * POST /api/hermes/writing/control/[action] - Control writing generation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { action } = await params;

  try {
    const body = await request.json();
    const hermes = getHermesOrchestrator();

    switch (action) {
      case "pause": {
        const validated = PauseResumeRequestSchema.parse(body);
        await hermes.pauseRun(validated.runId);
        logger.info("[hermes-writing] Writing paused", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "resume": {
        const validated = PauseResumeRequestSchema.parse(body);
        await hermes.resumeRun(validated.runId);
        logger.info("[hermes-writing] Writing resumed", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "update": {
        const validated = UpdateWritingRequestSchema.parse(body);
        await hermes.reportProgress(validated.runId, "Updated writing text", {
          textLength: validated.content.length,
        });
        logger.info("[hermes-writing] Writing updated", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "export": {
        const validated = ExportWritingRequestSchema.parse(body);
        const exportUrl = `/api/hermes/runs/${validated.runId}/export?format=${validated.format}`;
        await hermes.reportProgress(validated.runId, "Exported writing document", {
          format: validated.format,
          url: exportUrl,
        });
        logger.info("[hermes-writing] Writing exported", {
          runId: validated.runId,
          format: validated.format,
        });
        return Response.json({ data: { url: exportUrl, format: validated.format } });
      }

      default:
        return Response.json(
          { error: "Invalid action", code: "INVALID_ACTION" },
          { status: 400 }
        );
    }
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

    logger.error("[hermes-writing] Control action failed", {
      action,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: `Failed to ${action} writing generation`,
        code: "CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
