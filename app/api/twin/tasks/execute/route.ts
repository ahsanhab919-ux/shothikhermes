import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";
import { getStyleProfile } from "@/lib/twin/get-style-profile";
import { resolveWritingMd, generateWithVoiceGate } from "@/lib/twin/writing-voice";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "create", "TwinTask");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const taskId = body.taskId as string | undefined;
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const task = await convex.query(twinApi.twin.getTaskById, { taskId });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskRecord = task as Record<string, unknown>;
    if (taskRecord.userId !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized: you do not own this task" }, { status: 403 });
    }

    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin profile not found" }, { status: 404 });
    }

    if (taskRecord.twinId !== (profile as Record<string, unknown>)._id) {
      return NextResponse.json({ error: "Unauthorized: task does not belong to your twin" }, { status: 403 });
    }

    const taskStatus = taskRecord.status as string;
    if (taskStatus === "completed" || taskStatus === "running") {
      return NextResponse.json(
        { error: `Task is already ${taskStatus} and cannot be re-executed` },
        { status: 409 }
      );
    }

    await convex.mutation(twinApi.twin.updateTaskStatus, {
      taskId,
      status: "running",
    });

    try {
      const styleProfile = await getStyleProfile(convex, auth.userId);
      const writingMd = await resolveWritingMd(auth.userId);

      const gateResult = await generateWithVoiceGate({
        task: {
          title: taskRecord.title as string,
          description: taskRecord.description as string | undefined,
          taskType: taskRecord.taskType as "research" | "writing" | "analysis" | "summary",
        },
        profile: {
          name: profile.name,
          persona: profile.persona,
          expertiseAreas: profile.expertiseAreas,
          communicationStyle: profile.communicationStyle as "formal" | "casual" | "academic" | "creative" | undefined,
          goals: profile.goals,
          languages: profile.languages,
        },
        styleProfile,
        writingMd,
      });

      const result = gateResult.text;

      await convex.mutation(twinApi.twin.updateTaskStatus, {
        taskId,
        status: "completed",
        result,
      });

      await logRouteActivity(auth, {
        action: "task_executed",
        targetResource: `task:${taskId}`,
        metadata: { taskType: taskRecord.taskType as string },
      });

      return NextResponse.json({
        taskId,
        status: "completed",
        result,
        voiceDriftFindings: gateResult.finalFindings,
        voiceGatePassed: gateResult.voiceGatePassed,
        repairAttempts: gateResult.repairAttempts,
        bestEffort: gateResult.bestEffort,
      });
    } catch (execErr) {
      console.error("[twin/tasks/execute POST] execution failed:", execErr);
      await convex.mutation(twinApi.twin.updateTaskStatus, {
        taskId,
        status: "failed",
        result: execErr instanceof Error ? execErr.message : "Task execution failed",
      });
      return NextResponse.json({ taskId, status: "failed", error: "Task execution failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("[twin/tasks/execute POST]", err);
    return NextResponse.json({ error: "Failed to execute task" }, { status: 500 });
  }
}
