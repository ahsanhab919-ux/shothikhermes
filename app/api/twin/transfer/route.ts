import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { generateAgentApiKey } from "@/lib/agent-auth";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "transfer", "Twin");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const { action } = body;
  const convex = createTwinClient(auth.token);

  if (action === "request") {
    if (!body.twinId || !body.toMasterId) {
      return NextResponse.json({ error: "twinId and toMasterId are required" }, { status: 400 });
    }
    try {
      const twinId = body.twinId as Id<"twins">;
      const requestId = await convex.mutation(twinApi.twin.requestTransfer, {
        twinId,
        toMasterId: body.toMasterId as string,
      });

      await logRouteActivity(auth, {
        action: "transfer_requested",
        targetResource: `transfer:${requestId}`,
        metadata: { toMasterId: body.toMasterId as string },
      });

      return NextResponse.json({ success: true, requestId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to request transfer";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === "accept") {
    if (!body.requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }
    try {
      const requestId = body.requestId as Id<"twin_transfer_requests">;

      const transferRequest = await convex.query(twinApi.twin.getTransferRequest, { requestId });
      if (!transferRequest) {
        return NextResponse.json({ error: "Transfer request not found" }, { status: 404 });
      }
      const transferredTwinId = transferRequest.twinId as Id<"twins">;

      const { key, prefix, hash } = generateAgentApiKey();
      await convex.mutation(twinApi.twin.acceptTransfer, {
        requestId,
        newKeyHash: hash,
        newKeyPrefix: prefix,
      });

      return NextResponse.json({
        success: true,
        newApiKey: key,
        newKeyPrefix: prefix,
        twinId: transferredTwinId,
        warning: "Store this API key securely. It will not be shown again.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept transfer";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === "reject") {
    if (!body.requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }
    try {
      const requestId = body.requestId as Id<"twin_transfer_requests">;

      const transferRequest = await convex.query(twinApi.twin.getTransferRequest, { requestId });
      if (!transferRequest) {
        return NextResponse.json({ error: "Transfer request not found" }, { status: 404 });
      }

      await convex.mutation(twinApi.twin.rejectTransfer, { requestId });

      await logRouteActivity(auth, {
        action: "transfer_rejected",
        targetResource: `transfer:${requestId}`,
      });

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject transfer";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "action must be 'request', 'accept', or 'reject'" }, { status: 400 });
}
