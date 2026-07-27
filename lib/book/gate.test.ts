import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun } = vi.hoisted(() => ({ mockRun: vi.fn() }));

vi.mock('@/lib/re-educator/service', () => ({
    runReEducator: mockRun,
}));

import { buildReEducatorGate } from './gate';
import type { PlannedChapter } from './author';

const chapter: PlannedChapter = { index: 0, intent: 'Chapter 1' };

/** A minimal review-mode result envelope the adapter reads. */
function reviewResult(
    summary: { authorRequired: number; revertedRequeued: number },
    text = 'edited draft',
    panel: Record<string, unknown> = {
        applied: [],
        proposed: [],
        authorRequired: [],
        revertedRequeued: [],
    }
) {
    return {
        mode: 'review' as const,
        ledger: { meta: {}, entries: [] },
        result: {
            text,
            summary: { total: 0, applied: 0, proposed: 0, ...summary },
            panel,
            rounds: 1,
        },
    };
}

beforeEach(() => vi.clearAllMocks());

describe('buildReEducatorGate', () => {
    it('passes when there are no unresolved blocking outcomes', async () => {
        mockRun.mockResolvedValueOnce(
            reviewResult({ authorRequired: 0, revertedRequeued: 0 }, 'clean text')
        );
        const gate = buildReEducatorGate();
        const r = await gate('draft', chapter);
        expect(r.passed).toBe(true);
        expect(r.text).toBe('clean text');
        expect(r.issues).toEqual([]);
    });

    it('fails when an author-required issue remains', async () => {
        mockRun.mockResolvedValueOnce(
            reviewResult(
                { authorRequired: 1, revertedRequeued: 0 },
                'draft',
                {
                    applied: [],
                    proposed: [],
                    authorRequired: [{ issue: { rationale: 'unsupported claim' } }],
                    revertedRequeued: [],
                }
            )
        );
        const gate = buildReEducatorGate();
        const r = await gate('draft', chapter);
        expect(r.passed).toBe(false);
        expect(r.issues).toContain('unsupported claim');
    });

    it('fails when an edit was reverted (failed VERIFY)', async () => {
        mockRun.mockResolvedValueOnce(
            reviewResult({ authorRequired: 0, revertedRequeued: 2 })
        );
        const gate = buildReEducatorGate();
        const r = await gate('draft', chapter);
        expect(r.passed).toBe(false);
        expect(r.issues.length).toBeGreaterThan(0);
    });

    it('treats applied/proposed (non-blocking) outcomes as a pass', async () => {
        mockRun.mockResolvedValueOnce({
            mode: 'review' as const,
            ledger: { meta: {}, entries: [] },
            result: {
                text: 'polished',
                summary: {
                    total: 3,
                    applied: 2,
                    proposed: 1,
                    authorRequired: 0,
                    revertedRequeued: 0,
                },
                panel: { applied: [], proposed: [], authorRequired: [], revertedRequeued: [] },
                rounds: 1,
            },
        });
        const gate = buildReEducatorGate();
        const r = await gate('draft', chapter);
        expect(r.passed).toBe(true);
    });

    it('forwards anchors/guardOptions/version to runReEducator in review mode', async () => {
        mockRun.mockResolvedValueOnce(reviewResult({ authorRequired: 0, revertedRequeued: 0 }));
        const gate = buildReEducatorGate({ writingMdVersion: 'wmd:abc' });
        await gate('draft', chapter);
        expect(mockRun).toHaveBeenCalledWith(
            expect.objectContaining({ mode: 'review', writingMdVersion: 'wmd:abc' })
        );
    });
});
