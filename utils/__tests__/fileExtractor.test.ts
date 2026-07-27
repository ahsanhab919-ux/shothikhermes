import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/document-parsing/client", () => ({
  getPdfExtractionRoute: vi.fn(() => "/api/extract-pdf-v2"),
}));

describe("extractFileContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses extract-pdf-v2 when the client-side feature flag is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED", "true");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        text: "server extracted text",
        pages: 2,
      }),
    }) as any;

    const { extractFileContent } = await import("@/utils/fileExtractor");

    const result = await extractFileContent(
      new File([new Uint8Array([1, 2, 3])], "doc.pdf", { type: "application/pdf" }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/extract-pdf-v2",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result.text).toBe("server extracted text");
    expect(result.pageCount).toBe(2);
  });
});

