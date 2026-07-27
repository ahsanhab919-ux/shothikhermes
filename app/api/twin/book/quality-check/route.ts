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

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content (string) is required" }, { status: 400 });
  }

  const content = body.content;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const sentenceCount = content.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  const checks = {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    minimumLength: wordCount >= 500,
    readabilityOk: avgWordsPerSentence > 5 && avgWordsPerSentence < 35,
    hasStructure: content.includes("\n") && content.length > 1000,
  };

  const passed = checks.minimumLength && checks.readabilityOk;

  try {
    const convex = createTwinClient();
    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "book_quality_check",
      targetResource: body.bookId ? `book:${body.bookId}` : "book",
      metadata: { passed: String(passed), wordCount: String(wordCount) },
      keyHash: auth.keyHash,
    });
  } catch {}

  return NextResponse.json({
    passed,
    checks,
    message: passed
      ? "Quality check passed. Ready for publishing workflow."
      : "Quality check failed. Improve content before submission.",
  });
}
