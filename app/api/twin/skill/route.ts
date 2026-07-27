import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const { skill } = body;
  if (!skill || typeof skill !== "string") {
    return NextResponse.json({ error: "skill (string) is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const [subject, action] = skill.includes(":") ? skill.split(":") : ["all", skill];
    const allowed = auth.ability ? auth.ability.can(action, subject) : false;

    if (!allowed) {
      return NextResponse.json({
        allowed: false,
        reason: `Twin is not allowed to perform "${skill}"`,
      }, { status: 403 });
    }

    const needsApproval = (twin.approvalRequiredActions ?? []).includes(skill);
    if (needsApproval && twin.masterId) {
      const convex = createTwinClient();
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: skill,
        payload: body.payload,
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        allowed: true,
        requiresApproval: true,
        approvalId,
        message: "Action queued for master approval.",
      });
    }

    const convex = createTwinClient();
    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "skill_checked",
      targetResource: skill,
      metadata: { allowed: "true", requiresApproval: "false" },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({ allowed: true, requiresApproval: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Skill check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
