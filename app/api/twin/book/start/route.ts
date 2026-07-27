import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";

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

  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();

    const needsApproval = (twin.approvalRequiredActions ?? []).includes("book:write");
    if (needsApproval && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "book:write",
        payload: { title: body.title, genre: body.genre },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Book creation queued for master approval.",
      });
    }

    const bookId = await convex.mutation(twinApi.twin.twinStartBook, {
      twinId: auth.twinId,
      title: body.title as string,
      description: body.description as string | undefined,
      category: body.category as string | undefined,
      language: body.language as string | undefined,
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "book_started",
      targetResource: `book:${bookId}`,
      metadata: { title: body.title as string },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      bookId,
      message: "Book draft created. Proceed with content upload.",
      nextStep: "POST /api/twin/book/upload with your content",
    });
  } catch (err) {
    console.error("[twin/book/start POST]", err);
    return NextResponse.json({ error: "Failed to start book" }, { status: 500 });
  }
}
