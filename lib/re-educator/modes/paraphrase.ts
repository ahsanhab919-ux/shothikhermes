/**
 * Re-educator — Paraphrase mode (Phase 0), spec §4 + §4b.
 *
 * The whole point of the design: Paraphrase is NOT a new engine. It is the exact
 * four-stage loop with the PARAPHRASE verdict profile selected — two knobs turned
 * (readability + voice-drift move propose -> auto-fixable; wider clarity bound).
 *
 *   "Paraphrase is a config profile, not a new engine (ponytail discipline)."
 *   Author gate: "confirm the diff; frozen anchors still untouchable."
 *
 * This module is deliberately thin. It does not re-implement REVIEW/VERDICT/
 * REVISE/VERIFY — it forces the profile to PARAPHRASE and delegates to the same
 * single-round path Review uses. If someone tries to pass a different profile,
 * it is overridden: Paraphrase mode IS the PARAPHRASE profile, by definition.
 *
 * The safety invariant that makes a bounded paraphraser trustworthy: everything
 * that touches meaning — pii, unsupported-assertion, and any span overlapping a
 * frozen anchor — stays author-required with maxDiff 0 in PARAPHRASE, identical
 * to STANDARD. So this is a meaning-preserving rephrase, not a rewrite-everything
 * machine. That boundary is the feature.
 *
 * Pure + deterministic in Phase 0 (no LLM; semantic seam passed through).
 */

import type { Span } from '../types';
import { PARAPHRASE } from '../profiles';
import type { RegisteredGuard, SemanticReviewer } from '../engine';
import type { MeaningVerifier } from '../entailment';
import type { LedgerMeta } from '../ledger';
import { review, type ReviewResult } from './review';

export interface ParaphraseConfig {
  guards: RegisteredGuard[];
  anchors?: Span[];
  semanticReview?: SemanticReviewer;
  /** Optional meaning-preservation verifier (Phase 2 #5), threaded to the engine. */
  meaningVerifier?: MeaningVerifier;
  meta: LedgerMeta;
}

/**
 * Categories that are meaning-bearing and therefore frozen in BOTH profiles.
 * Exposed so callers (and tests) can assert the invariant explicitly.
 */
export const MEANING_FROZEN_CATEGORIES = [
  'pii',
  'unsupported-assertion',
] as const;

export type ParaphraseResult = ReviewResult & {
  /** Always 'paraphrase' — records which profile drove this run. */
  profile: 'paraphrase';
};

/**
 * Run Paraphrase over `text`. Delegates to the single-round Review path with the
 * profile forced to PARAPHRASE — no forked engine, no new stages. This is the
 * concrete proof of "Paraphrase = config, not code": the only difference from a
 * Review run is which profile object is handed to the identical engine.
 */
export async function paraphrase(config: ParaphraseConfig, text: string): Promise<ParaphraseResult> {
  const result = await review(
    {
      profile: PARAPHRASE,
      guards: config.guards,
      anchors: config.anchors ?? [],
      semanticReview: config.semanticReview,
      meaningVerifier: config.meaningVerifier,
      meta: config.meta,
    },
    text,
  );

  return { ...result, profile: 'paraphrase' };
}
