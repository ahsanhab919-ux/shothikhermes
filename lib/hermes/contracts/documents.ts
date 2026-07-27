import { z } from "zod";

/**
 * Document Intelligence Contracts (Phase 1)
 *
 * Extends the canonical Hermes runtime vocabulary with document-oriented
 * entities. These contracts are the source of truth for the
 * chat-driven document intelligence pipeline:
 *
 *   chat upload intent -> document ingestion run -> durable document
 *   artifact -> artifact handoff -> editor/canvas surface
 *
 * Phase 1 covers only ingestion: capturing the source, producing a
 * minimal DocumentAST placeholder, and persisting it as a Hermes
 * artifact. Structure reconstruction, semantic reconstruction, and
 * export are later phases and their contracts are intentionally
 * permissive (unknown content) until those modules land.
 */

// ---------------------------------------------------------------------------
// Document source
// ---------------------------------------------------------------------------

export const DocumentSourceKindSchema = z.enum(["pdf", "scan", "url", "upload"]);

export type DocumentSourceKind = z.infer<typeof DocumentSourceKindSchema>;

export const DocumentSourceSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  runId: z.string().min(1),
  artifactId: z.string().min(1).optional(),
  kind: DocumentSourceKindSchema,
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sourceUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
  storageUrl: z.string().optional(),
  extractedText: z.string().default(""),
  pageCount: z.number().int().nonnegative().optional(),
  isScanned: z.boolean().optional(),
  ingestionStatus: z.enum([
    "pending",
    "extracting",
    "completed",
    "failed",
  ]).default("pending"),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type DocumentSource = z.infer<typeof DocumentSourceSchema>;

// ---------------------------------------------------------------------------
// Document AST
// ---------------------------------------------------------------------------

export const DocumentBlockTypeSchema = z.enum([
  "heading",
  "paragraph",
  "table",
  "figure",
  "caption",
  "citation",
  "list",
  "form_field",
]);

export type DocumentBlockType = z.infer<typeof DocumentBlockTypeSchema>;

export const DocumentBBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type DocumentBBox = z.infer<typeof DocumentBBoxSchema>;

export const DocumentBlockSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1).optional(),
  type: DocumentBlockTypeSchema,
  semanticRole: z.string().optional(),
  bbox: DocumentBBoxSchema.optional(),
  content: z.unknown().default(""),
  styleTokenIds: z.array(z.string()).default([]),
  sourceRef: z
    .object({
      page: z.number().int().nonnegative(),
      anchor: z.string().optional(),
    })
    .optional(),
  relations: z.array(z.string()).default([]),
});

export type DocumentBlock = z.infer<typeof DocumentBlockSchema>;

export const DocumentPageSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().nonnegative(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type DocumentPage = z.infer<typeof DocumentPageSchema>;

export const DocumentReferenceSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  rawText: z.string().default(""),
  target: z.string().optional(),
});

export type DocumentReference = z.infer<typeof DocumentReferenceSchema>;

export const DocumentStyleTokenSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["font", "spacing", "color", "layout"]),
  value: z.record(z.string(), z.unknown()).default({}),
});

export type DocumentStyleToken = z.infer<typeof DocumentStyleTokenSchema>;

export const DocumentASTSchema = z.object({
  id: z.string().min(1),
  metadata: z
    .object({
      title: z.string().optional(),
      documentType: z.string().optional(),
      language: z.string().optional(),
      authors: z.array(z.string()).default([]),
      sourceKind: DocumentSourceKindSchema,
    })
    .default({ sourceKind: "upload", authors: [] }),
  pages: z.array(DocumentPageSchema).default([]),
  blocks: z.array(DocumentBlockSchema).default([]),
  references: z.array(DocumentReferenceSchema).default([]),
  styleTokens: z.array(DocumentStyleTokenSchema).default([]),
});

export type DocumentAST = z.infer<typeof DocumentASTSchema>;

// ---------------------------------------------------------------------------
// Document ingestion intent (chat -> ingestion)
// ---------------------------------------------------------------------------

export const DocumentIntentSchema = z.enum([
  "ingest",
  "summarize",
  "simplify",
  "notes",
  "slides",
  "study_guide",
  "redesign",
  "extract_citations",
  "ask",
]);

export type DocumentIntent = z.infer<typeof DocumentIntentSchema>;

/**
 * Chat-driven document request. This is the shape the chat orchestrator
 * inspects to decide whether a chat turn should trigger a document
 * ingestion run instead of (or alongside) a plain model response.
 */
export const DocumentChatRequestSchema = z.object({
  intent: DocumentIntentSchema.default("ingest"),
  artifactId: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

export type DocumentChatRequest = z.infer<typeof DocumentChatRequestSchema>;
