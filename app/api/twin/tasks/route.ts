import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";
import { getStyleProfile } from "@/lib/twin/get-style-profile";
import { resolveWritingMd, generateWithVoiceGate } from "@/lib/twin/writing-voice";

export async function GET(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "read", "TwinTask");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);
    const tasks = await convex.query(twinApi.twin.getTasksByUser, { userId: auth.userId });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[twin/tasks GET]", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "create", "TwinTask");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.title) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }

  const validTypes = ["research", "writing", "analysis", "summary"];
  if (!validTypes.includes(body.taskType as string)) {
    return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin profile not found" }, { status: 404 });
    }

    const DAILY_TASK_LIMITS: Record<string, number> = {
      free: 5,
      student: 15,
      researcher: 50,
      pro: 200,
    };

    const userTier = (profile as Record<string, unknown>).subscriptionTier as string ?? "free";
    const dailyLimit = DAILY_TASK_LIMITS[userTier] ?? DAILY_TASK_LIMITS.free;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allTasks = await convex.query(twinApi.twin.getTasksByUser, { userId: auth.userId });
    const todayTasks = (allTasks as Array<{ createdAt: number }>).filter(
      (t) => t.createdAt >= todayStart.getTime()
    );

    if (todayTasks.length >= dailyLimit) {
      return NextResponse.json({
        error: "Daily task limit reached (" + dailyLimit + " tasks/day for " + userTier + " tier). Upgrade your plan for higher limits.",
        errorCode: "DAILY_LIMIT_REACHED"
      }, { status: 429 });
    }

    const taskId = await convex.mutation(twinApi.twin.createTask, {
      twinId: profile._id,
      userId: auth.userId,
      title: body.title as string,
      description: body.description as string | undefined,
      taskType: body.taskType as "research" | "writing" | "analysis" | "summary",
    });

    await logRouteActivity(auth, {
      action: "task_created",
      targetResource: `task:${taskId}`,
      metadata: { title: body.title as string, taskType: body.taskType as string },
    });

    const approvalRequired = (profile.approvalRequiredActions ?? []).includes(
      `task:${body.taskType as string}`
    );

    if (approvalRequired) {
      await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: profile._id,
        masterId: auth.userId,
        action: `task:${body.taskType as string}`,
        payload: {
          taskId: taskId as string,
          title: body.title as string,
          description: body.description,
          taskType: body.taskType as string,
        },
      });

      return NextResponse.json({
        taskId,
        status: "pending_approval",
        message: "Task requires approval before execution.",
      }, { status: 201 });
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
          title: body.title as string,
          description: body.description as string | undefined,
          taskType: body.taskType as "research" | "writing" | "analysis" | "summary",
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

      return NextResponse.json({
        taskId,
        status: "completed",
        result,
        voiceDriftFindings: gateResult.finalFindings,
        voiceGatePassed: gateResult.voiceGatePassed,
        repairAttempts: gateResult.repairAttempts,
        bestEffort: gateResult.bestEffort,
      }, { status: 201 });
    } catch (execErr) {
      console.error("[twin/tasks POST] execution failed:", execErr);
      await convex.mutation(twinApi.twin.updateTaskStatus, {
        taskId,
        status: "failed",
        result: execErr instanceof Error ? execErr.message : "Task execution failed",
      });

      return NextResponse.json({
        taskId,
        status: "failed",
        error: "Task execution failed",
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[twin/tasks POST]", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
