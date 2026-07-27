/**
 * Re-educator service layer (Phase 1) — the pure seam between the HTTP route
 * and the engine/modes.
 *
 * The route (src/app/api/re-educator/route.ts) is deliberately thin: it does
 * auth, parses the body, calls `runReEducator` here, persists the ledger, and
 * serialises the result. Everything decision-shaped lives in this file so it
 * can be unit-tested with no HTTP and no Mongo.
 *
 * Phase 0 gave us the engine, the four modes, the guards and the ledger. This
 * layer only *composes* them:
 *   - builds the default deterministic guard set (readability/terminology/
 *     links/pii/voice-drift) as RegisteredGuard[],
 *   - dispatches by mode to the matching Phase-0 entrypoint,
 *   - forwards an optional SemanticReviewer (Phase 0 leaves it undefined — the
 *     pass-through reviewer — so this stays fully deterministic; Phase 2 BYOK
 *     supplies a real one with NO change here: one field, no rework).
 *
 * Spec: RE-EDUCATOR-SPEC.md §4 (modes), §6 (s5 integration).
 */

import type { Issue, IssueCategory, Span } from './types';
import { STANDARD } from './profiles';
import { parseAnchors, hasAnchorMarkers, AnchorSyntaxError, type ParsedAnchors } from './anchors';
import type { LedgerData, LedgerMeta } from './ledger';
import { genesisHash } from './ledger';
import type { RegisteredGuard, SemanticReviewer } from './engine';
import type { MeaningVerifier } from './entailment';
import {
  readability,
  terminology,
  links,
  pii,
  voiceDrift,
  type TerminologyRule,
  type VoiceProfile,
} from './guards';
import { review, type ReviewResult } from './modes/review';
import { nudge, type NudgeResult, type NudgeRequest } from './modes/nudge';
import { auto, type AutoResult, type AutoAuthorization } from './modes/auto';
import { paraphrase, type ParaphraseResult } from './modes/paraphrase';

/** The four callable modes, exactly as build-order §7 named them. */
export type ReEducatorMode = 'nudge' | 'review' | 'auto' | 'paraphrase';

export const RE_EDUCATOR_MODES: readonly ReEducatorMode[] = [
  'nudge',
  'review',
  'auto',
  'paraphrase',
] as const;

/**
 * Optional per-request tuning for the default guard set. All optional so a bare
 * `{ text, mode }` request Just Works with sensible defaults.
 */
export interface GuardOptions {
  terminologyRules?: TerminologyRule[];
  voiceProfile?: VoiceProfile;
}

/**
 * Build the default deterministic guard set as RegisteredGuard[]. Pure: no I/O.
 * Terminology and voice-drift are only registered when the caller supplied the
 * data they need (rules / a voice profile) — a guard with nothing to check
 * would only produce noise.
 */
export function defaultGuards(opts: GuardOptions = {}): RegisteredGuard[] {
  const guards: RegisteredGuard[] = [
    { name: 'readability', category: 'readability', run: readability as RegisteredGuard['run'] },
    { name: 'links', category: 'links', run: links as RegisteredGuard['run'] },
    { name: 'pii', category: 'pii', run: pii as RegisteredGuard['run'] },
  ];

  if (opts.terminologyRules && opts.terminologyRules.length > 0) {
    guards.push({
      name: 'terminology',
      category: 'terminology',
      run: terminology as RegisteredGuard['run'],
      ctx: { rules: opts.terminologyRules },
    });
  }

  if (opts.voiceProfile) {
    guards.push({
      name: 'voice-drift',
      category: 'voice-drift',
      run: voiceDrift as RegisteredGuard['run'],
      ctx: opts.voiceProfile,
    });
  }

  return guards;
}

/** Ledger meta for a run. `writingMdVersion` tags the WRITING.md it ran against
 * (Phase 1 #3 will populate it from Letta; until then callers pass 'none'). */
export function buildMeta(
  manuscript: string,
  anchors: Span[],
  writingMdVersion: string,
): LedgerMeta {
  return { manuscript, writing_md_version: writingMdVersion, anchors };
}

/**
 * The mode-specific extras a request may carry. Each is only meaningful for its
 * own mode; the dispatcher reads exactly the ones its mode needs and ignores
 * the rest, so the wire payload can stay a flat object.
 */
export interface ReEducatorRequest {
  text: string;
  mode: ReEducatorMode;
  /** Frozen anchors — spans no edit may touch (claims/numbers/thesis). */
  anchors?: Span[];
  /** Caller-supplied regions of interest that scope what the semantic provider
   * is shown (Phase 2 #6, spec §4a). Absent/empty ⇒ the whole document is the
   * candidate region (still hard-capped by the adapter). Deterministic-only runs
   * ignore this. */
  candidateSpans?: Span[];
  /** Guard tuning (terminology rules, voice profile). */
  guardOptions?: GuardOptions;
  /** WRITING.md version tag for the ledger meta. Defaults to 'none'. */
  writingMdVersion?: string;
  /** Optional semantic reviewer. Phase 0/1: undefined (pass-through). */
  semanticReview?: SemanticReviewer;
  /** Optional meaning-preservation verifier (Phase 2 #5). Undefined ⇒ semantic
   * edits cannot pass the meaning gate; mechanical edits are unaffected. */
  meaningVerifier?: MeaningVerifier;

  // --- nudge only ---
  nudge?: NudgeRequest;

  // --- auto only ---
  auto?: {
    optIn: boolean;
    authorization: AutoAuthorization | null;
    quietRoundsToStop?: number;
    maxRounds?: number;
  };
}

/**
 * A single, uniform result envelope over the four modes. `mode` says which
 * branch ran; `ledger` is always present (Nudge, which writes no ledger of its
 * own, gets an empty-chain ledger over its meta so the persistence path and the
 * response shape are uniform). `result` is the raw mode result for callers that
 * want the full detail.
 */
export type ReEducatorResult =
  | { mode: 'nudge'; ledger: LedgerData; result: NudgeResult }
  | { mode: 'review'; ledger: LedgerData; result: ReviewResult }
  | { mode: 'auto'; ledger: LedgerData; result: AutoResult }
  | { mode: 'paraphrase'; ledger: LedgerData; result: ParaphraseResult };

/** An empty (genesis-only) ledger over `meta` — used for modes that do not
 * write their own chain (Nudge), so the response/persistence shape is uniform. */
function emptyLedger(meta: LedgerMeta): LedgerData {
  // genesisHash is derived from meta; entries stay empty. verifyChain treats an
  // empty entries array as trivially valid.
  void genesisHash;
  return { meta, entries: [] };
}

/**
 * Run the Re-educator over a request. Pure with respect to I/O: it composes the
 * Phase-0 engine/modes and returns a result. The caller persists the ledger.
 *
 * Delegates each mode to its Phase-0 entrypoint with the shared guard set and
 * meta. Paraphrase forces its own profile internally; the others take STANDARD.
 */
export async function runReEducator(req: ReEducatorRequest): Promise<ReEducatorResult> {
  const anchors = req.anchors ?? [];
  const guards = defaultGuards(req.guardOptions);
  const meta = buildMeta(req.text, anchors, req.writingMdVersion ?? 'none');

  switch (req.mode) {
    case 'nudge': {
      if (!req.nudge) {
        throw new ReEducatorRequestError(
          'nudge mode requires a "nudge" request object (span + replacement).',
        );
      }
      const result = nudge({ profile: STANDARD, guards, anchors }, req.nudge);
      // Nudge writes no ledger; return an empty chain over meta for uniformity.
      return { mode: 'nudge', ledger: emptyLedger(meta), result };
    }

    case 'review': {
      const result = await review(
        {
          profile: STANDARD,
          guards,
          anchors,
          semanticReview: req.semanticReview,
          meaningVerifier: req.meaningVerifier,
          meta,
        },
        req.text,
      );
      return { mode: 'review', ledger: result.ledger, result };
    }

    case 'auto': {
      if (!req.auto) {
        throw new ReEducatorRequestError(
          'auto mode requires an "auto" object with optIn + authorization.',
        );
      }
      const result = await auto(
        {
          profile: STANDARD,
          guards,
          semanticReview: req.semanticReview,
          meaningVerifier: req.meaningVerifier,
          meta,
          quietRoundsToStop: req.auto.quietRoundsToStop,
          maxRounds: req.auto.maxRounds,
        },
        {
          text: req.text,
          optIn: req.auto.optIn,
          authorization: req.auto.authorization,
        },
      );
      return { mode: 'auto', ledger: result.ledger, result };
    }

    case 'paraphrase': {
      const result = await paraphrase(
        {
          guards,
          anchors,
          semanticReview: req.semanticReview,
          meaningVerifier: req.meaningVerifier,
          meta,
        },
        req.text,
      );
      return { mode: 'paraphrase', ledger: result.ledger, result };
    }

    default: {
      // Exhaustiveness: if a new mode is added to the union this fails to compile.
      const never: never = req.mode;
      throw new ReEducatorRequestError(`unknown mode: ${String(never)}`);
    }
  }
}

/** Thrown for caller-fixable bad requests (maps to HTTP 400 in the route). */
export class ReEducatorRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReEducatorRequestError';
  }
}

/**
 * Validate + normalise an untrusted JSON body into a ReEducatorRequest.
 * Throws ReEducatorRequestError (=> HTTP 400) on anything malformed. Kept here
 * (not in the route) so it is unit-testable without HTTP.
 */
export function parseRequest(body: unknown): ReEducatorRequest {
  if (typeof body !== 'object' || body === null) {
    throw new ReEducatorRequestError('Body must be a JSON object.');
  }
  const b = body as Record<string, unknown>;

  if (typeof b.text !== 'string') {
    throw new ReEducatorRequestError('Body must include a string "text" field.');
  }
  if (typeof b.mode !== 'string' || !RE_EDUCATOR_MODES.includes(b.mode as ReEducatorMode)) {
    throw new ReEducatorRequestError(
      `Body "mode" must be one of: ${RE_EDUCATOR_MODES.join(', ')}.`,
    );
  }

  const mode = b.mode as ReEducatorMode;
  const explicitAnchors = parseSpans(b.anchors, 'anchors');

  // Resolve inline `.anchor {...}` markers (spec §7a). If present, the CLEANED
  // text (markers stripped) becomes the authoritative manuscript, and the parsed
  // anchor spans (offsets into that cleaned text) are merged with any explicit
  // anchors the caller also passed. Markers are a convenience layer that resolves
  // to the exact same frozen-anchor set the engine already consumes.
  let text = b.text;
  let anchors = explicitAnchors;
  if (hasAnchorMarkers(b.text)) {
    let parsed: ParsedAnchors;
    try {
      parsed = parseAnchors(b.text);
    } catch (e) {
      if (e instanceof AnchorSyntaxError) throw new ReEducatorRequestError(e.message);
      throw e;
    }
    text = parsed.text;
    anchors = mergeAnchors(explicitAnchors, parsed.anchors);
  }

  const candidateSpans = parseSpans(b.candidateSpans, 'candidateSpans');

  const req: ReEducatorRequest = {
    text,
    mode,
    anchors,
    candidateSpans: candidateSpans.length > 0 ? candidateSpans : undefined,
    writingMdVersion: typeof b.writingMdVersion === 'string' ? b.writingMdVersion : undefined,
    guardOptions: parseGuardOptions(b.guardOptions),
  };

  if (mode === 'nudge') {
    // Nudge span offsets are relative to the (possibly cleaned) authoritative text.
    req.nudge = parseNudge(b.nudge, text);
  }
  if (mode === 'auto') {
    req.auto = parseAuto(b.auto);
  }

  return req;
}

/** Merge two anchor lists, dropping exact duplicates. Order-stable: explicit
 * anchors first, then parsed ones not already present. The engine treats anchors
 * as an unordered overlap set, so this is purely for tidy, deterministic output. */
function mergeAnchors(explicit: Span[], parsed: Span[]): Span[] {
  const seen = new Set(explicit.map((s) => `${s.start}:${s.end}`));
  const merged = [...explicit];
  for (const s of parsed) {
    const key = `${s.start}:${s.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  }
  return merged;
}

function parseSpans(value: unknown, field: string): Span[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ReEducatorRequestError(`"${field}" must be an array of {start,end} spans.`);
  }
  return value.map((s, i) => {
    if (
      typeof s !== 'object' ||
      s === null ||
      typeof (s as Record<string, unknown>).start !== 'number' ||
      typeof (s as Record<string, unknown>).end !== 'number'
    ) {
      throw new ReEducatorRequestError(`"${field}[${i}]" must be {start:number,end:number}.`);
    }
    const span = s as { start: number; end: number };
    if (span.start < 0 || span.end < span.start) {
      throw new ReEducatorRequestError(`"${field}[${i}]" must satisfy 0 <= start <= end.`);
    }
    return { start: span.start, end: span.end };
  });
}

function parseGuardOptions(value: unknown): GuardOptions | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object') {
    throw new ReEducatorRequestError('"guardOptions" must be an object.');
  }
  const v = value as Record<string, unknown>;
  const opts: GuardOptions = {};
  if (v.terminologyRules !== undefined) {
    if (!Array.isArray(v.terminologyRules)) {
      throw new ReEducatorRequestError('"guardOptions.terminologyRules" must be an array.');
    }
    opts.terminologyRules = v.terminologyRules as TerminologyRule[];
  }
  if (v.voiceProfile !== undefined) {
    if (typeof v.voiceProfile !== 'object' || v.voiceProfile === null) {
      throw new ReEducatorRequestError('"guardOptions.voiceProfile" must be an object.');
    }
    opts.voiceProfile = v.voiceProfile as VoiceProfile;
  }
  return opts;
}

const NUDGE_CATEGORIES: readonly IssueCategory[] = [
  'terminology',
  'links',
  'readability',
  'voice-drift',
  'clarity',
  'unsupported-assertion',
  'pii',
];

function parseNudge(value: unknown, text: string): NudgeRequest {
  if (typeof value !== 'object' || value === null) {
    throw new ReEducatorRequestError('nudge mode requires a "nudge" object.');
  }
  const v = value as Record<string, unknown>;
  const [span] = parseSpans([v.span], 'nudge.span');
  if (typeof v.replacement !== 'string') {
    throw new ReEducatorRequestError('"nudge.replacement" must be a string.');
  }
  if (typeof v.category !== 'string' || !NUDGE_CATEGORIES.includes(v.category as IssueCategory)) {
    throw new ReEducatorRequestError(
      `"nudge.category" must be one of: ${NUDGE_CATEGORIES.join(', ')}.`,
    );
  }
  // The engine needs the full source text on the nudge request; the top-level
  // `text` is authoritative, so we thread it through rather than trust a copy.
  return {
    text,
    span,
    replacement: v.replacement,
    category: v.category as IssueCategory,
  };
}

function parseAuto(value: unknown): ReEducatorRequest['auto'] {
  if (typeof value !== 'object' || value === null) {
    throw new ReEducatorRequestError('auto mode requires an "auto" object.');
  }
  const v = value as Record<string, unknown>;
  if (typeof v.optIn !== 'boolean') {
    throw new ReEducatorRequestError('"auto.optIn" must be a boolean.');
  }
  // authorization may be null (a valid "refused" path) or an object.
  const authorization =
    v.authorization === null ? null : (v.authorization as AutoAuthorization);
  return {
    optIn: v.optIn,
    authorization,
    quietRoundsToStop:
      typeof v.quietRoundsToStop === 'number' ? v.quietRoundsToStop : undefined,
    maxRounds: typeof v.maxRounds === 'number' ? v.maxRounds : undefined,
  };
}

// Re-exported for the route + tests so they need only one import site.
export type { LedgerData, Issue, IssueCategory, Span };
