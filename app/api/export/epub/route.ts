import { NextRequest, NextResponse } from "next/server";

const CALIBRE_URL = process.env.CALIBRE_SERVICE_URL || "http://localhost:3003";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, title = "manuscript", author = "", fontFamily = "Georgia" } = body;

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    body { font-family: ${fontFamily}, serif; font-size: 11pt; line-height: 1.5; margin: 2em; }
    h1, h2, h3 { page-break-after: avoid; }
    p { margin: 0 0 0.8em; text-indent: 1.5em; }
    p:first-of-type { text-indent: 0; }
  </style>
</head>
<body>${content}</body>
</html>`;

    const calibreRes = await fetch(`${CALIBRE_URL}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "epub", html_content: styledHtml, title, author }),
      signal: AbortSignal.timeout(60000),
    });

    if (!calibreRes.ok) {
      const err = await calibreRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as any).detail || "EPUB conversion failed" },
        { status: calibreRes.status }
      );
    }

    const data = await calibreRes.json() as { file_base64: string };
    const epubBytes = Buffer.from(data.file_base64, "base64");
    const safeName = title.replace(/[^a-z0-9]/gi, "_");

    return new NextResponse(epubBytes, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${safeName}.epub"`,
        "Content-Length": String(epubBytes.length),
      },
    });
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return NextResponse.json({ error: "EPUB generation timed out" }, { status: 504 });
    }
    console.error("[export/epub]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
