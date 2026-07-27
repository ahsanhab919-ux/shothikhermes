/**
 * Re-educator — shared types (Phase 0).
 *
 * The Re-educator reviews a piece of writing against explicit rules, issues a
 * verdict per issue, proposes bounded edits, and verifies each edit. This file
 * holds the vocabulary shared by the deterministic guards (no LLM) and, later,
 * the semantic stages.
 *
 * Spec: docs/RE-EDUCATOR-SPEC.md (§3 four-stage engine, §4b verdict profiles).
 */

/** The categories an issue can belong to. Guards emit a subset of these. */
export type IssueCategory =
  | 'terminology'
  | 'links'
  | 'readability'
  | 'voice-drift'
  | 'clarity'
  | 'unsupported-assertion'
  | 'pii';

export type Severity = 'info' | 'minor' | 'major';

/** A character span in the source text: [start, end). */
export interface Span {
  start: number;
  end: number;
}

/**
 * One finding. Deterministic guards produce these with a concrete `rationale`
 * and, where safe, a `suggestion` for the mechanical fix. Semantic stages add
 * their own issues later. `id` is assigned by the engine, not the guard.
 */
export interface Issue {
  id?: string;
  category: IssueCategory;
  span: Span;
  severity: Severity;
  /** Human-readable reason the guard flagged this span. */
  rationale: string;
  /** The exact text at `span` (convenience; guards fill it in). */
  text: string;
  /** Optional mechanical replacement the REVISE stage may apply verbatim. */
  suggestion?: string;
  /** Guard that produced this issue, e.g. "readability". Set by the guard. */
  source?: string;
}

/**
 * A guard is a PURE function: text (+ optional profile context) -> issues.
 * No I/O, no network, no LLM. Deterministic: same input, same output.
 */
export type Guard<Ctx = unknown> = (text: string, ctx?: Ctx) => Issue[];
