import { z } from "zod";

// ============================================
// Input Validation Schemas
// ============================================

// Common validators
const idSchema = z.string().min(1).max(100);
const textSchema = z.string().min(1).max(50000); // 50KB max
const emailSchema = z.string().email();
const urlSchema = z.string().url();

// ============================================
// Writing Domain Schemas
// ============================================

export const paraphraseRequestSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters").max(5000),
  mode: z.enum(["standard", "academic", "casual", "creative", "fluency", "formal"]).default("standard"),
  strength: z.enum(["light", "medium", "heavy"]).default("medium"),
  language: z.string().max(20).default("en"),
});

export const grammarCheckSchema = z.object({
  text: z.string().min(1).max(10000),
  language: z.string().default("en"),
});

export const humanizeRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  mode: z.enum(["standard", "natural", "formal", "casual", "creative"]).default("standard"),
  intensity: z.enum(["light", "medium", "aggressive"]).default("medium"),
});

export const humanizerV5Schema = z.object({
  text: z.string().min(1).max(5000),
  model: z.string().optional().default("panda"),
  level: z.union([z.number(), z.string()]).optional(),
  language: z.string().optional().default("en"),
});

export const aiDetectionSchema = z.object({
  text: z.string().min(1).max(10000),
  detailed: z.boolean().default(false),
});

export const summarizeSchema = z.object({
  text: z.string().min(1).max(10000),
  type: z.enum(["key-points", "paragraph", "bullets", "tldr", "abstract"]).default("key-points"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().min(2).max(10),
  targetLang: z.string().min(2).max(10),
});

// ============================================
// Studio Domain Schemas
// ============================================

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["assignment", "book", "blog", "marketing", "research"]),
  description: z.string().max(1000).optional(),
  template: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "editing", "published"]).optional(),
});

export const createChapterSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
});

export const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(1000000).optional(), // 1MB max
});

export const aiAssistSchema = z.object({
  action: z.enum(["continue", "rewrite", "summarize", "expand", "shorten", "tone"]),
  context: z.string().max(500).optional(),
  tone: z.string().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

// ============================================
// Export Schemas
// ============================================

export const exportRequestSchema = z.object({
  format: z.enum(["pdf", "docx", "txt", "md", "html"]),
  options: z.object({
    includeTableOfContents: z.boolean().optional(),
    includePageNumbers: z.boolean().optional(),
    fontSize: z.number().min(8).max(24).optional(),
    fontFamily: z.string().optional(),
    lineSpacing: z.number().min(1).max(3).optional(),
  }).optional(),
});

// ============================================
// Validation Helper
// ============================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function sanitizeHtml(html: string): string {
  // Basic XSS protection - remove script tags and event handlers
  return html
    .replace(/\u003cscript[^\u003e]*\u003e[\s\S]*?\u003c\/script\u003e/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeText(text: string): string {
  // Remove null bytes and control characters
  return text
    .replace(/\x00/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}