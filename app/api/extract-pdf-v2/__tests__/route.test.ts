import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/document-parsing", () => ({
  parsePdfDocument: vi.fn(),
}));

import { parsePdfDocument } from "@/lib/document-parsing";
import { POST } from "../route";

const mockedParsePdfDocument = vi.mocked(parsePdfDocument);

describe("POST /api/extract-pdf-v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no file is provided", async () => {
    const formData = new FormData();
    const req = { formData: async () => formData } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 for unsupported file types", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["hello"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      "notes.docx",
    );

    const req = { formData: async () => formData } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Only PDF, TXT, and Markdown files are supported.");
  });

  it("returns parsed plain text content for txt files", async () => {
    const req = {
      formData: async () => ({
        get: () => ({
          name: "notes.txt",
          size: 20,
          text: async () => "hello from text file",
        }),
      }),
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.parser).toBe("plain-text");
    expect(data.text).toContain("hello from text file");
    expect(mockedParsePdfDocument).not.toHaveBeenCalled();
  });

  it("returns normalized parser output for pdf files", async () => {
    mockedParsePdfDocument.mockResolvedValue({
      parser: "pdf-parse",
      text: "Extracted text",
      preview: "Extracted text",
      title: "Document Title",
      pages: 3,
      imageBased: false,
      blocks: [],
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "report.pdf", { type: "application/pdf" }),
      "report.pdf",
    );

    const req = { formData: async () => formData } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.parser).toBe("pdf-parse");
    expect(data.pages).toBe(3);
    expect(mockedParsePdfDocument).toHaveBeenCalledTimes(1);
  });

  it("returns 503 when parser is temporarily unavailable", async () => {
    mockedParsePdfDocument.mockRejectedValue(new Error("PDF parsing is temporarily unavailable."));

    const formData = new FormData();
    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "report.pdf", { type: "application/pdf" }),
      "report.pdf",
    );

    const req = { formData: async () => formData } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("PDF parsing is temporarily unavailable.");
  });
});
