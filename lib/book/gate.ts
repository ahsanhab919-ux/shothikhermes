/**
 * Book Authoring — done-gate adapter (Track D, D3 support).
 *
 * Bridges a generated chapter draft to the Re-educator done-gate we already own
 * (BOOK-AUTHORING-SPEC.md §2: "Per-chapter verification ✅ reuse runEngine()").
 * A generated chapter is a *candidate* until it clears the same gate a
 * Re-educator edit must clear — no separate, weaker bar for generated text.
 *
 * The pass rule (senior-dev, reuses the existing Review contract): a draft
 * PASSES iff the Review run leaves NO unresolved blocking outcomes — i.e.
 * `summary.authorRequired === 0 && summary.revertedRequeued === 0`. `applied`
 * (mechanical fixes the engine made) and `proposed` (optional author polish) do
 * not block a chapter from counting as done; unresolved author-required issues
 * and edits that failed VERIFY do. This mirrors how a human treats a Review
 * panel: green when nothing is left that the engine could not safely resolve.
 *
 * Kept OUT of author.ts so the loop stays pure/deterministic; this adapter is the
 * one place that imports the Re-educator service, and is itself injected.
 */
import { runReEducator, type GuardOptions } from '@/lib/re-educator/service';
import type { SemanticReviewer } from '@/lib/re-educator/engine';
import type { Span } from '@/lib/re-educator/types';
import type { GateResult, PlannedChapter } from './author';

export interface ReEducatorGateOptions {
    /** Frozen spans no edit may touch (e.g. quoted text). Usually empty for fiction. */
    anchors?: Span[];
    /** Guard tuning (terminology/voice) — pass the same options the studio uses. */
    guardOptions?: GuardOptions;
    /** WRITING.md version tag for the ledger meta. */
    writingMdVersion?: string;
    /**
     * Optional semantic reviewer. When provided, the gate runs meaning-level
     * review in addition to the deterministic guards. OFF by default (Phase R1a):
     * omitting it preserves the exact prior style/mechanics-only behaviour.
     */
    semanticReview?: SemanticReviewer;
}

/** Turn a Review outcome into a flat list of human-readable blocking issues. */
function collectBlockingIssues(
    authorRequired: number,
    revertedRequeued: number,
    panelIssues: string[]
): string[] {
    const issues = [...panelIssues];
    if (authorRequired > 0 && issues.length === 0) {
        issues.push(`${authorRequired} issue(s) require author attention.`);
    }
    if (revertedRequeued > 0 && issues.length === 0) {
        issues.push(`${revertedRequeued} edit(s) failed verification and were reverted.`);
    }
    return issues;
}

/**
 * Build a `verifyChapter` function bound to the Re-educator Review done-gate.
 * The returned function matches AuthorDeps.verifyChapter and can be injected
 * directly into runChapterLoop.
 */
export function buildReEducatorGate(
    options: ReEducatorGateOptions = {}
): (draft: string, chapter: PlannedChapter) => Promise<GateResult> {
    return async function verifyChapter(draft: string): Promise<GateResult> {
        const res = await runReEducator({
            text: draft,
            mode: 'review',
            anchors: options.anchors ?? [],
            guardOptions: options.guardOptions,
            writingMdVersion: options.writingMdVersion ?? 'none',
            semanticReview: options.semanticReview,
        });

        // review mode always returns a ReviewResult; narrow for type-safety.
        if (res.mode !== 'review') {
            // Defensive: should never happen given we asked for 'review'.
            return { passed: false, text: draft, issues: ['Unexpected gate mode.'] };
        }

        const { summary, text, panel } = res.result;
        const passed = summary.authorRequired === 0 && summary.revertedRequeued === 0;

        // Surface concrete rationales when present, else a count-based summary.
        const panelIssues = [
            ...panel.authorRequired.map((o) => o.issue.rationale),
            ...panel.revertedRequeued.map((o) => o.issue.rationale),
        ].filter((s): s is string => typeof s === 'string' && s.length > 0);

        return {
            passed,
            text,
            issues: passed
                ? []
                : collectBlockingIssues(summary.authorRequired, summary.revertedRequeued, panelIssues),
        };
    };
}

export default { buildReEducatorGate };
