/**
 * Hermes Sheets Control API
 * 
 * Provides run lifecycle control for sheet generation:
 * - Pause/resume generation
 * - Update sheet content
 * - Export spreadsheets
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

const UpdateSheetRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  cellUpdates: z.array(
    z.object({
      row: z.number().min(0),
      col: z.number().min(0),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    })
  ),
});

const ExportSheetRequestSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  format: z.enum(["csv", "xlsx", "json"]).default("csv"),
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
 * POST /api/hermes/sheets/control/[action] - Control sheet generation
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
        logger.info("[hermes-sheets] Sheet generation paused", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "resume": {
        const validated = PauseResumeRequestSchema.parse(body);
        await hermes.resumeRun(validated.runId);
        logger.info("[hermes-sheets] Sheet generation resumed", { runId: validated.runId });
        return Response.json({ success: true });
      }

      case "update": {
        const validated = UpdateSheetRequestSchema.parse(body);
        await hermes.reportProgress(validated.runId, "Updated sheet cell values", {
          updatesCount: validated.cellUpdates.length,
        });
        logger.info("[hermes-sheets] Sheet content updated", {
          runId: validated.runId,
          updatesCount: validated.cellUpdates.length,
        });
        return Response.json({ success: true });
      }

      case "export": {
        const validated = ExportSheetRequestSchema.parse(body);
        const exportUrl = `/api/hermes/runs/${validated.runId}/export?format=${validated.format}`;
        await hermes.reportProgress(validated.runId, "Exported spreadsheet", {
          format: validated.format,
          url: exportUrl,
        });
        logger.info("[hermes-sheets] Sheet exported", {
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

    logger.error("[hermes-sheets] Control action failed", {
      action,
      userId: String(user._id),
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: `Failed to ${action} sheet generation`,
        code: "CONTROL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
