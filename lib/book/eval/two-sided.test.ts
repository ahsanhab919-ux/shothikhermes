import { describe, it, expect, vi } from 'vitest';

import { runTwoSidedEval, type VerifyChapter } from './harness';
import type { CleanCase, EvalCase } from './types';
import type { GateResult } from '../author';
import { CLEAN_CASES } from './fixtures';

const errorCases: EvalCase[] = [
    {
        id: 'err-nf',
        kind: 'nonfiction',
        chapter: { index: 0, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft err-nf',
        expectedError: { type: 'fabrication', note: 'n' },
    },
    {
        id: 'err-fic',
        kind: 'fiction',
        chapter: { index: 1, intent: 'x' },
        priorContext: 'ctx',
        draft: 'draft err-fic',
        expectedError: { type: 'continuity', note: 'n' },
    },
];

const cleanCases: CleanCase[] = [
    {
        id: 'ok-nf',
        kind: 'nonfiction',
        chapter: { index: 2, intent: 'x' },
        draft: 'draft ok-nf',
        note: 'clean',
    },
    {
        id: 'ok-fic',
        kind: 'fiction',
        chapter: { index: 3, intent: 'x' },
        draft: 'draft ok-fic',
        note: 'clean',
    },
];

/** A gate that rejects (catches) a draft iff its id is in `rejectIds`. */
function fakeGate(rejectIds: Set<string>): VerifyChapter {
    return vi.fn(async (draft: string): Promise<GateResult> => {
        const id = draft.replace(/^draft /, '');
        const rejected = rejectIds.has(id);
        return {
            passed: !rejected,
            text: draft,
            issues: rejected ? [`issue for ${id}`] : [],
        };
    });
}

/** Rejects every draft it sees. */
function rejectAllGate(): VerifyChapter {
    return vi.fn(async (draft: string): Promise<GateResult> => ({
        passed: false,
        text: draft,
        issues: ['always rejects'],
    }));
}

/** Accepts every draft it sees. */
function acceptAllGate(): VerifyChapter {
    return vi.fn(async (draft: string): Promise<GateResult> => ({
        passed: true,
        text: draft,
        issues: [],
    }));
}

describe('runTwoSidedEval — scoring', () => {
    it('perfect detector → recall 1, FP 0, precision 1', async () => {
        const report = await runTwoSidedEval(
            errorCases,
            cleanCases,
            fakeGate(new Set(['err-nf', 'err-fic']))
        );
        expect(report.errorTotal).toBe(2);
        expect(report.caught).toBe(2);
        expect(report.recall).toBe(1);
        expect(report.cleanTotal).toBe(2);
        expect(report.falsePositives).toBe(0);
        expect(report.falsePositiveRate).toBe(0);
        expect(report.precision).toBe(1);
        expect(report.perError.every((c) => c.caught)).toBe(true);
        expect(report.perClean.every((c) => !c.wronglyRejected)).toBe(true);
    });

    it('over-eager detector (rejects everything) → recall 1, FP rate 1, precision < 1', async () => {
        const report = await runTwoSidedEval(errorCases, cleanCases, rejectAllGate());
        expect(report.recall).toBe(1);
        expect(report.falsePositives).toBe(2);
        expect(report.falsePositiveRate).toBe(1);
        // caught 2 / (caught 2 + fp 2) = 0.5
        expect(report.precision).toBe(0.5);
        expect(report.precision).toBeLessThan(1);
        expect(report.perClean.every((c) => c.wronglyRejected)).toBe(true);
    });

    it('blind detector (accepts everything) → recall 0, FP 0, precision 0', async () => {
        const report = await runTwoSidedEval(errorCases, cleanCases, acceptAllGate());
        expect(report.caught).toBe(0);
        expect(report.recall).toBe(0);
        expect(report.falsePositives).toBe(0);
        expect(report.falsePositiveRate).toBe(0);
        // denominator is 0 → precision guarded to 0
        expect(report.precision).toBe(0);
        expect(report.perError.every((c) => !c.caught)).toBe(true);
        expect(report.perClean.every((c) => !c.wronglyRejected)).toBe(true);
    });

    it('mixed → correct recall, FP rate, precision', async () => {
        // Catch one error (err-nf) and wrongly reject one clean (ok-fic).
        const report = await runTwoSidedEval(
            errorCases,
            cleanCases,
            fakeGate(new Set(['err-nf', 'ok-fic']))
        );
        expect(report.caught).toBe(1);
        expect(report.recall).toBe(0.5);
        expect(report.falsePositives).toBe(1);
        expect(report.falsePositiveRate).toBe(0.5);
        // caught 1 / (caught 1 + fp 1) = 0.5
        expect(report.precision).toBe(0.5);
        const okFic = report.perClean.find((c) => c.id === 'ok-fic')!;
        expect(okFic.wronglyRejected).toBe(true);
        expect(okFic.issues).toEqual(['issue for ok-fic']);
        const errFic = report.perError.find((c) => c.id === 'err-fic')!;
        expect(errFic.caught).toBe(false);
    });

    it('empty sets → zero everything, no divide-by-zero', async () => {
        const report = await runTwoSidedEval([], [], acceptAllGate());
        expect(report.errorTotal).toBe(0);
        expect(report.caught).toBe(0);
        expect(report.recall).toBe(0);
        expect(report.cleanTotal).toBe(0);
        expect(report.falsePositives).toBe(0);
        expect(report.falsePositiveRate).toBe(0);
        expect(report.precision).toBe(0);
        expect(report.perError).toEqual([]);
        expect(report.perClean).toEqual([]);
    });

    it('preserves order and calls the gate once per case (errors then clean)', async () => {
        const gate = acceptAllGate();
        const report = await runTwoSidedEval(errorCases, cleanCases, gate);
        expect((gate as any).mock.calls).toHaveLength(4);
        expect(report.perError.map((c) => c.id)).toEqual(['err-nf', 'err-fic']);
        expect(report.perClean.map((c) => c.id)).toEqual(['ok-nf', 'ok-fic']);
    });
});

describe('bundled clean fixture set', () => {
    it('ships 3 non-fiction + 3 fiction = 6 clean cases with unique ids', () => {
        expect(CLEAN_CASES).toHaveLength(6);
        expect(CLEAN_CASES.filter((c) => c.kind === 'nonfiction')).toHaveLength(3);
        expect(CLEAN_CASES.filter((c) => c.kind === 'fiction')).toHaveLength(3);
        const ids = new Set(CLEAN_CASES.map((c) => c.id));
        expect(ids.size).toBe(CLEAN_CASES.length);
        for (const c of CLEAN_CASES) {
            expect(c.draft.length).toBeGreaterThan(0);
            expect(c.note.length).toBeGreaterThan(0);
        }
    });
});
