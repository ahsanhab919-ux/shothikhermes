/**
 * Re-educator — Auto mode (Phase 0), spec §4 + the three paperjury hard rules.
 *
 * Auto is the same four-stage engine run MULTI-round: it applies safe fixes and
 * queues risky ones, converging until a deterministic stop. It is the most
 * safety-critical mode, so the spec's hard rules are enforced *structurally*,
 * not by convention:
 *
 *   HARD RULE 1 — Never self-detect Auto. There is no runtime signal that means
 *     "go autonomous." Auto runs only when the caller passes an explicit
 *     `optIn: true`. Absent that flag, the run is refused. This module exposes
 *     NO heuristic that could flip a Review into an Auto.
 *
 *   HARD RULE 2 — Two blocking pre-authorized sign-offs BEFORE any round:
 *     (a) freeze the anchors (author confirms untouchable claims / thesis), and
 *     (b) confirm scope (which sections are in-bounds). Both live in a required
 *     `authorization` object; a run with either missing is refused before the
 *     engine is ever touched.
 *
 *   HARD RULE 3 — Completion is deterministic. Auto stops when the ledger reports
 *     zero gate-blocking issues, OR after K quiet rounds (no edits applied), OR at
 *     a hard round cap. All three bounds are explicit and testable.
 *
 * Pure + deterministic in Phase 0 (no LLM; semantic seam passed through).
 */

import type { Span } from '../types';
import type { Profile } from '../profiles';
import {
  type EngineConfig,
  type IssueOutcome,
  type RegisteredGuard,
  type SemanticReviewer,
  runEngine,
} from '../engine';
import type { MeaningVerifier } from '../entailment';
import {
  type LedgerData,
  type LedgerEntryInput,
  type LedgerMeta,
  appendEntry,
  createLedger,
} from '../ledger';

/**
 * The two blocking sign-offs. Both flags MUST be true and the fields present, or
 * the run is refused. This is the "pre-authorized" gate — captured once, up front.
 */
export interface AutoAuthorization {
  /** (a) The author has frozen these anchors as untouchable. */
  anchorsFrozen: true;
  anchors: Span[];
  /** (b) The author has confirmed these sections are in-bounds for editing. */
  scopeConfirmed: true;
  /** In-bounds regions. Edits outside every scope span are ignored. */
  scope: Span[];
}

export interface AutoConfig {
  profile: Profile;
  guards: RegisteredGuard[];
  semanticReview?: SemanticReviewer;
  /** Optional meaning-preservation verifier (Phase 2 #5), threaded to the engine. */
  meaningVerifier?: MeaningVerifier;
  meta: LedgerMeta;
  /** HARD RULE 3 tuning. */
  quietRoundsToStop?: number; // K: consecutive no-edit rounds that end the run. Default 1.
  maxRounds?: number; // hard cap. Default 5.
}

/**
 * The Auto entry payload. `optIn` is HARD RULE 1: it is the ONLY way to enter
 * Auto, and it is a caller-supplied boolean — never inferred.
 */
export interface AutoRun {
  text: string;
  optIn: boolean;
  authorization: AutoAuthorization | null;
}

export type AutoStopReason =
  | 'refused-no-optin'
  | 'refused-no-authorization'
  | 'zero-gate-blocking' // converged: nothing left that blocks a gate
  | 'quiet-rounds' // K consecutive rounds applied no edits
  | 'round-cap'; // hit the hard round cap

export interface AutoResult {
  status: 'ran' | 'refused';
  stopReason: AutoStopReason;
  /** Final text after all applied rounds (input text if refused). */
  text: string;
  rounds: number;
  /** One continuous hash-chained ledger across ALL rounds. */
  ledger: LedgerData;
  /** Outcomes still needing a human (proposed / author-required / reverted). */
  queued: IssueOutcome[];
  reason: string;
}

/** An outcome that blocks a gate: anything not cleanly applied. */
function isGateBlocking(o: IssueOutcome): boolean {
  return o.disposition !== 'applied';
}

/**
 * The complement of the confirmed scope over [0, textLength): every region the
 * author did NOT put in-bounds. Fed to the engine as frozen anchors so that
 * out-of-scope spans are un-editable by construction (resolvePolicy freezes
 * anchor-overlapping issues). This is how "confirm scope" (hard rule 2b) is
 * enforced structurally rather than by post-hoc filtering.
 */
function outOfScopeAnchors(scope: Span[], textLength: number): Span[] {
  const sorted = [...scope].sort((a, b) => a.start - b.start);
  const gaps: Span[] = [];
  let cursor = 0;
  for (const s of sorted) {
    const start = Math.max(0, s.start);
    if (start > cursor) gaps.push({ start: cursor, end: start });
    cursor = Math.max(cursor, Math.min(textLength, s.end));
  }
  if (cursor < textLength) gaps.push({ start: cursor, end: textLength });
  return gaps;
}

/**
 * Validate the two hard-rule gates. Returns a refusal AutoResult, or null if the
 * run is authorized to proceed.
 */
function checkGates(run: AutoRun): AutoResult | null {
  // HARD RULE 1 — explicit opt-in only.
  if (run.optIn !== true) {
    return {
      status: 'refused',
      stopReason: 'refused-no-optin',
      text: run.text,
      rounds: 0,
      ledger: createLedger({ manuscript: '', writing_md_version: '', anchors: [] }),
      queued: [],
      reason: 'Auto refused: no explicit opt-in. Auto is never self-detected (hard rule 1).',
    };
  }

  // HARD RULE 2 — both sign-offs present and affirmative.
  const auth = run.authorization;
  const authorized =
    auth !== null && auth.anchorsFrozen === true && auth.scopeConfirmed === true;
  if (!authorized) {
    return {
      status: 'refused',
      stopReason: 'refused-no-authorization',
      text: run.text,
      rounds: 0,
      ledger: createLedger({ manuscript: '', writing_md_version: '', anchors: [] }),
      queued: [],
      reason:
        'Auto refused: both sign-offs are required before any round — freeze anchors AND confirm scope (hard rule 2).',
    };
  }

  return null;
}

/**
 * Run Auto. Loops the four-stage engine until a deterministic stop (hard rule 3).
 * Each round runs the engine on the current text, applies in-scope safe edits,
 * and appends this round's ledger entries into one continuous chain.
 */
export async function auto(config: AutoConfig, run: AutoRun): Promise<AutoResult> {
  const refusal = checkGates(run);
  if (refusal) return refusal;

  // Authorized: `authorization` is non-null past this point.
  const auth = run.authorization as AutoAuthorization;
  const K = config.quietRoundsToStop ?? 1;
  const cap = config.maxRounds ?? 5;

  let text = run.text;
  let ledger = createLedger(config.meta);
  let rounds = 0;
  let quiet = 0;
  let lastQueued: IssueOutcome[] = [];
  let stopReason: AutoStopReason = 'round-cap';

  while (rounds < cap) {
    rounds++;

    // Scope is enforced structurally: the complement of the confirmed scope is
    // added to the frozen anchors, so the engine can never edit out of bounds
    // and result.text is correct by construction.
    const frozen = [...auth.anchors, ...outOfScopeAnchors(auth.scope, text.length)];
    const engineConfig: EngineConfig = {
      profile: config.profile,
      guards: config.guards,
      anchors: frozen,
      semanticReview: config.semanticReview,
      meaningVerifier: config.meaningVerifier,
      meta: config.meta,
    };

    const result = await runEngine(engineConfig, text);

    const applied = result.outcomes.filter((o) => o.disposition === 'applied');

    if (applied.length > 0) {
      // Accept the engine's text and chain this round's entries onto the run.
      text = result.text;
      for (const entry of result.ledger.entries) {
        const { prev_hash: _p, hash: _h, ...payload } = entry;
        ledger = appendEntry(ledger, payload as LedgerEntryInput);
      }
      quiet = 0;
    } else {
      quiet++;
    }

    // Queue = everything a human still must see (gate-blockers this round).
    lastQueued = result.outcomes.filter(isGateBlocking);

    // HARD RULE 3 stop checks, in priority order.
    if (lastQueued.length === 0) {
      stopReason = 'zero-gate-blocking';
      break;
    }
    if (quiet >= K) {
      stopReason = 'quiet-rounds';
      break;
    }
    if (rounds >= cap) {
      stopReason = 'round-cap';
      break;
    }
  }

  return {
    status: 'ran',
    stopReason,
    text,
    rounds,
    ledger,
    queued: lastQueued,
    reason: `Auto completed after ${rounds} round(s): ${stopReason}.`,
  };
}
