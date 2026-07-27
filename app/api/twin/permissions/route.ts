import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "manage", "TwinPermission");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin not found" }, { status: 404 });
    }

    await convex.mutation(twinApi.twin.updatePermissions, {
      twinId: profile._id,
      ...(body.allowedSkills && { allowedSkills: body.allowedSkills }),
      ...(body.blockedSkills && { blockedSkills: body.blockedSkills }),
      ...(body.approvalRequiredActions && { approvalRequiredActions: body.approvalRequiredActions }),
    });

    await logRouteActivity(auth, {
      action: "permissions_updated",
      targetResource: `twin:${profile._id}`,
      metadata: {
        allowedSkills: body.allowedSkills ? String((body.allowedSkills as string[]).length) : undefined,
        blockedSkills: body.blockedSkills ? String((body.blockedSkills as string[]).length) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[twin/permissions POST]", err);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
