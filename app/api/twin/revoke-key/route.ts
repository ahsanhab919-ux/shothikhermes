import { NextRequest, NextResponse } from "next/server";
import { generateAgentApiKey } from "@/lib/agent-auth";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "revokeKey", "Twin");
  if (abilityErr) return abilityErr;

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin not found" }, { status: 404 });
    }

    const { key, prefix, hash } = generateAgentApiKey();

    await convex.mutation(twinApi.twin.rotateApiKey, {
      twinId: profile._id,
      newKeyHash: hash,
      newKeyPrefix: prefix,
    });

    await logRouteActivity(auth, {
      action: "api_key_revoked_and_rotated",
      targetResource: `twin:${profile._id}`,
    });

    return NextResponse.json({
      success: true,
      newKey: key,
      newKeyPrefix: prefix,
      warning: "Store this API key securely. It will not be shown again.",
    });
  } catch (err) {
    console.error("[twin/revoke-key POST]", err);
    return NextResponse.json({ error: "Failed to generate new key" }, { status: 500 });
  }
}
