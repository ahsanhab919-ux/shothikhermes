/**
 * Re-educator — four-stage engine orchestrator (Phase 0).
 *
 * REVIEW → VERDICT → REVISE → VERIFY, exactly as RE-EDUCATOR-SPEC.md §3. The
 * engine is identical across modes; a mode only selects a verdict profile
 * (§4b) — that is the whole "Paraphrase = config, not new code" claim.
 *
 * Phase 0 is fully deterministic:
 *   - REVIEW runs the pure guards. The semantic (LLM) reviewer is a pluggable
 *     seam (`semanticReview`) that is simply absent in Phase 0.
 *   - VERDICT uses resolvePolicy(), which freezes any issue overlapping a frozen
 *     anchor BEFORE the profile is consulted.
 *   - REVISE applies only mechanical `auto-fixable` suggestions, and only when
 *     the edit stays within the category's minimum-diff bound and touches no
 *     anchor. It produces the minimum diff (guards already carry the exact span).
 *   - VERIFY re-runs the flagging guard on the revised text; the edit is kept
 *     only if that guard no longer flags the (shifted) span AND the diff stayed
 *     in bound. Anything that fails is reverted and re-queued — never kept.
 *
 * Every applied edit is recorded in the hash-chained ledger (§5).
 */

import type { Guard, Issue, IssueCategory, Span } from './types';
import {
  type Profile,
  type Verdict,
  resolvePolicy,
} from './profiles';
import { normalizedDistance, withinBound } from './diff';
import { SEMANTIC_CATEGORIES } from './provider';
import { type MeaningVerifier, verifyMeaningPreserved } from './entailment';
import {
  type LedgerData,
  type LedgerEntryInput,
  type LedgerMeta,
  appendEntry,
  createLedger,
} from './ledger';

/** A guard registered with the engine, keyed by the category it owns. */
export interface RegisteredGuard {
  /** Guard name, e.g. "readability" — recorded on issues + ledger verify. */
  name: string;
  category: IssueCategory;
  run: Guard<unknown>;
  /** Optional per-guard context (options / rules / voice profile). */
  ctx?: unknown;
}

/**
 * Optional semantic seam. Phase 0/1 leaves this undefined. When supplied it
 * returns extra issues (clarity, tone, unsupported-assertion) to merge into the
 * REVIEW output. Kept as an interface so Phase 2 BYOK is one field, no rework.
 *
 * Async since Phase 2: a real reviewer is a network call to a model provider.
 * A synchronous reviewer may still be supplied (a returned value is awaited
 * trivially), so existing deterministic/fake reviewers keep working unchanged.
 */
export type SemanticReviewer = (text: string) => Issue[] | Promise<Issue[]>;

export interface EngineConfig {
  profile: Profile;
  guards: RegisteredGuard[];
  /** Frozen spans no edit may touch (author claims / thesis / WRITING.md goals). */
  anchors?: Span[];
  /** Optional semantic reviewer (absent in Phase 0). */
  semanticReview?: SemanticReviewer;
  /**
   * Optional meaning-preservation verifier (Phase 2 #5). When present, a
   * SEMANTIC-category edit is kept only if this confirms the revised text still
   * means what the original meant — a second VERIFY gate alongside the
   * deterministic guard re-run. Absent ⇒ semantic edits cannot pass the meaning
   * gate (fail-closed); mechanical edits are unaffected either way.
   */
  meaningVerifier?: MeaningVerifier;
  /** Ledger meta for this run. */
  meta: LedgerMeta;
}

/** The categories that require the meaning-preservation gate when applied. */
const SEMANTIC_CATEGORY_SET = new Set<string>(SEMANTIC_CATEGORIES);

/** An issue after adjudication: original issue + its resolved verdict/bound. */
export interface AdjudicatedIssue {
  issue: Issue;
  verdict: Verdict;
  maxDiff: number;
  overlapsAnchor: boolean;
}

/** The disposition of an issue after the REVISE + VERIFY stages. */
export type Disposition =
  | 'applied' // auto-fixable edit applied and verified
  | 'proposed' // needs author OK (semantic edit) — drafted, not applied
  | 'author-required' // never edited, handed back
  | 'reverted-requeued'; // an edit was attempted but failed verification

export interface IssueOutcome {
  issue: Issue;
  verdict: Verdict;
  disposition: Disposition;
  /** The drafted or applied edit, when there is one. */
  edit?: { before: string; after: string; reason: string };
  /** Why the outcome landed where it did (esp. reverts). */
  note?: string;
}

export interface EngineResult {
  /** Final text after all applied edits. */
  text: string;
  outcomes: IssueOutcome[];
  ledger: LedgerData;
}

/** True if two spans overlap at all. */
function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

function overlapsAnyAnchor(span: Span, anchors: Span[]): boolean {
  return anchors.some((anchor) => overlaps(span, anchor));
}

/** Stage 1 — REVIEW: run every guard, then merge any semantic findings.
 * Async since Phase 2: the semantic reviewer may be a provider network call. */
export async function review(config: EngineConfig, text: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  for (const g of config.guards) {
    for (const issue of g.run(text, g.ctx)) {
      issues.push({ ...issue, source: issue.source ?? g.name });
    }
  }
  if (config.semanticReview) issues.push(...(await config.semanticReview(text)));
  // Stable order: by span start, then category, for deterministic processing.
  return issues.sort(
    (a, b) => a.span.start - b.span.start || a.category.localeCompare(b.category),
  );
}

/** Stage 2 — VERDICT: resolve each issue's policy (anchors freeze first). */
export function adjudicate(config: EngineConfig, issues: Issue[]): AdjudicatedIssue[] {
  const anchors = config.anchors ?? [];
  return issues.map((issue) => {
    const overlapsAnchor = overlapsAnyAnchor(issue.span, anchors);
    const policy = resolvePolicy(issue.category, config.profile, overlapsAnchor);
    return { issue, verdict: policy.verdict, maxDiff: policy.maxDiff, overlapsAnchor };
  });
}

/**
 * Find the guard that owns a category, to re-run it during VERIFY. Falls back to
 * a name match on the issue's `source` if present.
 */
function guardFor(config: EngineConfig, issue: Issue): RegisteredGuard | undefined {
  return (
    config.guards.find((g) => g.name === issue.source) ??
    config.guards.find((g) => g.category === issue.category)
  );
}

/**
 * The DETERMINISTIC VERIFY gate for a MECHANICAL edit. Pure + synchronous: the
 * edit must stay within the diff bound AND the flagging guard must no longer flag
 * a span overlapping the edited region. This is the Phase 0 gate, unchanged, kept
 * as its own function so the synchronous callers (Nudge) use it directly without
 * being dragged into the async meaning-gate path.
 */
export function verifyMechanicalEdit(
  config: EngineConfig,
  issue: Issue,
  editedSpan: Span,
  editedText: string,
  before: string,
  after: string,
  maxDiff: number,
): boolean {
  if (!withinBound(before, after, maxDiff)) return false;
  const guard = guardFor(config, issue);
  if (!guard) return false;
  const reflagged = guard
    .run(editedText, guard.ctx)
    .some((i) => i.category === issue.category && overlaps(i.span, editedSpan));
  return !reflagged;
}

/**
 * VERIFY a single applied edit. Two gates, selected by the issue's category:
 *
 *   - The DIFF-BOUND gate always applies: an edit exceeding the category's
 *     minimum-diff bound fails regardless of kind.
 *   - For a MECHANICAL edit (a deterministic guard owns the category), the
 *     second gate is the guard RE-RUN (`verifyMechanicalEdit`). Unchanged from
 *     Phase 0.
 *   - For a SEMANTIC edit (clarity / voice-drift / unsupported-assertion — no
 *     deterministic guard owns it), the second gate is MEANING-PRESERVATION
 *     (Phase 2 #5): the meaning verifier must confirm the revised text still
 *     means what the original meant. Absent verifier or any doubt ⇒ fail closed.
 *
 * Async since Phase 2 #5: the meaning gate may be a provider network call.
 */
export async function verifyEdit(
  config: EngineConfig,
  issue: Issue,
  editedSpan: Span,
  editedText: string,
  before: string,
  after: string,
  maxDiff: number,
): Promise<boolean> {
  // Diff-bound gate applies to every kind of edit.
  if (!withinBound(before, after, maxDiff)) return false;

  // Semantic categories have no deterministic guard; the meaning gate stands in
  // for the guard re-run. Fail closed when no verifier can confirm it.
  if (SEMANTIC_CATEGORY_SET.has(issue.category)) {
    return verifyMeaningPreserved(config.meaningVerifier, before, after);
  }

  // Mechanical edit: reuse the pure synchronous gate.
  return verifyMechanicalEdit(config, issue, editedSpan, editedText, before, after, maxDiff);
}

/**
 * Run the whole pipeline. Applies mechanical `auto-fixable` edits one at a time
 * (recomputing offsets after each accepted edit), verifying and ledgering each.
 */
export async function runEngine(config: EngineConfig, inputText: string): Promise<EngineResult> {
  const issues = await review(config, inputText);
  const adjudicated = adjudicate(config, issues);

  // Apply edits left-to-right so earlier offsets stay valid until consumed.
  const ordered = [...adjudicated].sort((a, b) => a.issue.span.start - b.issue.span.start);

  let text = inputText;
  let offset = 0; // net length delta applied so far
  let ledger = createLedger(config.meta);
  const outcomes: IssueOutcome[] = [];

  for (const adj of ordered) {
    const { issue, verdict, maxDiff } = adj;

    if (verdict === 'author-required') {
      outcomes.push({ issue, verdict, disposition: 'author-required' });
      continue;
    }

    if (verdict === 'propose') {
      // Draft only; never applied without author OK.
      const before = issue.text;
      const after = issue.suggestion ?? issue.text;
      outcomes.push({
        issue,
        verdict,
        disposition: 'proposed',
        edit: { before, after, reason: issue.rationale },
        note: 'Semantic edit — awaiting author confirmation.',
      });
      continue;
    }

    // verdict === 'auto-fixable'
    const before = issue.text;
    const after = issue.suggestion;
    if (after === undefined || after === before) {
      // Nothing mechanical to apply (e.g. a flag with no suggestion).
      outcomes.push({
        issue,
        verdict,
        disposition: 'proposed',
        note: 'Auto-fixable but no mechanical suggestion; deferred to author.',
      });
      continue;
    }

    // Compute the live span in the current (already-edited) text.
    const liveStart = issue.span.start + offset;
    const liveEnd = issue.span.end + offset;
    const candidate = text.slice(0, liveStart) + after + text.slice(liveEnd);
    const newSpan: Span = { start: liveStart, end: liveStart + after.length };

    // APPLY_PATH_TODO (Phase 2 #6 / Auto-semantic): only mechanical `auto-fixable`
    // edits reach here today — semantic findings land as `propose` above and are
    // never auto-applied. When a semantic apply path is enabled, it routes through
    // this same verifyEdit call, which already selects the meaning gate for
    // semantic categories. So the meaning-preservation gate is in place and tested
    // now; enabling the apply path is an additive change, not a rewrite here.
    const ok = await verifyEdit(config, issue, newSpan, candidate, before, after, maxDiff);

    if (!ok) {
      const semantic = SEMANTIC_CATEGORY_SET.has(issue.category);
      outcomes.push({
        issue,
        verdict,
        disposition: 'reverted-requeued',
        edit: { before, after, reason: issue.rationale },
        note: semantic
          ? 'Edit failed VERIFY (meaning not preserved or unverifiable) — reverted.'
          : 'Edit failed VERIFY (out of bound or guard still flags) — reverted.',
      });
      continue;
    }

    // Accept: mutate text, shift offset, ledger it.
    text = candidate;
    offset += after.length - (liveEnd - liveStart);

    const entry: LedgerEntryInput = {
      issue_id: issue.id ?? `${issue.category}:${issue.span.start}:${issue.span.end}`,
      span: issue.span,
      category: issue.category,
      severity: issue.severity,
      verdict,
      edit: { before, after, reason: issue.rationale },
      verify: {
        guard: guardFor(config, issue)?.name ?? issue.source ?? issue.category,
        before_score: 1,
        after_score: normalizedDistance(before, after),
        result: 'pass',
      },
    };
    ledger = appendEntry(ledger, entry);

    outcomes.push({
      issue,
      verdict,
      disposition: 'applied',
      edit: { before, after, reason: issue.rationale },
    });
  }

  return { text, outcomes, ledger };
}
