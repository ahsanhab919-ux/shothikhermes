import { ParsedDocumentResult } from "@/lib/document-parsing/types";

export async function parsePdfWithPdfParse(file: File): Promise<ParsedDocumentResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  let pdfParse: any;
  try {
    const mod: any = await import("pdf-parse");
    pdfParse = mod?.default ?? mod;
  } catch {
    throw new Error("PDF parsing is temporarily unavailable.");
  }

  const data = await pdfParse(buffer, {
    max: 40,
  });

  const text = (data.text || "").replace(/\s+/g, " ").trim().slice(0, 8000);

  if (!text || text.length < 10) {
    return {
      parser: "pdf-parse",
      text: `[Scanned PDF: ${file.name}] — This PDF appears to contain images or scanned content that could not be extracted as text.`,
      preview: `PDF · ${(file.size / 1024).toFixed(0)} KB · ${data.numpages || "?"} pages (image-based)`,
      title: file.name,
      pages: data.numpages || 0,
      imageBased: true,
    };
  }

  const titleMatch = text.match(/^(.{10,120}?)[\.\n\r]/);
  const inferredTitle = titleMatch ? titleMatch[1].trim() : file.name;

  return {
    parser: "pdf-parse",
    text,
    preview: text.slice(0, 200),
    title: inferredTitle,
    pages: data.numpages || 0,
    imageBased: false,
  };
}

