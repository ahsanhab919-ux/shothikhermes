import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey, needsApproval } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  if (!auth.ability?.can("write", "book")) {
    return NextResponse.json({ error: "Twin does not have book:write permission" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content (string) is required" }, { status: 400 });
  }
  if (!body.bookId || typeof body.bookId !== "string") {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    if (needsApproval(twin, "book:write") && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "book:write",
        payload: { bookId: body.bookId, contentLength: (body.content as string).length },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Book content upload queued for master approval.",
      });
    }
    const bookId = body.bookId as Id<"books">;

    await convex.mutation(twinApi.twin.twinUpdateBookContent, {
      twinId: auth.twinId,
      bookId,
      content: body.content as string,
      keyHash: auth.keyHash,
    });

    const result = await convex.mutation(twinApi.twin.twinAdvanceBookContentState, {
      twinId: auth.twinId,
      bookId,
      targetState: "agent_generated",
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "book_content_uploaded",
      targetResource: `book:${bookId}`,
      metadata: { contentLength: String((body.content as string).length) },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      contentState: result.newState,
      previousState: result.previousState,
      message: "Content uploaded. Submit metadata for review: POST /api/twin/book/metadata",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload content";
    console.error("[twin/book/upload POST]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
