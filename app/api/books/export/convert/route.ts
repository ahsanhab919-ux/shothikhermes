import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { isAgentKey, hashAgentKey } from "@/lib/agent-auth";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const CALIBRE_URL = process.env.CALIBRE_SERVICE_URL || "http://localhost:3003";

const SUPPORTED_FORMATS = ["docx", "mobi", "azw3", "kepub", "pdf", "epub"] as const;
type ExportFormat = (typeof SUPPORTED_FORMATS)[number];

const MIME_TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mobi: "application/x-mobipocket-ebook",
  azw3: "application/x-mobi8-ebook",
  kepub: "application/epub+zip",
  pdf: "application/pdf",
  epub: "application/epub+zip",
};

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

  let body: { bookId?: string; format?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookId, format } = body;
  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }
  if (!format || !SUPPORTED_FORMATS.includes(format as ExportFormat)) {
    return NextResponse.json(
      { error: `format must be one of: ${SUPPORTED_FORMATS.join(", ")}` },
      { status: 400 }
    );
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

    if (format === "epub") {
      const filename = `${(book.title as string || "manuscript").replace(/[^a-z0-9]/gi, "_")}.epub`;
      return new NextResponse(manuscriptBuffer, {
        status: 200,
        headers: {
          "Content-Type": MIME_TYPES.epub,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(manuscriptBuffer.length),
        },
      });
    }

    const calibreRes = await fetch(`${CALIBRE_URL}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, epub_base64: epubBase64 }),
      signal: AbortSignal.timeout(130000),
    });

    if (!calibreRes.ok) {
      const err = await calibreRes.json().catch(() => ({}));
      logger.error(`Calibre convert failed (${format}):`, err);
      return NextResponse.json(
        { error: (err as any).detail || `Conversion to ${format} failed` },
        { status: calibreRes.status === 503 ? 503 : 500 }
      );
    }

    const result = await calibreRes.json();
    const outputBuffer = Buffer.from(result.file_base64, "base64");
    const safeTitle = (book.title as string || "manuscript").replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeTitle}.${format}`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": MIME_TYPES[format] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(outputBuffer.length),
      },
    });
  } catch (error) {
    logger.error("Export convert error:", error);
    return NextResponse.json({ error: "Internal server error during conversion" }, { status: 500 });
  }
}
