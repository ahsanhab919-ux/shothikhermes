import { z } from "zod";

/**
 * Standard Hermes Run Event Envelope (ADR-001)
 */
export const HermesRunEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  runId: z.string(),
  workspaceId: z.string(),
  artifactId: z.string().optional(),
  domain: z.enum(["slides", "sheets", "research", "writing"]),
  eventType: z.string(),
  timestamp: z.string().datetime({ offset: true }),
  payload: z.record(z.string(), z.unknown()),
});

export type HermesRunEventEnvelope = z.infer<typeof HermesRunEventEnvelopeSchema>;

/**
 * GenerateSlidesCommand Schema (P1-001)
 */
export const GenerateSlidesCommandSchema = z.object({
  requestId: z.string().min(1, "requestId is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
  topic: z.string().min(3, "Topic must be at least 3 characters long"),
  slideCount: z.number().int().min(1).max(50).default(10),
  template: z.string().default("academic"),
  targetAudience: z.string().optional(),
  language: z.string().default("en"),
  userId: z.string().min(1, "userId is required"),
});

export type GenerateSlidesCommand = z.infer<typeof GenerateSlidesCommandSchema>;

/**
 * ResumeSlideGenerationCommand Schema
 */
export const ResumeSlideGenerationCommandSchema = z.object({
  requestId: z.string().min(1),
  workspaceId: z.string().min(1),
  runId: z.string().min(1, "runId is required"),
  jobId: z.string().min(1, "jobId is required"),
  userId: z.string().min(1),
});

export type ResumeSlideGenerationCommand = z.infer<typeof ResumeSlideGenerationCommandSchema>;

/**
 * PauseSlideGenerationCommand Schema
 */
export const PauseSlideGenerationCommandSchema = z.object({
  requestId: z.string().min(1),
  workspaceId: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().min(1),
  userId: z.string().min(1),
});

export type PauseSlideGenerationCommand = z.infer<typeof PauseSlideGenerationCommandSchema>;

/**
 * UpdateSlideContentCommand Schema
 */
export const UpdateSlideContentCommandSchema = z.object({
  requestId: z.string().min(1),
  workspaceId: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().min(1),
  slideIndex: z.number().int().min(0),
  content: z.object({
    title: z.string().optional(),
    bulletPoints: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  userId: z.string().min(1),
});

export type UpdateSlideContentCommand = z.infer<typeof UpdateSlideContentCommandSchema>;

/**
 * ExportSlideDeckCommand Schema
 */
export const ExportSlideDeckCommandSchema = z.object({
  requestId: z.string().min(1),
  workspaceId: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().min(1),
  format: z.enum(["pdf", "pptx", "html", "json"]).default("pptx"),
  userId: z.string().min(1),
});

export type ExportSlideDeckCommand = z.infer<typeof ExportSlideDeckCommandSchema>;
