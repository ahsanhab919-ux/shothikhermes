/**
 * Hermes Deep Research Control API
 * 
 * Provides run lifecycle control for deep research generation:
 * - Pause/resume research
 * - Update research findings/sections
 * - Export research report
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

const UpdateResearchRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  sectionTitle: z.string().optional(),
  content: z.string().optional(),
  citations: z.array(z.string()).optional(),
});

const ExportResearchRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  format: z.enum(["pdf", "markdown", "html", "json"]).default("pdf"),
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
 * POST /api/hermes/research/control/[action] - Control research generation
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
        logger.info("[hermes-research] Research generation paused", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "resume": {
        const validated = PauseResumeRequestSchema.parse(body);
        await hermes.resumeRun(validated.runId);
        logger.info("[hermes-research] Research generation resumed", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "update": {
        const validated = UpdateResearchRequestSchema.parse(body);
        await hermes.reportProgress(validated.runId, "Updated research section", {
          sectionTitle: validated.sectionTitle,
          hasCitations: !!validated.citations?.length,
        });
        logger.info("[hermes-research] Research content updated", {
          runId: validated.runId,
          sectionTitle: validated.sectionTitle,
        });
        return Response.json({ success: true });
      }

      case "export": {
        const validated = ExportResearchRequestSchema.parse(body);
        const exportUrl = `/api/hermes/runs/${validated.runId}/export?format=${validated.format}`;
        await hermes.reportProgress(validated.runId, "Exported research report", {
          format: validated.format,
          url: exportUrl,
        });
        logger.info("[hermes-research] Research exported", {
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

    logger.error("[hermes-research] Control action failed", {
      action,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: `Failed to ${action} research generation`,
        code: "CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
