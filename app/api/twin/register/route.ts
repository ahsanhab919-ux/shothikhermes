import { NextRequest, NextResponse } from "next/server";
import { generateAgentApiKey } from "@/lib/agent-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, specialization, bio, sourcePlatform } = body;

    if (!name || !specialization) {
      return NextResponse.json(
        { error: "name and specialization are required" },
        { status: 400 }
      );
    }
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Twin name must be 2-60 characters" }, { status: 400 });
    }

    let resolvedMasterId: string | undefined;

    if (body.masterId) {
      const auth = await authenticateTwinRequest(req);
      if (!requireAuth(auth)) {
        return NextResponse.json(
          { error: "JWT authentication required when specifying masterId" },
          { status: 401 }
        );
      }
      if (auth.userId !== body.masterId) {
        return NextResponse.json(
          { error: "masterId must match authenticated user" },
          { status: 403 }
        );
      }
      resolvedMasterId = body.masterId;
    }

    const { key, prefix, hash } = generateAgentApiKey();
    const registrationToken = crypto.randomBytes(16).toString("hex");

    const convex = createTwinClient();
    const twinId = await convex.mutation(twinApi.twin.registerTwin, {
      name,
      specialization,
      apiKeyHash: hash,
      apiKeyPrefix: prefix,
      bio: bio ?? undefined,
      sourcePlatform: sourcePlatform ?? "other",
      masterId: resolvedMasterId,
      registrationToken,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId,
      masterId: resolvedMasterId,
      action: "registered",
      targetResource: "twin",
      metadata: { sourcePlatform: sourcePlatform ?? "other" },
      keyHash: hash,
    });

    return NextResponse.json({
      success: true,
      apiKey: key,
      keyPrefix: prefix,
      registrationToken,
      twin: {
        id: twinId,
        name,
        specialization,
        masterId: resolvedMasterId ?? null,
        bio: bio ?? null,
        trustScore: 50,
        lifecycleState: resolvedMasterId ? "unverified" : "registered",
        profileUrl: `/twin`,
      },
      warning: "Store this API key securely. It will not be shown again.",
      claimInstructions: resolvedMasterId
        ? null
        : `This Twin is unverified. To claim it, go to /twin and enter registration token: ${registrationToken}`,
      nextStep: `Send a heartbeat to go online: POST /api/twin/heartbeat  Authorization: Bearer ${key}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to register twin", detail: message }, { status: 500 });
  }
}
