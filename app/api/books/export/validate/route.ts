import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { isAgentKey, hashAgentKey } from "@/lib/agent-auth";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const CALIBRE_URL = process.env.CALIBRE_SERVICE_URL || "http://localhost:3003";

export async function POST(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (isAgentKey(token)) {
    const keyHash = hashAgentKey(token);
    const agent = await convex.query(api.twin.getByKeyHash, { keyHash });
    if (!agent || agent.lifecycleState === "suspended") {
      return NextResponse.json({ error: "Agent not found or suspended" }, { status: 403 });
    }
  }

  let body: { bookId?: string; fix?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookId, fix = false } = body;
  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  try {
    const book = await convex.query(api.books.get, { id: bookId as any });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const manuscriptUrl = (book as any).manuscriptUrl as string | null;
    if (!manuscriptUrl) {
      return NextResponse.json({ error: "No manuscript file available for this book" }, { status: 422 });
    }

    const manuscriptRes = await fetch(manuscriptUrl);
    if (!manuscriptRes.ok) {
      return NextResponse.json({ error: "Failed to retrieve manuscript file" }, { status: 500 });
    }
    const manuscriptBuffer = Buffer.from(await manuscriptRes.arrayBuffer());
    const epubBase64 = manuscriptBuffer.toString("base64");

    if (fix) {
      const fixRes = await fetch(`${CALIBRE_URL}/fix-epub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epub_base64: epubBase64 }),
        signal: AbortSignal.timeout(60000),
      });

      if (!fixRes.ok) {
        const err = await fixRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: (err as any).detail || "EPUB fix failed" },
          { status: 500 }
        );
      }

      const fixResult = await fixRes.json();
      const fixedBuffer = Buffer.from(fixResult.epub_base64, "base64");

      const validateRes = await fetch(`${CALIBRE_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epub_base64: fixResult.epub_base64 }),
        signal: AbortSignal.timeout(30000),
      });

      const validation = validateRes.ok ? await validateRes.json() : { score: 0, issues: [], ready_for: [] };

      return NextResponse.json({
        ...validation,
        fixed: true,
        problems_fixed: fixResult.problems_fixed,
        fixed_epub_base64: fixResult.epub_base64,
      });
    }

    const validateRes = await fetch(`${CALIBRE_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epub_base64: epubBase64 }),
      signal: AbortSignal.timeout(30000),
    });

    if (!validateRes.ok) {
      const err = await validateRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as any).detail || "Validation service unavailable" },
        { status: validateRes.status === 503 ? 503 : 500 }
      );
    }

    const result = await validateRes.json();
    return NextResponse.json({ ...result, fixed: false });
  } catch (error) {
    logger.error("Export validate error:", error);
    return NextResponse.json({ error: "Internal server error during validation" }, { status: 500 });
  }
}
