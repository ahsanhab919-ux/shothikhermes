import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    runChapterLoop,
    authorSingleChapter,
    BookAuthorError,
    DEFAULT_MAX_REGEN,
    type AuthorDeps,
    type AttemptRecord,
    type GateResult,
    type PlannedChapter,
    type SavedChapter,
} from './author';

/** Build a fresh set of mock deps with sensible defaults per test. */
function makeDeps(overrides: Partial<AuthorDeps> = {}): AuthorDeps & { saved: SavedChapter[] } {
    const saved: SavedChapter[] = [];
    const deps: AuthorDeps = {
        writingMd: '# WRITING.md\nvoice',
        generateChapter: vi.fn(async ({ chapter, attempt }) => `draft ${chapter.index} v${attempt}`),
        verifyChapter: vi.fn(
            async (draft): Promise<GateResult> => ({ passed: true, text: draft, issues: [] })
        ),
        readBible: vi.fn(async () => 'BIBLE STATE'),
        saveChapter: vi.fn(async (c: SavedChapter) => {
            saved.push(c);
        }),
        updateBible: vi.fn(async () => {}),
        ...overrides,
    };
    return Object.assign(deps, { saved });
}

const plan: PlannedChapter[] = [
    { index: 0, intent: 'Chapter 1', beats: ['a'] },
    { index: 1, intent: 'Chapter 2', beats: ['b'] },
];

beforeEach(() => vi.clearAllMocks());

describe('runChapterLoop — input validation (fail-closed)', () => {
    it('rejects a non-array plan', async () => {
        await expect(runChapterLoop(null as never, makeDeps())).rejects.toThrow(BookAuthorError);
    });

    it('rejects an empty plan', async () => {
        await expect(runChapterLoop([], makeDeps())).rejects.toThrow(/empty/);
    });

    it('rejects missing dependency functions', async () => {
        const bad = { ...makeDeps(), generateChapter: undefined as never };
        await expect(runChapterLoop(plan, bad)).rejects.toThrow(/generateChapter/);
    });

    it('rejects a negative maxRegen', async () => {
        await expect(
            runChapterLoop(plan, makeDeps(), { maxRegen: -1 })
        ).rejects.toThrow(/maxRegen/);
    });
});

describe('runChapterLoop — happy path', () => {
    it('accepts every chapter on first try and completes', async () => {
        const deps = makeDeps();
        const res = await runChapterLoop(plan, deps);
        expect(res.status).toBe('complete');
        expect(res.haltedAtIndex).toBeNull();
        expect(res.chapters.map((c) => c.status)).toEqual(['accepted', 'accepted']);
        expect(res.chapters.every((c) => c.attempts === 1)).toBe(true);
    });

    it('saves each accepted chapter and updates the bible once per chapter', async () => {
        const deps = makeDeps();
        await runChapterLoop(plan, deps);
        expect(deps.saveChapter).toHaveBeenCalledTimes(2);
        expect(deps.updateBible).toHaveBeenCalledTimes(2);
    });

    it('reads the bible fresh before each chapter', async () => {
        const deps = makeDeps();
        await runChapterLoop(plan, deps);
        expect(deps.readBible).toHaveBeenCalledTimes(2);
    });
});

describe('runChapterLoop — regeneration', () => {
    it('regenerates on gate failure then accepts, feeding prior issues back', async () => {
        let calls = 0;
        const generateChapter = vi.fn(async ({ attempt, priorIssues }) => {
            calls += 1;
            return `draft attempt ${attempt} priorIssues=${priorIssues?.length ?? 0}`;
        });
        // Fail only the very first draft overall; pass everything after.
        const verifyChapter = vi.fn(async (draft: string): Promise<GateResult> => {
            if (calls === 1) return { passed: false, text: draft, issues: ['too flat'] };
            return { passed: true, text: draft, issues: [] };
        });
        const deps = makeDeps({ generateChapter, verifyChapter });
        const res = await runChapterLoop([plan[0]], deps);
        expect(res.status).toBe('complete');
        expect(res.chapters[0].status).toBe('accepted');
        expect(res.chapters[0].attempts).toBe(2);
        // The regeneration got the prior issues fed back.
        const secondCallArg = generateChapter.mock.calls[1][0];
        expect(secondCallArg.attempt).toBe(1);
        expect(secondCallArg.priorIssues).toEqual(['too flat']);
    });

    it('does NOT update the bible for a rejected draft', async () => {
        // Always fails → never accepted → bible must stay untouched.
        const verifyChapter = vi.fn(
            async (draft: string): Promise<GateResult> => ({ passed: false, text: draft, issues: ['bad'] })
        );
        const deps = makeDeps({ verifyChapter });
        await runChapterLoop([plan[0]], deps, { maxRegen: 2, failurePolicy: 'skip' });
        expect(deps.updateBible).not.toHaveBeenCalled();
        expect(deps.saveChapter).not.toHaveBeenCalled();
    });

    it('respects maxRegen: total tries = 1 + maxRegen', async () => {
        const generateChapter = vi.fn(async ({ chapter, attempt }) => `d${chapter.index}.${attempt}`);
        const verifyChapter = vi.fn(
            async (draft: string): Promise<GateResult> => ({ passed: false, text: draft, issues: ['x'] })
        );
        const deps = makeDeps({ generateChapter, verifyChapter });
        await runChapterLoop([plan[0]], deps, { maxRegen: 2, failurePolicy: 'skip' });
        expect(generateChapter).toHaveBeenCalledTimes(3); // 1 + 2
    });
});

describe('runChapterLoop — failure policy', () => {
    it('halts at the first unrecoverable chapter by default', async () => {
        const verifyChapter = vi.fn(
            async (draft: string): Promise<GateResult> => ({ passed: false, text: draft, issues: ['nope'] })
        );
        const deps = makeDeps({ verifyChapter });
        const res = await runChapterLoop(plan, deps, { maxRegen: 0 });
        expect(res.status).toBe('halted');
        expect(res.haltedAtIndex).toBe(0);
        // Chapter 2 was never attempted.
        expect(res.chapters).toHaveLength(1);
        expect(res.chapters[0].status).toBe('failed');
    });

    it('skip policy marks a chapter failed and continues', async () => {
        // Fail chapter 0 only; pass chapter 1.
        const verifyChapter = vi.fn(async (draft: string): Promise<GateResult> => {
            if (draft.startsWith('draft 0')) return { passed: false, text: draft, issues: ['nope'] };
            return { passed: true, text: draft, issues: [] };
        });
        const deps = makeDeps({ verifyChapter });
        const res = await runChapterLoop(plan, deps, { maxRegen: 0, failurePolicy: 'skip' });
        expect(res.status).toBe('complete');
        expect(res.chapters.map((c) => c.status)).toEqual(['failed', 'accepted']);
    });
});

describe('runChapterLoop — non-fiction facts hook', () => {
    it('passes facts from the options hook into the generator', async () => {
        const generateChapter = vi.fn(async ({ facts }) => `draft facts=${facts}`);
        const deps = makeDeps({ generateChapter });
        await runChapterLoop([plan[0]], deps, {
            facts: async (ch) => `facts-for-${ch.index}`,
        });
        expect(generateChapter.mock.calls[0][0].facts).toBe('facts-for-0');
    });

    it('defaults facts to null (fiction path)', async () => {
        const generateChapter = vi.fn(async ({ facts }) => `draft facts=${facts}`);
        const deps = makeDeps({ generateChapter });
        await runChapterLoop([plan[0]], deps);
        expect(generateChapter.mock.calls[0][0].facts).toBeNull();
    });
});

describe('runChapterLoop — attempt history (recordAttempt, optional + fail-soft-shaped)', () => {
    it('records a failed try then an accepted try on regeneration', async () => {
        let calls = 0;
        const generateChapter = vi.fn(async ({ attempt }) => {
            calls += 1;
            return `draft ${attempt}`;
        });
        // Fail the first draft, pass the regeneration.
        const verifyChapter = vi.fn(async (draft: string): Promise<GateResult> => {
            if (calls === 1) return { passed: false, text: draft, issues: ['too flat'] };
            return { passed: true, text: draft, issues: [] };
        });
        const recordAttempt = vi.fn(async (_record: AttemptRecord) => {});
        const deps = makeDeps({ generateChapter, verifyChapter, recordAttempt });
        await runChapterLoop([plan[0]], deps);

        expect(recordAttempt).toHaveBeenCalledTimes(2);
        // 1-based try numbers; the failed try carries the gate issues.
        expect(recordAttempt.mock.calls[0][0]).toMatchObject({
            index: 0,
            attempt: 1,
            status: 'failed',
            gateIssues: ['too flat'],
        });
        expect(recordAttempt.mock.calls[1][0]).toMatchObject({
            index: 0,
            attempt: 2,
            status: 'accepted',
            gateIssues: [],
        });
    });

    it('records nothing extra and does not throw when recordAttempt is undefined (back-compat)', async () => {
        // makeDeps supplies no recordAttempt — the loop must run exactly as before.
        const deps = makeDeps();
        expect(deps.recordAttempt).toBeUndefined();
        const res = await runChapterLoop(plan, deps);
        expect(res.status).toBe('complete');
        expect(res.chapters.map((c) => c.status)).toEqual(['accepted', 'accepted']);
    });
});

describe('runChapterLoop — resumability (alreadyAccepted)', () => {
    it('skips an already-accepted index: no generate/save/gate/bible for it, still counted', async () => {
        const deps = makeDeps();
        const res = await runChapterLoop(plan, deps, { alreadyAccepted: [0] });
        expect(res.status).toBe('complete');
        // Only chapter 1 was actually authored.
        expect(deps.generateChapter).toHaveBeenCalledTimes(1);
        expect(deps.verifyChapter).toHaveBeenCalledTimes(1);
        expect(deps.saveChapter).toHaveBeenCalledTimes(1);
        expect(deps.updateBible).toHaveBeenCalledTimes(1);
        expect(deps.readBible).toHaveBeenCalledTimes(1);
        // The skipped chapter is reported accepted (attempts 0 = not tried this run).
        expect(res.chapters.map((c) => c.status)).toEqual(['accepted', 'accepted']);
        const skipped = res.chapters.find((c) => c.index === 0)!;
        expect(skipped.attempts).toBe(0);
    });

    it('does ZERO generation and completes when every planned index is already accepted', async () => {
        const deps = makeDeps();
        const res = await runChapterLoop(plan, deps, { alreadyAccepted: [0, 1] });
        expect(res.status).toBe('complete');
        expect(deps.generateChapter).not.toHaveBeenCalled();
        expect(deps.saveChapter).not.toHaveBeenCalled();
        expect(deps.updateBible).not.toHaveBeenCalled();
        expect(res.chapters.map((c) => c.status)).toEqual(['accepted', 'accepted']);
    });
});

describe('DEFAULT_MAX_REGEN', () => {
    it('is a small positive integer', () => {
        expect(DEFAULT_MAX_REGEN).toBeGreaterThan(0);
        expect(Number.isInteger(DEFAULT_MAX_REGEN)).toBe(true);
    });
});

describe('authorSingleChapter — targeted regenerate', () => {
    it('rejects an empty plan', async () => {
        await expect(authorSingleChapter([], makeDeps(), 0)).rejects.toThrow(BookAuthorError);
    });

    it('rejects missing dependency functions', async () => {
        const bad = { ...makeDeps(), verifyChapter: undefined as never };
        await expect(authorSingleChapter(plan, bad, 0)).rejects.toThrow(/verifyChapter/);
    });

    it('rejects a negative maxRegen', async () => {
        await expect(authorSingleChapter(plan, makeDeps(), 0, { maxRegen: -1 })).rejects.toThrow(
            /maxRegen/
        );
    });

    it('throws when the index is outside the plan', async () => {
        await expect(authorSingleChapter(plan, makeDeps(), 99)).rejects.toThrow(/index 99/);
    });

    it('authors ONLY the requested chapter, saving + folding it into the bible on accept', async () => {
        const deps = makeDeps();
        const outcome = await authorSingleChapter(plan, deps, 1);
        expect(outcome.status).toBe('accepted');
        expect(outcome.index).toBe(1);
        // Exactly one chapter generated/saved/folded — the targeted index, not the plan.
        expect(deps.generateChapter).toHaveBeenCalledTimes(1);
        expect(deps.saveChapter).toHaveBeenCalledTimes(1);
        expect(deps.updateBible).toHaveBeenCalledTimes(1);
        expect(deps.saved).toHaveLength(1);
        expect(deps.saved[0].index).toBe(1);
    });

    it('regenerates on gate failure then accepts, feeding prior issues back', async () => {
        let calls = 0;
        const verifyChapter = vi.fn(async (draft: string): Promise<GateResult> => {
            calls += 1;
            return calls < 2
                ? { passed: false, text: draft, issues: ['fix pacing'] }
                : { passed: true, text: draft, issues: [] };
        });
        const deps = makeDeps({ verifyChapter });
        const outcome = await authorSingleChapter(plan, deps, 0);
        expect(outcome.status).toBe('accepted');
        expect(outcome.attempts).toBe(2);
        expect(deps.generateChapter).toHaveBeenCalledTimes(2);
    });

    it('returns a failed outcome (no save, no bible fold) when regeneration is exhausted', async () => {
        const verifyChapter = vi.fn(
            async (draft: string): Promise<GateResult> => ({
                passed: false,
                text: draft,
                issues: ['still broken'],
            })
        );
        const deps = makeDeps({ verifyChapter });
        const outcome = await authorSingleChapter(plan, deps, 0, { maxRegen: 1 });
        expect(outcome.status).toBe('failed');
        expect(outcome.attempts).toBe(2); // 1 + maxRegen
        expect(outcome.issues).toEqual(['still broken']);
        // A failed regen must NOT persist or contaminate the bible.
        expect(deps.saveChapter).not.toHaveBeenCalled();
        expect(deps.updateBible).not.toHaveBeenCalled();
        expect(deps.saved).toHaveLength(0);
    });

    it('records each attempt (fail-soft history) for the targeted chapter', async () => {
        const records: AttemptRecord[] = [];
        const recordAttempt = vi.fn(async (r: AttemptRecord) => {
            records.push(r);
        });
        const deps = makeDeps({ recordAttempt });
        await authorSingleChapter(plan, deps, 0);
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({ index: 0, attempt: 1, status: 'accepted' });
    });
});
