/**
 * Hermes Cross-Domain Handoff Contracts
 * 
 * Provides typed domain schemas and payload structures for cross-domain run transitions:
 * chat <-> research <-> sheets <-> slides <-> writing <-> books <-> publish
 */

import { z } from "zod";
import { ArtifactDomainSchema } from "./core";

export const CrossDomainHandoffSchema = z.object({
  workspaceId: z.string().min(1),
  sourceDomain: ArtifactDomainSchema,
  targetDomain: ArtifactDomainSchema,
  sourceRunId: z.string().optional(),
  sourceSessionId: z.string().optional(),
  contextSummary: z.string().min(1),
  artifacts: z.array(z.string()).default([]),
  instructions: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),

});

export type HandoffPayload = z.infer<typeof CrossDomainHandoffSchema>;

export interface HandoffResult {
  handoffId: string;
  targetRunId: string;
  streamUrl: string;
  sourceDomain: string;
  targetDomain: string;
  workspaceId: string;
}
