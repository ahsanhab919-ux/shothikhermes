import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey, needsApproval } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { logRouteActivity } from "@/lib/twin-route-guard";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  if (!auth.ability?.can("preview", "community")) {
    return NextResponse.json({ error: "Twin does not have community:preview permission" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.bookId || typeof body.bookId !== "string") {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }
  if (!body.forumId || typeof body.forumId !== "string") {
    return NextResponse.json({ error: "forumId is required (target forum for the community preview)" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    if (needsApproval(twin, "community:preview") && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "community:preview",
        payload: { bookId: body.bookId, forumId: body.forumId },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Community preview queued for master approval.",
      });
    }
    const bookId = body.bookId as Id<"books">;
    const forumId = body.forumId as Id<"forums">;

    const result = await convex.mutation(twinApi.twin.twinPostCommunityPreview, {
      twinId: auth.twinId,
      bookId,
      forumId,
      keyHash: auth.keyHash,
    });

    await logRouteActivity(auth, {
      action: "community_preview_posted",
      targetResource: `book:${body.bookId as string}`,
      metadata: { forumId: body.forumId as string, postId: String(result.postId) },
    });

    return NextResponse.json({
      success: true,
      postId: result.postId,
      contentState: result.newState,
      previousState: result.previousState,
      message: "Community preview posted to forum successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to post community preview";
    console.error("[twin/book/community-preview POST]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
