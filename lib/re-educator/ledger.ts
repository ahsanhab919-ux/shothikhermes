/**
 * Re-educator — append-only, hash-chained ledger (Phase 0).
 *
 * The verification spine (RE-EDUCATOR-SPEC.md §5). Every issue the engine acts
 * on becomes one entry: the source span, the verdict, the before/after edit, and
 * the guard's verify scores. Each entry carries the hash of the previous entry,
 * so any later tampering with an earlier entry breaks the chain — tamper-evident,
 * exactly the concord + paperjury pattern.
 *
 * This module is PURE + deterministic: same inputs (and same genesis seed) always
 * produce the same hashes. It performs no I/O; persistence is a later concern. It
 * runs server-side (Next.js API route, §6), so node:crypto sha256 is used with no
 * extra dependency.
 */

import { createHash } from 'node:crypto';
import type { IssueCategory, Severity, Span } from './types';
import type { Verdict } from './profiles';

/** The recorded edit for an entry. `after === before` is allowed (no-op / flag-only). */
export interface LedgerEdit {
  before: string;
  after: string;
  reason: string;
}

/** The guard verification result attached to an entry. */
export interface LedgerVerify {
  /** Guard that verified the edit, e.g. "voice-drift". */
  guard: string;
  /** Optional numeric scores before/after the edit (guard-specific scale). */
  before_score?: number;
  after_score?: number;
  result: 'pass' | 'fail';
}

/** The chain-independent payload of an entry (everything the hash commits to). */
export interface LedgerEntryInput {
  issue_id: string;
  span: Span;
  category: IssueCategory;
  severity: Severity;
  verdict: Verdict;
  edit: LedgerEdit;
  verify: LedgerVerify;
}

/** A committed entry: its payload plus the chain links. */
export interface LedgerEntry extends LedgerEntryInput {
  /** Hash of the entry immediately before this one (genesis hash for the first). */
  prev_hash: string;
  /** sha256 over { prev_hash, ...payload } in canonical form. */
  hash: string;
}

export interface LedgerMeta {
  manuscript: string;
  /** Hash/version tag of the WRITING.md the review ran against. */
  writing_md_version: string;
  /** Frozen-anchor spans that no edit may touch (mirrors resolvePolicy). */
  anchors: Span[];
}

/**
 * Observational usage metadata for a run (Phase 2 #6). This is a SIBLING of the
 * authenticated chain, deliberately OUTSIDE `meta` and OUTSIDE the hash: the
 * chain authenticates what was decided (manuscript, anchors, edits), not what it
 * cost to decide. Recording usage in `meta` would change the genesis hash after
 * the chain was already built and break verification, so it lives here instead.
 * NEVER contains the BYOK key or manuscript text — only the bounded shape of what
 * reached the model (provider, post-cap span count + chars). Absent for a
 * deterministic-only run (no semantic provider was invoked).
 */
export interface LedgerUsage {
  provider: string;
  spans_reviewed: number;
  chars_sent: number;
  capped: boolean;
  /** The model handle, when the caller supplied one (else the adapter default
   * was used and this is omitted). Never the key. */
  model?: string;
}

export interface LedgerData {
  meta: LedgerMeta;
  entries: LedgerEntry[];
  /** Optional per-run semantic usage (Phase 2 #6). Outside the hash chain. */
  usage?: LedgerUsage;
}

/**
 * Genesis hash — the `prev_hash` of the first entry. Derived from meta so that
 * two ledgers over different manuscripts never share a chain root.
 */
export const GENESIS_PREFIX = 're-educator:genesis:';

/**
 * Canonical JSON: object keys sorted recursively, no incidental whitespace.
 * This is what makes the hash reproducible regardless of key insertion order.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortDeep(obj[key]);
    }
    return out;
  }
  return value;
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** The genesis hash for a given meta block. Deterministic. */
export function genesisHash(meta: LedgerMeta): string {
  return sha256(GENESIS_PREFIX + canonicalize(meta));
}

/**
 * Compute the hash an entry must carry: sha256 over its payload plus prev_hash.
 * Payload is taken explicitly (not the whole entry) so re-hashing an existing
 * entry reproduces its stored `hash`.
 */
export function computeEntryHash(prevHash: string, payload: LedgerEntryInput): string {
  return sha256(canonicalize({ prev_hash: prevHash, payload }));
}

/** Start a fresh ledger for a manuscript. */
export function createLedger(meta: LedgerMeta): LedgerData {
  return { meta, entries: [] };
}

/**
 * Append one entry, chaining it to the current tip. Returns a NEW ledger object
 * (the input is not mutated) — append-only semantics are enforced by construction.
 */
export function appendEntry(ledger: LedgerData, input: LedgerEntryInput): LedgerData {
  const prev_hash =
    ledger.entries.length === 0
      ? genesisHash(ledger.meta)
      : ledger.entries[ledger.entries.length - 1].hash;

  const hash = computeEntryHash(prev_hash, input);
  const entry: LedgerEntry = { ...input, prev_hash, hash };

  return { meta: ledger.meta, entries: [...ledger.entries, entry] };
}

export interface ChainVerification {
  valid: boolean;
  /** Index of the first entry that fails, or -1 if the chain is intact. */
  brokenAt: number;
  reason?: string;
}

/**
 * Walk the chain and confirm every link. Detects: a wrong genesis root, a
 * prev_hash that doesn't match the actual previous entry, and any entry whose
 * stored hash doesn't match a recomputation of its payload (tampering).
 */
export function verifyChain(ledger: LedgerData): ChainVerification {
  const expectedGenesis = genesisHash(ledger.meta);

  for (let i = 0; i < ledger.entries.length; i++) {
    const entry = ledger.entries[i];
    const expectedPrev = i === 0 ? expectedGenesis : ledger.entries[i - 1].hash;

    if (entry.prev_hash !== expectedPrev) {
      return { valid: false, brokenAt: i, reason: 'prev_hash mismatch (chain break)' };
    }

    const { prev_hash: _p, hash: _h, ...payload } = entry;
    const recomputed = computeEntryHash(entry.prev_hash, payload);
    if (recomputed !== entry.hash) {
      return { valid: false, brokenAt: i, reason: 'entry hash mismatch (tampered payload)' };
    }
  }

  return { valid: true, brokenAt: -1 };
}
