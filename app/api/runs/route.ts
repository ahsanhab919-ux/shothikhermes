import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";

export interface CreateRunRequest {
  entryPoint: "chat" | "slides" | "sheets" | "writing" | "research";
  intent?: string;
  artifactType?: "conversation" | "slides" | "sheet" | "document" | "research_report";
  contextRef?: {
    conversationId?: string;
    projectId?: string;
    workspaceId?: string;
  };
}

export interface HermesRun {
  id: string;
  workspaceId: string;
  entryPoint: string;
  artifactType?: string;
  status: "created" | "planning" | "running" | "completed" | "failed" | "stopped";
  intent?: string;
  userId: string;
  createdAt: string;
  metadata: Record<string, any>;
}

// Temporary in-memory storage until PostgreSQL migration
const runs = new Map<string, HermesRun>();

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateWorkspaceId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getChatAuthenticatedUser();
    if (!user?._id) {
      return new Response(JSON.stringify({
        error: "Authentication required",
        code: "INSFORGE_SESSION_REQUIRED",
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json() as CreateRunRequest;
    const { entryPoint, intent, artifactType, contextRef } = body;

    if (!entryPoint) {
      return new Response(JSON.stringify({ error: "Entry point is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const runId = generateRunId();
    const workspaceId = contextRef?.workspaceId ?? generateWorkspaceId();

    const run: HermesRun = {
      id: runId,
      workspaceId,
      entryPoint,
      artifactType,
      status: "created",
      intent,
      userId: String(user._id),
      createdAt: new Date().toISOString(),
      metadata: {
        contextRef,
        userAgent: request.headers.get("user-agent"),
      },
    };

    runs.set(runId, run);

    console.log(`[hermes] Created run ${runId} for user ${user._id} (${entryPoint})`);

    return new Response(JSON.stringify({
      success: true,
      run: {
        id: run.id,
        workspaceId: run.workspaceId,
        status: run.status,
        entryPoint: run.entryPoint,
        artifactType: run.artifactType,
        createdAt: run.createdAt,
      },
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[hermes] Run creation failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getChatAuthenticatedUser();
    if (!user?._id) {
      return new Response(JSON.stringify({
        error: "Authentication required",
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const runId = url.searchParams.get("runId");

    if (runId) {
      // Get specific run
      const run = runs.get(runId);
      if (!run || run.userId !== String(user._id)) {
        return new Response(JSON.stringify({ error: "Run not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ run }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // List user's runs
      const userRuns = Array.from(runs.values())
        .filter(run => run.userId === String(user._id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);

      return new Response(JSON.stringify({ runs: userRuns }), {
        headers: { "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Export runs for internal use by other routes
export { runs };