import { describe, it, expect } from "vitest";
import {
  DocumentSourceSchema,
  DocumentSourceKindSchema,
  DocumentASTSchema,
  DocumentBlockSchema,
  DocumentBlockTypeSchema,
  DocumentPageSchema,
  DocumentReferenceSchema,
  DocumentStyleTokenSchema,
  DocumentIntentSchema,
  DocumentChatRequestSchema,
} from "./documents";

describe("Document Source Contracts", () => {
  describe("DocumentSourceKindSchema", () => {
    it("validates all declared source kinds", () => {
      const kinds = ["pdf", "scan", "url", "upload"];
      kinds.forEach((k) => {
        expect(() => DocumentSourceKindSchema.parse(k)).not.toThrow();
      });
    });

    it("rejects unknown source kinds", () => {
      expect(() => DocumentSourceKindSchema.parse("docx")).toThrow();
      expect(() => DocumentSourceKindSchema.parse("")).toThrow();
    });
  });

  describe("DocumentSourceSchema", () => {
    it("validates a complete document source", () => {
      const source = {
        id: "docsrc_123",
        workspaceId: "ws_456",
        userId: "user_789",
        runId: "run_abc",
        artifactId: "art_def",
        kind: "upload" as const,
        fileName: "paper.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        sourceUrl: "https://example.com/paper.pdf",
        storageKey: "uploads/paper.pdf",
        storageUrl: "https://cdn.example.com/paper.pdf",
        extractedText: "Some extracted text",
        pageCount: 10,
        isScanned: false,
        ingestionStatus: "completed" as const,
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:31:00Z",
        metadata: { intent: "ingest" },
      };

      expect(() => DocumentSourceSchema.parse(source)).not.toThrow();
    });

    it("validates a minimal document source with defaults", () => {
      const minimal = {
        id: "docsrc_123",
        workspaceId: "ws_456",
        userId: "user_789",
        runId: "run_abc",
        kind: "url" as const,
        sourceUrl: "https://example.com/doc.pdf",
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
      };

      const result = DocumentSourceSchema.parse(minimal);
      expect(result.extractedText).toBe("");
      expect(result.ingestionStatus).toBe("pending");
      expect(result.metadata).toEqual({});
    });

    it("rejects invalid ingestion status", () => {
      const bad = {
        id: "docsrc_123",
        workspaceId: "ws_456",
        userId: "user_789",
        runId: "run_abc",
        kind: "upload" as const,
        ingestionStatus: "unknown",
        createdAt: "2026-07-25T15:30:00Z",
        updatedAt: "2026-07-25T15:30:00Z",
      };

      expect(() => DocumentSourceSchema.parse(bad)).toThrow();
    });
  });
});

describe("Document AST Contracts", () => {
  describe("DocumentBlockTypeSchema", () => {
    it("validates all declared block types", () => {
      const types = [
        "heading",
        "paragraph",
        "table",
        "figure",
        "caption",
        "citation",
        "list",
        "form_field",
      ];
      types.forEach((t) => {
        expect(() => DocumentBlockTypeSchema.parse(t)).not.toThrow();
      });
    });
  });

  describe("DocumentBlockSchema", () => {
    it("validates a complete block with bbox and sourceRef", () => {
      const block = {
        id: "blk_1",
        pageId: "page_1",
        type: "heading" as const,
        semanticRole: "title",
        bbox: { x: 0, y: 0, w: 100, h: 20 },
        content: "Introduction",
        styleTokenIds: ["st_1"],
        sourceRef: { page: 0, anchor: "top" },
        relations: ["blk_2"],
      };

      expect(() => DocumentBlockSchema.parse(block)).not.toThrow();
    });

    it("validates a minimal block with defaults", () => {
      const minimal = {
        id: "blk_1",
        type: "paragraph" as const,
      };

      const result = DocumentBlockSchema.parse(minimal);
      expect(result.styleTokenIds).toEqual([]);
      expect(result.relations).toEqual([]);
      expect(result.content).toBe("");
    });
  });

  describe("DocumentPageSchema", () => {
    it("validates a page with index", () => {
      expect(() =>
        DocumentPageSchema.parse({ id: "page_1", index: 0 }),
      ).not.toThrow();
    });
  });

  describe("DocumentReferenceSchema", () => {
    it("validates a reference with target", () => {
      const ref = {
        id: "ref_1",
        label: "[1]",
        rawText: "Smith et al. 2025",
        target: "https://example.com",
      };
      expect(() => DocumentReferenceSchema.parse(ref)).not.toThrow();
    });
  });

  describe("DocumentStyleTokenSchema", () => {
    it("validates a style token", () => {
      const token = {
        id: "st_1",
        kind: "font" as const,
        value: { family: "serif", size: 12 },
      };
      expect(() => DocumentStyleTokenSchema.parse(token)).not.toThrow();
    });
  });

  describe("DocumentASTSchema", () => {
    it("validates a complete AST with pages, blocks, references, and style tokens", () => {
      const ast = {
        id: "ast_1",
        metadata: {
          title: "Research Paper",
          documentType: "article",
          language: "en",
          authors: ["Author A"],
          sourceKind: "pdf" as const,
        },
        pages: [{ id: "page_1", index: 0, width: 612, height: 792 }],
        blocks: [
          {
            id: "blk_1",
            pageId: "page_1",
            type: "heading" as const,
            content: "Title",
          },
          {
            id: "blk_2",
            pageId: "page_1",
            type: "paragraph" as const,
            content: "Body text",
          },
        ],
        references: [{ id: "ref_1", rawText: "Ref" }],
        styleTokens: [{ id: "st_1", kind: "color" as const, value: { hex: "#000" } }],
      };

      expect(() => DocumentASTSchema.parse(ast)).not.toThrow();
    });

    it("validates a minimal AST with defaults", () => {
      const minimal = {
        id: "ast_1",
      };

      const result = DocumentASTSchema.parse(minimal);
      expect(result.pages).toEqual([]);
      expect(result.blocks).toEqual([]);
      expect(result.references).toEqual([]);
      expect(result.styleTokens).toEqual([]);
      expect(result.metadata.sourceKind).toBe("upload");
      expect(result.metadata.authors).toEqual([]);
    });
  });
});

describe("Document Intent Contracts", () => {
  describe("DocumentIntentSchema", () => {
    it("validates all declared intents", () => {
      const intents = [
        "ingest",
        "summarize",
        "simplify",
        "notes",
        "slides",
        "study_guide",
        "redesign",
        "extract_citations",
        "ask",
      ];
      intents.forEach((i) => {
        expect(() => DocumentIntentSchema.parse(i)).not.toThrow();
      });
    });

    it("rejects unknown intents", () => {
      expect(() => DocumentIntentSchema.parse("translate")).toThrow();
    });
  });

  describe("DocumentChatRequestSchema", () => {
    it("validates a complete request with defaults", () => {
      const req = {
        sourceUrl: "https://example.com/paper.pdf",
        fileName: "paper.pdf",
        mimeType: "application/pdf",
      };

      const result = DocumentChatRequestSchema.parse(req);
      expect(result.intent).toBe("ingest");
      expect(result.sourceUrl).toBe("https://example.com/paper.pdf");
    });

    it("validates with explicit intent and artifactId", () => {
      const req = {
        intent: "summarize",
        artifactId: "art_123",
      };

      const result = DocumentChatRequestSchema.parse(req);
      expect(result.intent).toBe("summarize");
      expect(result.artifactId).toBe("art_123");
    });

    it("validates an empty object with defaults", () => {
      const result = DocumentChatRequestSchema.parse({});
      expect(result.intent).toBe("ingest");
    });

    it("rejects an invalid sourceUrl", () => {
      expect(() =>
        DocumentChatRequestSchema.parse({ sourceUrl: "not-a-url" }),
      ).toThrow();
    });
  });
});
