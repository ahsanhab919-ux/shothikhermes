import { NextRequest, NextResponse } from "next/server";
import { parsePdfDocument } from "@/lib/document-parsing";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
    }

    const name = file.name.toLowerCase();

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      const text = await file.text();
      const trimmed = text.slice(0, 8000);
      return NextResponse.json({
        parser: "plain-text",
        text: trimmed,
        preview: trimmed.slice(0, 200),
        title: file.name,
        pages: 1,
        imageBased: false,
      });
    }

    if (!name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF, TXT, and Markdown files are supported." }, { status: 400 });
    }

    const result = await parsePdfDocument(file);

    return NextResponse.json(result);
  } catch (err) {
    console.error("extract-pdf-v2 error:", err);

    const message =
      err instanceof Error ? err.message : "Failed to process the file. Please try a different format.";

    const status = message.includes("temporarily unavailable") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

