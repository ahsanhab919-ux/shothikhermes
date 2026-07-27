import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "unlink", "Twin");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);

    const twin = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId! });
    if (!twin) {
      return NextResponse.json({ error: "No twin found for authenticated user" }, { status: 404 });
    }
    const twinId = String(twin._id);

    await logRouteActivity(auth, {
      action: "twin_unlinked",
      targetResource: `twin:${twinId}`,
    });

    await convex.mutation(twinApi.twin.unlinkTwin, { twinId });
    return NextResponse.json({ success: true, twinId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unlink twin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
