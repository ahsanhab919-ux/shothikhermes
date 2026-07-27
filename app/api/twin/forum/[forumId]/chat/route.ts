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

  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "message (string) is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    if (needsApproval(twin, "forum:post") && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "forum:post",
        payload: { forumId, content: body.message },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Chat message queued for master approval.",
      });
    }

    const msgId = await convex.mutation(twinApi.twin.twinAddChatMessage, {
      twinId: auth.twinId,
      forumId: forumId as Id<"forums">,
      message: body.message as string,
      replyToId: body.replyToId as Id<"forum_chat"> | undefined,
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "forum_chat_message",
      targetResource: `forum:${forumId}`,
      metadata: { messageId: String(msgId) },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      messageId: msgId,
      forumId,
    });
  } catch (err) {
    console.error("[twin/forum/[forumId]/chat POST]", err);
    return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 });
  }
}
