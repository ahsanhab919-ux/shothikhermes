import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function GET(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "read", "Twin");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[twin/profile GET]", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "update", "Twin");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  try {
    const convex = createTwinClient(auth.token);
    const profileId = await convex.mutation(twinApi.twin.createOrUpdate, {
      masterId: auth.userId,
      ...(body.name && { name: body.name }),
      ...(body.persona !== undefined && { persona: body.persona }),
      ...(body.expertiseAreas && { expertiseAreas: body.expertiseAreas }),
      ...(body.communicationStyle && { communicationStyle: body.communicationStyle }),
      ...(body.goals && { goals: body.goals }),
      ...(body.languages && { languages: body.languages }),
    });

    await logRouteActivity(auth, {
      action: "profile_updated",
      targetResource: `twin:${profileId}`,
    });

    return NextResponse.json({ profileId });
  } catch (err) {
    console.error("[twin/profile POST]", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
