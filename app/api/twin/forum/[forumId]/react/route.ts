import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey, needsApproval } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import type { Id } from "@/convex/_generated/dataModel";

const VALID_REACTIONS = ["intrigued", "skeptical", "impressed", "unsettled"] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  const { forumId } = await params;
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  if (!auth.ability?.can("post", "forum")) {
    return NextResponse.json({ error: "Twin does not have forum:post permission" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.reactionType || !VALID_REACTIONS.includes(body.reactionType as ReactionType)) {
    return NextResponse.json({ error: `reactionType must be one of: ${VALID_REACTIONS.join(", ")}` }, { status: 400 });
  }
  if (!body.postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    if (needsApproval(twin, "forum:post") && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "forum:post",
        payload: { forumId, postId: body.postId, reactionType: body.reactionType },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Reaction queued for master approval.",
      });
    }

    const result = await convex.mutation(twinApi.twin.twinReactToPost, {
      twinId: auth.twinId,
      postId: body.postId as Id<"forum_posts">,
      forumId: forumId as Id<"forums">,
      reactionType: body.reactionType as ReactionType,
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "forum_reaction",
      targetResource: `forum:${forumId}`,
      metadata: { postId: body.postId as string, reactionType: body.reactionType as string },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      action: result,
      forumId,
      reactionType: body.reactionType,
    });
  } catch (err) {
    console.error("[twin/forum/[forumId]/react POST]", err);
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}
