/**
 * Re-educator — Review mode (Phase 0), spec §4.
 *
 * The author asks to critique / harden a passage or document. Review runs the
 * FULL four-stage engine for exactly ONE round and stops at the gates:
 *
 *   "full four-stage engine, ONE round, stops at gates."
 *   Author gate: "confirm applied + review queued."
 *
 * Unlike Nudge (one patch, no ledger, no panel), Review opens both:
 *   - the hash-chained ledger (every applied edit is chained + verifiable), and
 *   - an issue panel that groups outcomes by what the author must do next.
 *
 * Review is single-round by construction: it calls runEngine once and never
 * re-loops. Multi-round convergence is Auto mode's job (spec §4, hard rule 3).
 * This keeps Review a thin, honest layer over the engine — no forked loop.
 *
 * Pure + deterministic in Phase 0 (no LLM; the semantic seam is passed through
 * to the engine untouched).
 */

import type { Span } from '../types';
import type { Profile } from '../profiles';
import {
  type EngineConfig,
  type EngineResult,
  type IssueOutcome,
  type RegisteredGuard,
  type SemanticReviewer,
  runEngine,
} from '../engine';
import type { MeaningVerifier } from '../entailment';
import type { LedgerData, LedgerMeta } from '../ledger';

export interface ReviewConfig {
  profile: Profile;
  guards: RegisteredGuard[];
  anchors?: Span[];
  semanticReview?: SemanticReviewer;
  /** Optional meaning-preservation verifier (Phase 2 #5), threaded to the engine. */
  meaningVerifier?: MeaningVerifier;
  meta: LedgerMeta;
}

/**
 * The issue panel: outcomes grouped by the author action they imply. This is the
 * "panel" the spec contrasts with Nudge — a reviewable queue, not a single patch.
 */
export interface IssuePanel {
  /** Auto-fixable edits already applied + verified (shown as a confirmable diff). */
  applied: IssueOutcome[];
  /** Semantic edits drafted, waiting for the author's OK. */
  proposed: IssueOutcome[];
  /** Claims / numbers / thesis / PII — handed back untouched with a question. */
  authorRequired: IssueOutcome[];
  /** Edits attempted but reverted by VERIFY — re-queued, never silently kept. */
  revertedRequeued: IssueOutcome[];
}

/** The two gates the author confirms at the end of a Review round. */
export interface ReviewGates {
  /** True if there are applied edits to confirm. */
  hasAppliedToConfirm: boolean;
  /** True if there is a review queue (proposed / author-required / reverted). */
  hasReviewQueue: boolean;
}

export interface ReviewResult {
  /** Text after this single round's applied edits. */
  text: string;
  panel: IssuePanel;
  gates: ReviewGates;
  ledger: LedgerData;
  /** Totals for a quick summary line. */
  summary: {
    total: number;
    applied: number;
    proposed: number;
    authorRequired: number;
    revertedRequeued: number;
  };
  /** Always 1 — Review is single-round by contract. */
  rounds: 1;
}

function groupOutcomes(outcomes: IssueOutcome[]): IssuePanel {
  const panel: IssuePanel = {
    applied: [],
    proposed: [],
    authorRequired: [],
    revertedRequeued: [],
  };
  for (const o of outcomes) {
    switch (o.disposition) {
      case 'applied':
        panel.applied.push(o);
        break;
      case 'proposed':
        panel.proposed.push(o);
        break;
      case 'author-required':
        panel.authorRequired.push(o);
        break;
      case 'reverted-requeued':
        panel.revertedRequeued.push(o);
        break;
    }
  }
  return panel;
}

/** Run one Review round over `text`.
 * Async since Phase 2: the engine may invoke a semantic reviewer (network). */
export async function review(config: ReviewConfig, text: string): Promise<ReviewResult> {
  const engineConfig: EngineConfig = {
    profile: config.profile,
    guards: config.guards,
    anchors: config.anchors ?? [],
    semanticReview: config.semanticReview,
    meaningVerifier: config.meaningVerifier,
    meta: config.meta,
  };

  const result: EngineResult = await runEngine(engineConfig, text);
  const panel = groupOutcomes(result.outcomes);

  const summary = {
    total: result.outcomes.length,
    applied: panel.applied.length,
    proposed: panel.proposed.length,
    authorRequired: panel.authorRequired.length,
    revertedRequeued: panel.revertedRequeued.length,
  };

  const gates: ReviewGates = {
    hasAppliedToConfirm: summary.applied > 0,
    hasReviewQueue:
      summary.proposed + summary.authorRequired + summary.revertedRequeued > 0,
  };

  return {
    text: result.text,
    panel,
    gates,
    ledger: result.ledger,
    summary,
    rounds: 1,
  };
}
