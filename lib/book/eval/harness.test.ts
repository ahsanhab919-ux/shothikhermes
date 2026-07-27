import { describe, it, expect, vi } from 'vitest';

import { runGateBaseline, type VerifyChapter } from './harness';
import type { EvalCase, GateResultLike } from './types';
import type { GateResult } from '../author';
import { EVAL_CASES, NONFICTION_CASES, FICTION_CASES } from './fixtures';

// A tiny synthetic set: 2 non-fiction + 2 fiction, so per-kind math is checkable.
const cases: EvalCase[] = [
    {
        id: 'nf-a',
        kind: 'nonfiction',
        chapter: { index: 0, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft nf-a',
        expectedError: { type: 'fabrication', note: 'n' },
    },
    {
        id: 'nf-b',
        kind: 'nonfiction',
        chapter: { index: 1, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft nf-b',
        expectedError: { type: 'contradiction', note: 'n' },
    },
    {
        id: 'fic-a',
        kind: 'fiction',
        chapter: { index: 2, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft fic-a',
        expectedError: { type: 'continuity', note: 'n' },
    },
    {
        id: 'fic-b',
        kind: 'fiction',
        chapter: { index: 3, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft fic-b',
        expectedError: { type: 'timeline', note: 'n' },
    },
];

/** A gate that rejects (catches) a draft iff its id is in `catchIds`. */
function fakeGate(catchIds: Set<string>): VerifyChapter {
    return vi.fn(async (draft: string): Promise<GateResult> => {
        // Map draft back to id via the "draft <id>" convention above.
        const id = draft.replace(/^draft /, '');
        const caught = catchIds.has(id);
        return {
            passed: !caught,
            text: draft,
            issues: caught ? [`issue for ${id}`] : [],
        };
    });
}

describe('runGateBaseline — scoring', () => {
    it('all caught → 100% overall and per-kind', async () => {
        const report = await runGateBaseline(
            cases,
            fakeGate(new Set(['nf-a', 'nf-b', 'fic-a', 'fic-b']))
        );
        expect(report.total).toBe(4);
        expect(report.caught).toBe(4);
        expect(report.catchRate).toBe(1);
        expect(report.perKind.nonfiction).toEqual({ total: 2, caught: 2, catchRate: 1 });
        expect(report.perKind.fiction).toEqual({ total: 2, caught: 2, catchRate: 1 });
        expect(report.perCase.every((c) => c.caught)).toBe(true);
    });

    it('none caught → 0% (every draft passed the gate)', async () => {
        const report = await runGateBaseline(cases, fakeGate(new Set()));
        expect(report.caught).toBe(0);
        expect(report.catchRate).toBe(0);
        expect(report.perKind.nonfiction.catchRate).toBe(0);
        expect(report.perKind.fiction.catchRate).toBe(0);
        expect(report.perCase.every((c) => !c.caught)).toBe(true);
        // A passed draft surfaces no issues.
        expect(report.perCase.every((c) => c.issues.length === 0)).toBe(true);
    });

    it('mixed → correct per-kind and overall rates', async () => {
        // Catch one of each kind: nf-a and fic-b.
        const report = await runGateBaseline(cases, fakeGate(new Set(['nf-a', 'fic-b'])));
        expect(report.caught).toBe(2);
        expect(report.catchRate).toBe(0.5);
        expect(report.perKind.nonfiction).toEqual({ total: 2, caught: 1, catchRate: 0.5 });
        expect(report.perKind.fiction).toEqual({ total: 2, caught: 1, catchRate: 0.5 });
        const nfA = report.perCase.find((c) => c.id === 'nf-a')!;
        expect(nfA.caught).toBe(true);
        expect(nfA.issues).toEqual(['issue for nf-a']);
        expect(nfA.expectedErrorType).toBe('fabrication');
        const nfB = report.perCase.find((c) => c.id === 'nf-b')!;
        expect(nfB.caught).toBe(false);
    });

    it('empty set → zero totals and 0 rate (no divide-by-zero)', async () => {
        const report = await runGateBaseline([], fakeGate(new Set()));
        expect(report.total).toBe(0);
        expect(report.caught).toBe(0);
        expect(report.catchRate).toBe(0);
        expect(report.perKind.nonfiction).toEqual({ total: 0, caught: 0, catchRate: 0 });
        expect(report.perKind.fiction).toEqual({ total: 0, caught: 0, catchRate: 0 });
        expect(report.perCase).toEqual([]);
    });

    it('preserves case order and calls the gate once per case', async () => {
        const gate = fakeGate(new Set());
        const report = await runGateBaseline(cases, gate);
        expect((gate as any).mock.calls).toHaveLength(4);
        expect(report.perCase.map((c) => c.id)).toEqual(['nf-a', 'nf-b', 'fic-a', 'fic-b']);
    });
});

describe('bundled fixture set', () => {
    it('ships 8 non-fiction + 8 fiction = 16 labelled cases', () => {
        expect(NONFICTION_CASES).toHaveLength(8);
        expect(FICTION_CASES).toHaveLength(8);
        expect(EVAL_CASES).toHaveLength(16);
    });

    it('every case has a unique id and a labelled error contradicting its priorContext', () => {
        const ids = new Set(EVAL_CASES.map((c) => c.id));
        expect(ids.size).toBe(EVAL_CASES.length);
        for (const c of EVAL_CASES) {
            expect(c.draft.length).toBeGreaterThan(0);
            expect(c.priorContext.length).toBeGreaterThan(0);
            expect(['continuity', 'fabrication', 'timeline', 'contradiction']).toContain(
                c.expectedError.type
            );
            expect(c.expectedError.note.length).toBeGreaterThan(0);
        }
    });
});

// Type-only guard: GateResultLike (re-exported convenience) stays assignable from GateResult.
const _typecheck: GateResultLike = { passed: true, text: '', issues: [] } satisfies GateResult;
void _typecheck;
