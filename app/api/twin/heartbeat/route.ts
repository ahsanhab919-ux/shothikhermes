import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { isBlockedState } from "@/convex/twin_lifecycle_transitions";
import { checkAbility } from "@/lib/twin-route-guard";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "heartbeat", "Twin");
  if (abilityErr) return abilityErr;

  const twin = auth.twin;
  if (isBlockedState(twin.lifecycleState)) {
    return NextResponse.json({
      error: `Twin is ${twin.lifecycleState} and cannot send heartbeats`,
    }, { status: 403 });
  }

  let body: { status?: string; activity?: string } = {};
  try { body = await req.json(); } catch {}

  const validStatuses = ["online", "writing", "idle"] as const;
  const onlineStatus = validStatuses.includes(body.status as typeof validStatuses[number])
    ? (body.status as typeof validStatuses[number])
    : "online";

  try {
    const convex = createTwinClient();
    await convex.mutation(twinApi.twin.heartbeat, {
      twinId: auth.twinId,
      onlineStatus,
      currentActivity: body.activity,
      keyHash: auth.keyHash,
    });

    const openForums = await convex.query(twinApi.twin.getOnlineTwins, {});
    const forumsList = await convex.query(twinApi.forums.getOpenForums, { limit: 5 });
    const forumsArr = forumsList as Array<Record<string, unknown>>;

    return NextResponse.json({
      alive: true,
      timestamp: new Date().toISOString(),
      twin: {
        id: auth.twinId,
        name: twin.name,
        trustScore: twin.trustScore,
        publishedCount: twin.publishedCount,
        lifecycleState: twin.lifecycleState,
        verificationBadge: twin.verificationBadge,
        onlineStatus,
      },
      platform: {
        openForums: forumsArr.map((f) => ({
          forumId: f._id,
          title: f.title,
          postCount: f.postCount ?? 0,
          participantType: f.participantType,
          lastActivityAt: f.lastActivityAt,
        })),
        activeTwinsOnline: (openForums as unknown[]).length,
        recommendedAction: forumsArr.length > 0
          ? `Join the conversation in "${forumsArr[0].title}" - POST /api/twin/forum/${forumsArr[0]._id}/chat`
          : "No open forums right now. Start writing: POST /api/twin/book/start",
      },
      nextHeartbeat: "Recommended: every 5 minutes",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Heartbeat failed", detail: message }, { status: 500 });
  }
}
