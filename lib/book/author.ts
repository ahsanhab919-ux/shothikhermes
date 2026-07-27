/**
 * Book Authoring — chapter loop orchestrator (Track D, Step D3 of
 * BOOK-AUTHORING-SPEC.md §5). The net-new heart of the track.
 *
 * Given a chapter plan and a story bible (D2), generate each chapter, verify it
 * through the Re-educator done-gate we already own, regenerate on failure up to a
 * bound, and — only when a chapter passes — save it and fold its summary back
 * into the bible. This is the loop that makes long-form coherent: state lives in
 * the bible, not the prompt.
 *
 * Design (senior-dev):
 *  - PURE control flow with INJECTED dependencies. The two effectful pieces — the
 *    model call (`generateChapter`) and the done-gate (`verifyChapter`) — are
 *    passed in as functions, exactly the injection pattern the Re-educator engine
 *    already uses for `semanticReview` / `meaningVerifier`. This keeps the loop
 *    fully deterministic and unit-testable with models MOCKED — no network, no
 *    paid runtime. Fiction-first needs none of the Dataroom router (that is D4).
 *  - FAIL-CLOSED, no silent shipping (spec §5/§7). A chapter is a *candidate*
 *    until it passes the gate — exactly like a Re-educator edit is a proposal
 *    until verified. If regeneration is exhausted, the chapter is marked `failed`
 *    and the run HALTS by default (a book with a broken chapter 3 must not keep
 *    generating chapter 4 against a corrupt bible).
 *  - The BIBLE is only updated AFTER a chapter is accepted (spec §5 step d). A
 *    rejected draft never contaminates the coherence spine.
 *  - Bounded: MAX_REGEN per chapter, plan length capped (reuses ingest's
 *    MAX_CHAPTERS). Long-form is expensive; bound the blast radius here.
 *
 * This module does NOT talk to MongoDB or Letta directly for chapter STORAGE
 * (the Chapter model + persistence is a later step). It calls the injected
 * `saveChapter`/bible hooks so the orchestration is testable in isolation and the
 * persistence wiring is additive.
 */
import { MAX_CHAPTERS } from './ingest';

/** Thrown for programmer errors in wiring the loop (bad plan, missing deps). */
export class BookAuthorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BookAuthorError';
    }
}

/** Default cap on regeneration attempts per chapter before it is failed. */
export const DEFAULT_MAX_REGEN = 3;

/** What to do when a chapter cannot pass the gate within MAX_REGEN. */
export type FailurePolicy =
    | 'halt' // stop the run at the first unrecoverable chapter (default, safest)
    | 'skip'; // mark it failed, continue to the next chapter

/** One planned chapter the loop will attempt. Mirrors the ingest structure. */
export interface PlannedChapter {
    index: number;
    intent: string;
    beats?: string[];
}

/** The context handed to the (injected) chapter generator. */
export interface GenerateInput {
    chapter: PlannedChapter;
    /** Current bible content (the coherence spine), read fresh each chapter. */
    bible: string;
    /** WRITING.md content (voice), so the draft is written in the user's voice. */
    writingMd: string;
    /** Cited facts for the non-fiction path (D4). null for fiction. */
    facts: string | null;
    /** Which regeneration attempt this is (0-based). Lets the generator adapt. */
    attempt: number;
    /** On a regen, the gate issues from the prior attempt, fed back for repair. */
    priorIssues?: string[];
}

/** The outcome of the done-gate for one draft. */
export interface GateResult {
    /** True iff the draft cleared the done-gate (no unresolved blocking issues). */
    passed: boolean;
    /** The (possibly mechanically-edited) text the gate produced. */
    text: string;
    /** Human-readable issues to feed back into a regeneration. */
    issues: string[];
}

/** One try's gate outcome, recorded for per-chapter run history (observability). */
export interface AttemptRecord {
    /** Chapter index within the plan (0-based). */
    index: number;
    /** 1-based try number (1 = first draft, 2 = first regen, ...). */
    attempt: number;
    /** Whether this try cleared the done-gate. */
    status: 'accepted' | 'failed';
    /** Bounded gate issues from this try (empty when accepted). */
    gateIssues?: string[];
    /** Output tokens billed for this try, if known. */
    tokensUsed?: number;
    /** Model handle this try used, if known. */
    model?: string;
}

/** Injected dependencies — the effectful edges of the otherwise-pure loop. */
export interface AuthorDeps {
    /** Generate a chapter draft. Mocked in tests; real impl is a model call. */
    generateChapter: (input: GenerateInput) => Promise<string>;
    /** Verify a draft through the done-gate. Defaults available via buildReEducatorGate. */
    verifyChapter: (draft: string, chapter: PlannedChapter) => Promise<GateResult>;
    /** Read the current bible (D2 getBibleBlock). */
    readBible: () => Promise<string>;
    /** Persist an accepted chapter's final text + attempts. */
    saveChapter: (chapter: SavedChapter) => Promise<void>;
    /** Fold an accepted chapter's summary into the bible (D2 updateBibleBlock). */
    updateBible: (acceptedChapter: SavedChapter, priorBible: string) => Promise<void>;
    /**
     * OPTIONAL, fail-soft: record one try's gate outcome for run history. Never
     * part of the loop's control flow — a rejected write must not affect authoring.
     * Undefined ⇒ no history is recorded (back-compat with callers/tests without it).
     */
    recordAttempt?: (record: AttemptRecord) => Promise<void>;
    /** The user's WRITING.md voice content (read once by the caller). */
    writingMd: string;
}

/** A chapter that passed the gate and was saved. */
export interface SavedChapter {
    index: number;
    intent: string;
    content: string;
    /** How many attempts it took (1 = passed first try). */
    attempts: number;
}

/** The per-chapter result recorded by the loop (pass or fail). */
export interface ChapterOutcome {
    index: number;
    intent: string;
    status: 'accepted' | 'failed';
    attempts: number;
    /** Final text (accepted) or last rejected draft (failed). */
    content: string;
    /** Gate issues from the final attempt (empty when accepted cleanly). */
    issues: string[];
}

/** The whole run's result. */
export interface AuthorResult {
    status: 'complete' | 'halted';
    chapters: ChapterOutcome[];
    /** Index at which the run halted, if it did. */
    haltedAtIndex: number | null;
}

export interface AuthorRunOptions {
    maxRegen?: number;
    failurePolicy?: FailurePolicy;
    /** Fiction path passes null; the D4 non-fiction path will supply facts. */
    facts?: (chapter: PlannedChapter) => Promise<string | null>;
    /**
     * Resumability: chapter indices already accepted in a prior run. These are
     * SKIPPED — not regenerated, saved, gated, or folded into the bible again —
     * and reported as accepted so the run's completeness still counts them.
     * Default empty ⇒ author every chapter (current behavior).
     */
    alreadyAccepted?: number[];
}

/**
 * Run the chapter loop over an ordered plan. Deterministic given its injected
 * deps. For each chapter: read bible → generate → gate → (regen while failing &
 * under bound) → on pass, save + update bible; on exhaustion, fail per policy.
 */
export async function runChapterLoop(
    plan: PlannedChapter[],
    deps: AuthorDeps,
    options: AuthorRunOptions = {}
): Promise<AuthorResult> {
    if (!Array.isArray(plan)) {
        throw new BookAuthorError('runChapterLoop: plan must be an array.');
    }
    if (plan.length === 0) {
        throw new BookAuthorError('runChapterLoop: plan is empty; nothing to author.');
    }
    if (plan.length > MAX_CHAPTERS) {
        throw new BookAuthorError(
            `runChapterLoop: plan exceeds ${MAX_CHAPTERS} chapters (${plan.length}).`
        );
    }
    assertDeps(deps);

    const maxRegen = options.maxRegen ?? DEFAULT_MAX_REGEN;
    if (!Number.isInteger(maxRegen) || maxRegen < 0) {
        throw new BookAuthorError('runChapterLoop: maxRegen must be a non-negative integer.');
    }
    const failurePolicy: FailurePolicy = options.failurePolicy ?? 'halt';
    const factsFor = options.facts ?? (async () => null);
    const alreadyAccepted = new Set(options.alreadyAccepted ?? []);

    const chapters: ChapterOutcome[] = [];

    for (const chapter of plan) {
        // Resume: a chapter accepted in a prior run is kept as-is. Skip generation,
        // the gate, the save, and the bible fold (its content already lives in the
        // Chapter model and its summary is already folded into the persisted bible)
        // — but still count it accepted so completeness sees the whole plan.
        if (alreadyAccepted.has(chapter.index)) {
            chapters.push({
                index: chapter.index,
                intent: chapter.intent,
                status: 'accepted',
                attempts: 0,
                content: '',
                issues: [],
            });
            continue;
        }

        const outcome = await authorChapterOnce(chapter, deps, maxRegen, factsFor);
        chapters.push(outcome);

        if (outcome.status === 'failed' && failurePolicy === 'halt') {
            return { status: 'halted', chapters, haltedAtIndex: chapter.index };
        }
        // 'skip' → continue to the next chapter without updating the bible.
    }

    return { status: 'complete', chapters, haltedAtIndex: null };
}

/**
 * Author ONE chapter end-to-end: read the bible fresh, generate → gate → regen
 * while failing and under bound, then on pass save + fold into the bible and on
 * exhaustion return a `failed` outcome (leaving any prior accepted chapter and the
 * bible untouched). The single per-chapter engine shared by `runChapterLoop` and
 * `authorSingleChapter` — one implementation of the gate/regen/persist logic, so
 * the targeted regenerate path cannot drift from the full run.
 */
async function authorChapterOnce(
    chapter: PlannedChapter,
    deps: AuthorDeps,
    maxRegen: number,
    factsFor: (chapter: PlannedChapter) => Promise<string | null>
): Promise<ChapterOutcome> {
    // Read the coherence spine fresh — it reflects every accepted chapter so far.
    const bible = await deps.readBible();
    const facts = await factsFor(chapter);

    let attempt = 0;
    let priorIssues: string[] | undefined;
    let lastGate: GateResult | null = null;

    // attempt 0 = first try; each failure that stays under the bound regenerates.
    // Total tries = 1 + maxRegen.
    while (attempt <= maxRegen) {
        const draft = await deps.generateChapter({
            chapter,
            bible,
            writingMd: deps.writingMd,
            facts,
            attempt,
            priorIssues,
        });
        const gate = await deps.verifyChapter(draft, chapter);
        lastGate = gate;

        if (gate.passed) {
            const saved: SavedChapter = {
                index: chapter.index,
                intent: chapter.intent,
                content: gate.text,
                attempts: attempt + 1,
            };
            await deps.saveChapter(saved);
            // Bible is updated ONLY after acceptance — a rejected draft never
            // contaminates the spine. Pass the pre-update bible for context.
            await deps.updateBible(saved, bible);
            // Fail-soft history (never part of control flow).
            await deps.recordAttempt?.({
                index: chapter.index,
                attempt: attempt + 1,
                status: 'accepted',
                gateIssues: [],
            });
            return {
                index: chapter.index,
                intent: chapter.intent,
                status: 'accepted',
                attempts: attempt + 1,
                content: gate.text,
                issues: [],
            };
        }

        // Failed this attempt; record it, feed issues back, and (maybe) regenerate.
        await deps.recordAttempt?.({
            index: chapter.index,
            attempt: attempt + 1,
            status: 'failed',
            gateIssues: gate.issues,
        });
        priorIssues = gate.issues;
        attempt += 1;
    }

    // Exhausted the bound without a pass — a failed outcome. The caller decides
    // what to do (halt/skip for the loop; a structured non-200 for a targeted regen).
    return {
        index: chapter.index,
        intent: chapter.intent,
        status: 'failed',
        attempts: maxRegen + 1,
        content: lastGate?.text ?? '',
        issues: lastGate?.issues ?? [],
    };
}

/**
 * Author a SINGLE chapter of an existing plan, by index — the targeted regenerate
 * path (Wave 4A). Runs the exact same generate → done-gate → regen-on-fail engine
 * as one iteration of `runChapterLoop` (via the shared `authorChapterOnce`), so a
 * regenerated chapter clears the identical bar and, on acceptance, is persisted and
 * folded into the bible the same way. Does NOT touch book-level status or any other
 * chapter — a targeted regen, not a run.
 *
 * Fail-closed: an out-of-plan index is a wiring error (BookAuthorError). On
 * gate-fail exhaustion it returns a `failed` ChapterOutcome (no save, no bible
 * fold), leaving the prior accepted chapter intact for the caller to surface.
 */
export async function authorSingleChapter(
    plan: PlannedChapter[],
    deps: AuthorDeps,
    index: number,
    options: AuthorRunOptions = {}
): Promise<ChapterOutcome> {
    if (!Array.isArray(plan) || plan.length === 0) {
        throw new BookAuthorError('authorSingleChapter: plan must be a non-empty array.');
    }
    assertDeps(deps);

    const maxRegen = options.maxRegen ?? DEFAULT_MAX_REGEN;
    if (!Number.isInteger(maxRegen) || maxRegen < 0) {
        throw new BookAuthorError('authorSingleChapter: maxRegen must be a non-negative integer.');
    }

    const chapter = plan.find((c) => c.index === index);
    if (!chapter) {
        throw new BookAuthorError(`authorSingleChapter: no planned chapter with index ${index}.`);
    }

    const factsFor = options.facts ?? (async () => null);
    return authorChapterOnce(chapter, deps, maxRegen, factsFor);
}

function assertDeps(deps: AuthorDeps): void {
    const required: (keyof AuthorDeps)[] = [
        'generateChapter',
        'verifyChapter',
        'readBible',
        'saveChapter',
        'updateBible',
    ];
    for (const k of required) {
        if (typeof deps[k] !== 'function') {
            throw new BookAuthorError(`runChapterLoop: deps.${k} must be a function.`);
        }
    }
    if (typeof deps.writingMd !== 'string') {
        throw new BookAuthorError('runChapterLoop: deps.writingMd must be a string.');
    }
}

export default { runChapterLoop, authorSingleChapter, DEFAULT_MAX_REGEN };
