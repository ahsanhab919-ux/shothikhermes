/**
 * Hermes Books Control API
 * 
 * Provides run lifecycle control for book generation:
 * - Pause/resume authoring
 * - Update chapter content
 * - Export book manuscript
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

const UpdateBookRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  chapterIndex: z.number().int().min(0),
  chapterTitle: z.string().optional(),
  content: z.string().optional(),
});

const ExportBookRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  format: z.enum(["epub", "pdf", "docx", "markdown"]).default("epub"),
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
 * POST /api/hermes/books/control/[action] - Control book generation
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
        logger.info("[hermes-books] Book generation paused", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "resume": {
        const validated = PauseResumeRequestSchema.parse(body);
        await hermes.resumeRun(validated.runId);
        logger.info("[hermes-books] Book generation resumed", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "update": {
        const validated = UpdateBookRequestSchema.parse(body);
        await hermes.reportProgress(validated.runId, "Updated chapter content", {
          chapterIndex: validated.chapterIndex,
          chapterTitle: validated.chapterTitle,
        });
        logger.info("[hermes-books] Book chapter updated", { runId: validated.runId, chapterIndex: validated.chapterIndex });
        return Response.json({ success: true });
      }

      case "export": {
        const validated = ExportBookRequestSchema.parse(body);
        const exportUrl = `/api/hermes/runs/${validated.runId}/export?format=${validated.format}`;
        await hermes.reportProgress(validated.runId, "Exported book manuscript", {
          format: validated.format,
          url: exportUrl,
        });
        logger.info("[hermes-books] Book exported", {
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

    logger.error("[hermes-books] Control action failed", {
      action,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: `Failed to ${action} book generation`,
        code: "CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
