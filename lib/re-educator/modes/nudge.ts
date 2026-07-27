/**
 * Re-educator — Nudge mode (Phase 0), spec §4.
 *
 * The lightest mode. The author asks for ONE concrete change ("tighten this",
 * "fix the tone here"); Nudge runs the relevant guard over the targeted region,
 * proposes the single minimum-diff patch, VERIFIES it, and returns exactly one
 * confirmable patch. Per the spec:
 *
 *   "writing toolkit -> verify -> apply. No ledger, no panel."
 *   Author gate: "confirm the single patch."
 *
 * So Nudge deliberately does NOT open the ledger or the issue panel — that is
 * Review/Auto territory. It reuses the engine's primitives (verifyEdit + the
 * diff bound + the anchor freeze), never forking the loop. A single applied
 * change is not chain-of-custody work; the ledger stays for multi-issue runs.
 *
 * Pure + deterministic: the caller supplies the target span and the proposed
 * replacement (from the writing toolkit / a semantic seam), and Nudge decides
 * whether that patch is safe to offer. It never invents wording itself in
 * Phase 0 — no LLM here.
 */

import type { Span } from '../types';
import type { Profile } from '../profiles';
import { resolvePolicy } from '../profiles';
import { withinBound } from '../diff';
import {
  type EngineConfig,
  type RegisteredGuard,
  verifyMechanicalEdit,
} from '../engine';

/** What the author asked to change: a span and the proposed replacement text. */
export interface NudgeRequest {
  /** Full source text. */
  text: string;
  /** The region the author pointed at. */
  span: Span;
  /** The proposed replacement for that span (from the writing toolkit). */
  replacement: string;
  /** Which guard/category this change is about (drives verdict + bound + verify). */
  category: RegisteredGuard['category'];
}

/** Everything Nudge needs: the profile, the guards, and the frozen anchors. */
export interface NudgeConfig {
  profile: Profile;
  guards: RegisteredGuard[];
  anchors?: Span[];
}

export type NudgeStatus =
  | 'ready' // a single patch is offered for confirmation
  | 'refused-anchor' // the span overlaps a frozen anchor — never editable
  | 'refused-author-required' // the category is author-required in this profile
  | 'refused-out-of-bound' // the change exceeds the category's diff bound
  | 'refused-verify' // the guard still flags the edited span
  | 'noop'; // nothing to change (replacement equals current text)

/** The single confirmable patch (or a refusal explaining why there is none). */
export interface NudgeResult {
  status: NudgeStatus;
  /** Present only when status === 'ready'. */
  patch?: {
    span: Span;
    before: string;
    after: string;
    /** The full text as it would read AFTER applying the patch. */
    preview: string;
  };
  reason: string;
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Evaluate a nudge. Returns a single patch to confirm, or a refusal. Does NOT
 * apply anything and does NOT write a ledger — the caller applies the patch only
 * after the author confirms it.
 */
export function nudge(config: NudgeConfig, req: NudgeRequest): NudgeResult {
  const before = req.text.slice(req.span.start, req.span.end);
  const after = req.replacement;

  if (after === before) {
    return { status: 'noop', reason: 'Replacement is identical to the current text.' };
  }

  // Anchor freeze first — mirrors resolvePolicy's invariant.
  const anchors = config.anchors ?? [];
  const overlapsAnchor = anchors.some((a) => overlaps(req.span, a));
  const policy = resolvePolicy(req.category, config.profile, overlapsAnchor);

  if (overlapsAnchor) {
    return {
      status: 'refused-anchor',
      reason: 'The targeted span overlaps a frozen anchor (claim / number / thesis) and cannot be edited.',
    };
  }

  if (policy.verdict === 'author-required') {
    return {
      status: 'refused-author-required',
      reason: `Category "${req.category}" is author-required under this profile; Nudge will not auto-change it.`,
    };
  }

  if (!withinBound(before, after, policy.maxDiff)) {
    return {
      status: 'refused-out-of-bound',
      reason: `Change exceeds the ${req.category} diff bound (${policy.maxDiff}); Nudge keeps edits minimal.`,
    };
  }

  // Build the would-be text and VERIFY with the same primitive the engine uses.
  const preview = req.text.slice(0, req.span.start) + after + req.text.slice(req.span.end);
  const newSpan: Span = { start: req.span.start, end: req.span.start + after.length };

  // Adapt NudgeConfig to the EngineConfig shape verifyEdit expects.
  const engineView = { profile: config.profile, guards: config.guards } as EngineConfig;
  const issueView = {
    category: req.category,
    span: req.span,
    severity: 'minor' as const,
    rationale: 'nudge',
    text: before,
  };

  // Nudge is a single explicit MECHANICAL patch preview — synchronous, no network,
  // no meaning gate. Use the deterministic gate directly (not the async verifyEdit).
  const ok = verifyMechanicalEdit(
    engineView,
    issueView,
    newSpan,
    preview,
    before,
    after,
    policy.maxDiff,
  );
  if (!ok) {
    return {
      status: 'refused-verify',
      reason: 'The edited span still fails its guard after the change; Nudge will not offer an unverified patch.',
    };
  }

  return {
    status: 'ready',
    patch: { span: req.span, before, after, preview },
    reason: 'Single verified patch ready — confirm to apply.',
  };
}
