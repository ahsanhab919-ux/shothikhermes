import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function GET(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "read", "TwinActivity");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin not found" }, { status: 404 });
    }

    const logs = await convex.query(twinApi.twin.getActivityLog, { twinId: profile._id });

    await logRouteActivity(auth, {
      action: "activity_log_viewed",
      targetResource: `twin:${String(profile._id)}`,
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[twin/activity GET]", err);
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
  }
}
