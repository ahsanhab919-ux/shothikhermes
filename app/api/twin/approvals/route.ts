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

  const abilityErr = checkAbility(auth, "read", "TwinApproval");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);
    const approvals = await convex.query(twinApi.twin.getPendingApprovals, { masterId: auth.userId });
    return NextResponse.json({ approvals });
  } catch (err) {
    console.error("[twin/approvals GET]", err);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "manage", "TwinApproval");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.approvalId || !body.action) {
    return NextResponse.json({ error: "approvalId and action are required" }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);

    const allPending = await convex.query(twinApi.twin.getPendingApprovals, { masterId: auth.userId });
    const targetApproval = (allPending as Array<Record<string, unknown>>).find(
      (a) => a._id === body.approvalId
    );

    if (!targetApproval) {
      return NextResponse.json({ error: "Approval not found or not pending" }, { status: 404 });
    }

    const payload = targetApproval.payload as Record<string, unknown> | undefined;
    let voiceDriftFindings: import("@/lib/re-educator/types").Issue[] = [];
    let voiceGatePassed = true;
    let repairAttempts = 0;
    let bestEffort = false;

    if (body.action === "approve") {
      await convex.mutation(twinApi.twin.approveAction, { approvalId: body.approvalId });

      const taskIdFromPayload = payload?.taskId as string | undefined;

      if (taskIdFromPayload && payload?.taskType && payload?.title) {
        try {
          const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
          if (profile) {
            await convex.mutation(twinApi.twin.updateTaskStatus, {
              taskId: taskIdFromPayload,
              status: "running",
            });

            const styleProfile = await getStyleProfile(convex, auth.userId);
            const writingMd = await resolveWritingMd(auth.userId);

            const gateResult = await generateWithVoiceGate({
              task: {
                title: payload.title as string,
                description: payload.description as string | undefined,
                taskType: payload.taskType as "research" | "writing" | "analysis" | "summary",
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

            const taskResult = gateResult.text;
            voiceDriftFindings = gateResult.finalFindings;
            voiceGatePassed = gateResult.voiceGatePassed;
            repairAttempts = gateResult.repairAttempts;
            bestEffort = gateResult.bestEffort;

            await convex.mutation(twinApi.twin.updateTaskStatus, {
              taskId: taskIdFromPayload,
              status: "completed",
              result: taskResult,
            });
          }
        } catch (execErr) {
          console.error("[twin/approvals POST] task execution after approval failed:", execErr);
          // Execution produced no text, so the gate did not pass for this work.
          voiceGatePassed = false;
          await convex.mutation(twinApi.twin.updateTaskStatus, {
            taskId: taskIdFromPayload,
            status: "failed",
            result: execErr instanceof Error ? execErr.message : "Execution failed after approval",
          });
        }
      }
    } else if (body.action === "reject") {
      await convex.mutation(twinApi.twin.rejectAction, { approvalId: body.approvalId });

      const taskIdFromPayload = payload?.taskId as string | undefined;
      if (taskIdFromPayload) {
        try {
          await convex.mutation(twinApi.twin.updateTaskStatus, {
            taskId: taskIdFromPayload,
            status: "failed",
            result: "Task was rejected by the master.",
          });
        } catch {}
      }
    } else {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    await logRouteActivity(auth, {
      action: `approval_${body.action as string}`,
      targetResource: `approval:${body.approvalId as string}`,
    });

    return NextResponse.json({ success: true, voiceDriftFindings, voiceGatePassed, repairAttempts, bestEffort });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process approval";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
