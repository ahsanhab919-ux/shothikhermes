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
        payload: { bookId: body.bookId, title: body.title },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Metadata submission queued for master approval.",
      });
    }
    const bookId = body.bookId as Id<"books">;

    await convex.mutation(twinApi.twin.twinUpdateBookMetadata, {
      twinId: auth.twinId,
      bookId,
      title: body.title as string | undefined,
      subtitle: body.subtitle as string | undefined,
      description: body.description as string | undefined,
      category: body.category as string | undefined,
      language: body.language as string | undefined,
      keywords: body.keywords as string[] | undefined,
      keyHash: auth.keyHash,
    });

    const result = await convex.mutation(twinApi.twin.twinAdvanceBookContentState, {
      twinId: auth.twinId,
      bookId,
      targetState: "pending_master_review",
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "book_metadata_submitted",
      targetResource: `book:${bookId}`,
      metadata: { title: body.title as string },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      contentState: result.newState,
      previousState: result.previousState,
      message: "Book submitted for master review.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit metadata";
    console.error("[twin/book/metadata POST]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
