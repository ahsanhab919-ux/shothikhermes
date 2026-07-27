/**
 * Re-educator — SemanticProvider contract + adapter (Phase 2 #2).
 *
 * Phase 2 #1 made the `SemanticReviewer` seam async: `(text) => Promise<Issue[]>`.
 * That seam is deliberately minimal — the engine only knows "given the text,
 * hand me back semantic issues". It says nothing about WHERE those issues come
 * from or HOW the caller is kept safe from a misbehaving model.
 *
 * This file adds the layer that a real provider plugs into. Two pieces:
 *
 *   1. `SemanticProvider` — the interface every model adapter (OpenAI, Anthropic,
 *      a fake, a future third provider) implements. It takes a RICHER input than
 *      the bare seam: `{ text, spans, writingMd }`. `spans` are the candidate
 *      spans the deterministic pass already flagged — the provider is only ever
 *      shown these, never the whole document to freely re-review. `writingMd` is
 *      the voice/rules context (§3 semantic review reads WRITING.md).
 *
 *   2. `providerToReviewer` — the ADAPTER-LAYER ENFORCEMENT (spec §7a, §8). It
 *      bridges a `SemanticProvider` down to the `SemanticReviewer` seam the
 *      engine consumes, and in doing so it enforces the two invariants a raw
 *      model call cannot be trusted to honour:
 *
 *        - INPUT scoping: the provider only sees candidate spans, not free rein
 *          over the text. (The candidate set is computed by the caller — Phase 2
 *          #6 wires it to the deterministic issue spans; here it is injected.)
 *        - OUTPUT validation: every issue the provider returns is validated and
 *          CLAMPED to a real span in the text before it is allowed into the
 *          pipeline. Fail-closed — an issue whose span is out of bounds, inverted,
 *          empty, or whose category/severity is not in our vocabulary is DROPPED,
 *          never repaired-into-existence. A model cannot invent a finding at a
 *          location that does not exist, nor smuggle in an off-vocabulary verdict.
 *
 * The engine, modes, route and ledger are untouched: this composes with the
 * existing seam. A provider is turned into a `SemanticReviewer` and passed as
 * the same `semanticReview` field that Phase 2 #1 already threads everywhere.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 (semantic review), §7a/§8 (adapter-layer
 * enforcement, fail-closed), §7b#2 (this step).
 */

import type { Issue, IssueCategory, Severity, Span } from './types';

/** The categories a semantic provider is allowed to emit. The provider adds
 * judgment-shaped findings; mechanical categories (terminology, links) stay the
 * deterministic guards' job. Anything outside this set is dropped by the adapter. */
export const SEMANTIC_CATEGORIES: readonly IssueCategory[] = [
  'clarity',
  'voice-drift',
  'unsupported-assertion',
] as const;

const SEMANTIC_CATEGORY_SET = new Set<string>(SEMANTIC_CATEGORIES);
const SEVERITY_SET = new Set<string>(['info', 'minor', 'major'] satisfies Severity[]);

/** The input a provider is handed for one review call. Richer than the bare
 * seam so a provider gets the context it needs — but still scoped. */
export interface SemanticProviderInput {
  /** The authoritative manuscript text (markers already stripped upstream). */
  text: string;
  /** Candidate spans the provider may reason about. The provider is shown ONLY
   * these regions; it must not report findings outside them. Empty ⇒ the
   * provider is given nothing to do and should return no issues. */
  spans: Span[];
  /** WRITING.md context (voice, rules, thesis) the semantic review reads. May be
   * absent when the caller has no WRITING.md to supply. */
  writingMd?: string;
}

/**
 * Every model adapter implements this. `name` is recorded on emitted issues'
 * `source` so the ledger/VERIFY can attribute them. `review` is the one call:
 * scoped input in, semantic issues out. Implementations MAY be flaky (network);
 * the adapter that wraps them is responsible for fail-closed behaviour.
 */
export interface SemanticProvider {
  /** Stable identifier, e.g. "openai", "anthropic", "fake". */
  readonly name: string;
  review(input: SemanticProviderInput): Promise<Issue[]>;
}

/** True if two spans overlap at all. Half-open [start,end). */
function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Validate + clamp one raw issue from a provider against the real text and the
 * allowed candidate spans. Returns a well-formed Issue, or `null` to DROP it.
 *
 * Fail-closed rules (spec §8):
 *   - span must be integer, in-bounds [0, len], start < end (non-empty).
 *   - span must overlap at least one candidate span (the provider may not report
 *     outside the region it was shown).
 *   - category must be an allowed SEMANTIC category; severity in our vocabulary.
 *   - `text` is re-derived from the source at the (validated) span — we never
 *     trust the provider's echo of the text, and we never let it claim an edit.
 */
export function validateProviderIssue(
  raw: unknown,
  sourceText: string,
  candidateSpans: Span[],
  providerName: string,
): Issue | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const span = r.span;
  if (typeof span !== 'object' || span === null) return null;
  const s = span as Record<string, unknown>;
  const start = s.start;
  const end = s.end;
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || end > sourceText.length || start >= end) return null;

  const clamped: Span = { start, end };
  // The provider must report inside the region it was shown. If it was shown
  // nothing (no candidate spans), nothing can pass — nothing to do.
  if (!candidateSpans.some((c) => overlaps(clamped, c))) return null;

  if (typeof r.category !== 'string' || !SEMANTIC_CATEGORY_SET.has(r.category)) return null;
  const category = r.category as IssueCategory;

  const severity =
    typeof r.severity === 'string' && SEVERITY_SET.has(r.severity)
      ? (r.severity as Severity)
      : 'minor';

  const rationale = typeof r.rationale === 'string' ? r.rationale : '';

  // We never trust the provider's echo of the flagged text — re-derive it from
  // the source at the validated span so `issue.text` is always ground truth.
  const text = sourceText.slice(clamped.start, clamped.end);

  // A provider MAY offer a suggestion, but only as a `propose`-able draft. We
  // keep it as a plain string when present; the engine's VERDICT/REVISE stages
  // decide (via the profile + anchors) whether it is ever applied. It is never
  // auto-applied just because the model suggested it.
  const suggestion = typeof r.suggestion === 'string' ? r.suggestion : undefined;

  return {
    category,
    span: clamped,
    severity,
    rationale,
    text,
    suggestion,
    source: providerName,
  };
}

/**
 * Hard cost caps for one semantic review call (Phase 2 #6, spec §4a).
 * Deterministic and honest: we bound what reaches the model by SPAN COUNT and
 * TOTAL CHARACTERS, not by a fabricated token estimate we cannot make match a
 * provider's own tokenizer. Applied by `applyCaps` BEFORE any network call.
 */
export interface ProviderCaps {
  /** Max number of candidate spans shown to the model. Extra spans are dropped
   * (lowest-start-first kept). Non-positive/absent ⇒ no span-count cap. */
  maxSpans?: number;
  /** Max total characters (summed span lengths) shown to the model. Spans are
   * kept in order until the budget is exhausted; the span that would overflow is
   * dropped whole (never truncated mid-span — a partial span would let the model
   * reason about a fragment). Non-positive/absent ⇒ no char cap. */
  maxChars?: number;
}

/**
 * The default caps a run uses when the caller supplies none. Conservative but
 * generous enough for ordinary manuscripts; a caller may override either field.
 */
export const DEFAULT_PROVIDER_CAPS: Required<ProviderCaps> = {
  maxSpans: 40,
  maxChars: 12000,
};

/** How many characters a span covers. Clamped to >= 0 for safety. */
function spanLength(s: Span): number {
  return Math.max(0, s.end - s.start);
}

/**
 * Apply the hard caps to a candidate-span set, deterministically. Pure: returns
 * a NEW array and never mutates the input. Spans are considered in ascending
 * start order (stable, document order) so the result is reproducible. A span is
 * kept only if it fits under BOTH the running span-count and char budgets; the
 * first span that would overflow the char budget is dropped whole and later
 * spans are still considered (a shorter later span may still fit). Zero-length
 * spans are dropped (nothing for the model to read).
 */
export function applyCaps(spans: Span[], caps: ProviderCaps = {}): Span[] {
  const maxSpans = caps.maxSpans && caps.maxSpans > 0 ? caps.maxSpans : Infinity;
  const maxChars = caps.maxChars && caps.maxChars > 0 ? caps.maxChars : Infinity;
  const ordered = [...spans]
    .filter((s) => spanLength(s) > 0)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const kept: Span[] = [];
  let usedChars = 0;
  for (const s of ordered) {
    if (kept.length >= maxSpans) break;
    const len = spanLength(s);
    if (usedChars + len > maxChars) continue; // drop whole; a later shorter span may fit
    kept.push(s);
    usedChars += len;
  }
  return kept;
}

/**
 * A usage record for one semantic review call (Phase 2 #6). Recorded in the
 * ledger meta so every run that spent tokens is auditable. NEVER contains the
 * key or any manuscript text — only the provider name and the bounded shape of
 * what was sent (post-cap span count + total chars). `capped` is true iff the
 * caps dropped at least one candidate span.
 */
export interface SemanticUsage {
  provider: string;
  spansReviewed: number;
  charsSent: number;
  capped: boolean;
}

/**
 * Options for the adapter. `candidateSpans` are the regions the provider is
 * allowed to see and report on. In Phase 2 #2 the caller injects them (tests
 * pass explicit spans); Phase 2 #6 wires them to caller-supplied regions of
 * interest (falling back to the whole document) so only bounded, already-scoped
 * regions ever reach the model (the cost + safety win in §4a/§8). `writingMd` is
 * the optional voice/rules context. `caps` bounds span count + chars per call;
 * absent ⇒ `DEFAULT_PROVIDER_CAPS`.
 */
export interface ProviderAdapterOptions {
  candidateSpans: Span[];
  writingMd?: string;
  caps?: ProviderCaps;
  /** Optional sink invoked once per review call with the (post-cap) usage. Lets
   * the caller surface usage in the ledger without the reviewer returning it out
   * of the `(text) => Issue[]` seam. Never receives the key or text. */
  onUsage?: (usage: SemanticUsage) => void;
}

/**
 * ADAPTER: turn a `SemanticProvider` into the `SemanticReviewer` seam the engine
 * consumes — `(text) => Promise<Issue[]>` — enforcing input scoping and
 * fail-closed output validation between the model and the pipeline.
 *
 * - Input: the provider is shown ONLY `options.candidateSpans`. If that set is
 *   empty, the provider is never called and no issues are returned (nothing to
 *   review — save the token spend).
 * - Output: every returned issue is run through `validateProviderIssue`;
 *   anything that fails is DROPPED. A provider that throws or rejects (flaky
 *   network, bad key) fails closed to `[]` — the run continues deterministic-only
 *   and never crashes on a model call (spec §7b#3 preview; the invariant lives
 *   here so every adapter inherits it).
 */
export function providerToReviewer(
  provider: SemanticProvider,
  options: ProviderAdapterOptions,
): (text: string) => Promise<Issue[]> {
  const requested = options.candidateSpans ?? [];
  const caps = options.caps ?? DEFAULT_PROVIDER_CAPS;
  // Apply the hard caps ONCE, at construction, so the same bounded set is used
  // for the call and the usage record. Deterministic; never mutates the input.
  const candidateSpans = applyCaps(requested, caps);
  return async (text: string): Promise<Issue[]> => {
    if (candidateSpans.length === 0) {
      // Nothing to review after capping (empty input, or every span zero-length).
      options.onUsage?.({
        provider: provider.name,
        spansReviewed: 0,
        charsSent: 0,
        capped: requested.length > 0,
      });
      return [];
    }
    // Report usage BEFORE the network call: it reflects what we are about to
    // send, and is recorded even if the provider then fails closed.
    const charsSent = candidateSpans.reduce((n, s) => n + Math.max(0, s.end - s.start), 0);
    options.onUsage?.({
      provider: provider.name,
      spansReviewed: candidateSpans.length,
      charsSent,
      capped: candidateSpans.length < requested.filter((s) => s.end > s.start).length,
    });
    let raw: Issue[];
    try {
      raw = await provider.review({ text, spans: candidateSpans, writingMd: options.writingMd });
    } catch {
      // Fail closed: a provider error must never break the deterministic run.
      return [];
    }
    if (!Array.isArray(raw)) return [];
    const validated: Issue[] = [];
    for (const item of raw) {
      const issue = validateProviderIssue(item, text, candidateSpans, provider.name);
      if (issue) validated.push(issue);
    }
    return validated;
  };
}

/**
 * A no-network fake provider for tests and local wiring. It returns a fixed list
 * of issues (as if a model had produced them), so the whole semantic path — the
 * async seam, the adapter validation, the engine's VERDICT/REVISE/VERIFY — can be
 * exercised deterministically with zero token spend.
 *
 * Pass `issues` to control exactly what it "finds" (including deliberately
 * malformed ones, to prove the adapter drops them). Pass `throwError` to simulate
 * a provider failure and prove the adapter fails closed.
 */
export function fakeProvider(opts: {
  name?: string;
  issues?: unknown[];
  throwError?: boolean;
} = {}): SemanticProvider {
  const { name = 'fake', issues = [], throwError = false } = opts;
  return {
    name,
    async review(_input: SemanticProviderInput): Promise<Issue[]> {
      if (throwError) throw new Error('fake provider failure');
      // Cast: the fake may deliberately return malformed items so the adapter's
      // validation can be tested. The adapter treats provider output as untrusted.
      return issues as Issue[];
    },
  };
}
