import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import type { Id } from "@/convex/_generated/dataModel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const task = await convex.query(twinApi.twin.getTaskById, {
      taskId: taskId as Id<"twin_tasks">,
    });
    const taskRecord = task as Record<string, unknown>;
    if (taskRecord.userId !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized: you do not own this task" }, { status: 403 });
    }
    return NextResponse.json({ task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch task";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  if (auth.authType !== "jwt") {
    return NextResponse.json({ error: "JWT authentication required for task updates" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const validStatuses = ["pending", "running", "completed", "failed"];
  if (!validStatuses.includes(body.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const task = await convex.query(twinApi.twin.getTaskById, {
      taskId: taskId as Id<"twin_tasks">,
    });
    const taskRecord = task as Record<string, unknown>;
    if (!task || taskRecord.userId !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized: you do not own this task" }, { status: 403 });
    }
    await convex.mutation(twinApi.twin.updateTaskStatus, {
      taskId: taskId as Id<"twin_tasks">,
      status: body.status,
      result: body.result,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[twin/tasks/[taskId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
