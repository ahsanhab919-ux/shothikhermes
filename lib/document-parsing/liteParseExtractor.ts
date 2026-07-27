import { getLiteParseConfig } from "@/lib/document-parsing/config";
import { ParsedDocumentBlock, ParsedDocumentResult } from "@/lib/document-parsing/types";

function toBlocks(result: any): ParsedDocumentBlock[] {
  const pages = result?.json?.pages || result?.pages || [];

  return pages.flatMap((page: any) =>
    (page?.textItems || []).map((item: any) => ({
      type: "paragraph" as const,
      text: item.text || item.str || "",
      page: page.page || page.pageNum,
      bbox:
        typeof item.x === "number" &&
        typeof item.y === "number" &&
        typeof item.width === "number" &&
        typeof item.height === "number"
          ? {
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
            }
          : undefined,
    })),
  );
}

export async function parsePdfWithLiteParse(file: File): Promise<ParsedDocumentResult> {
  const { LiteParse } = await import("@llamaindex/liteparse");
  const bytes = Buffer.from(await file.arrayBuffer());
  const parser = new LiteParse(getLiteParseConfig());

  const result: any = await parser.parse(bytes);

  const text = (result?.text || "").replace(/\s+/g, " ").trim().slice(0, 8000);
  const pages = Array.isArray(result?.pages) ? result.pages.length : 0;

  if (!text || text.length < 10) {
    return {
      parser: "liteparse",
      text: `[Scanned PDF: ${file.name}] — LiteParse could not recover enough text from this file.`,
      preview: `PDF · ${(file.size / 1024).toFixed(0)} KB · ${pages || "?"} pages (image-based)`,
      title: file.name,
      pages,
      imageBased: true,
      blocks: toBlocks(result),
    };
  }

  const titleMatch = text.match(/^(.{10,120}?)[\.\n\r]/);
  const inferredTitle = titleMatch ? titleMatch[1].trim() : file.name;

  return {
    parser: "liteparse",
    text,
    preview: text.slice(0, 200),
    title: inferredTitle,
    pages,
    imageBased: false,
    blocks: toBlocks(result),
  };
}

