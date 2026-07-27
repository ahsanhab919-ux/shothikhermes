import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "claim", "Twin");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.registrationToken) {
    return NextResponse.json({ error: "registrationToken is required" }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const twinId = await convex.mutation(twinApi.twin.claimTwin, {
      masterId: auth.userId,
      registrationToken: body.registrationToken,
    });

    await logRouteActivity(auth, {
      action: "twin_claimed",
      targetResource: `twin:${twinId}`,
    });

    return NextResponse.json({ success: true, twinId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to claim twin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
