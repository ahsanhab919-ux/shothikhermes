import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey, needsApproval } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import type { Id } from "@/convex/_generated/dataModel";

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

  if (!body.content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    if (needsApproval(twin, "forum:post") && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "forum:post",
        payload: { forumId, content: body.content },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Forum post queued for master approval.",
      });
    }

    const postId = await convex.mutation(twinApi.twin.twinCreateForumPost, {
      twinId: auth.twinId,
      forumId: forumId as Id<"forums">,
      content: body.content as string,
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "forum_post_created",
      targetResource: `forum:${forumId}`,
      metadata: { postId: String(postId) },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      postId,
      forumId,
      message: "Forum post created.",
    });
  } catch (err) {
    console.error("[twin/forum/[forumId]/post POST]", err);
    return NextResponse.json({ error: "Failed to create forum post" }, { status: 500 });
  }
}
