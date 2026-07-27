/**
 * Book Authoring — done-gate SEMANTIC wiring test (Phase R1a).
 *
 * Unlike gate.test.ts (which mocks the whole re-educator service), these tests run
 * the REAL `runReEducator` so the newly-threaded `semanticReview` option is actually
 * exercised end-to-end. No model is called: the reviewer is a deterministic fake, so
 * the test stays fast and token-free while proving the plumbing
 * (semanticReview → author-required outcome → passed=false) is wired correctly, and
 * that omitting the option preserves the prior deterministic-only behaviour.
 */
import { describe, it, expect } from 'vitest';

import { buildReEducatorGate } from './gate';
import type { PlannedChapter } from './author';
import type { SemanticReviewer } from '@/lib/re-educator/engine';
import type { Issue } from '@/lib/re-educator/types';

const chapter: PlannedChapter = { index: 0, intent: 'Chapter 1' };

/**
 * A deterministic fake reviewer that flags the whole draft with a single `major`
 * `unsupported-assertion` — the category profiles route to `author-required`. No
 * network, no model.
 */
function fakeReviewer(): SemanticReviewer {
    return (text: string): Issue[] => [
        {
            category: 'unsupported-assertion',
            span: { start: 0, end: text.length },
            severity: 'major',
            rationale: 'fabricated claim with no support in the source',
            text,
        },
    ];
}

describe('buildReEducatorGate — semanticReview wiring (R1a)', () => {
    it('rejects a draft when the injected semantic reviewer flags a major issue', async () => {
        const gate = buildReEducatorGate({ semanticReview: fakeReviewer() });
        const r = await gate('The harbour city of Vaelport gleamed beside the open sea.', chapter);
        expect(r.passed).toBe(false);
        expect(r.issues.length).toBeGreaterThan(0);
    });

    it('back-compat: with NO semanticReview, a clean draft still passes', async () => {
        const gate = buildReEducatorGate();
        const r = await gate('The room was quiet. She set down her cup and waited.', chapter);
        expect(r.passed).toBe(true);
        expect(r.issues).toEqual([]);
    });
});
