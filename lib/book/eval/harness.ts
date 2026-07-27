/**
 * Gate-baseline eval — pure harness (Phase R0).
 *
 * Orchestrates an INJECTED `verifyChapter` over a labelled fixture set and scores
 * the gate's drift-catch rate. Pure: no I/O, no gate construction, no model calls.
 * Tests inject a deterministic fake; a real baseline run injects the output of
 * `buildReEducatorGate(...)` (which does make model calls — done by the caller, not
 * here). This keeps the scoring logic unit-testable in isolation.
 *
 * "Caught" = the gate REJECTED the draft (`!result.passed`). Since every fixture
 * draft contains a known error, a higher catch rate is better. The isolated gate
 * never sees each case's `priorContext`, so a low baseline is the expected, and
 * measurable, motivation for retrieval grounding.
 *
 * {@link runGateBaseline} is one-sided (error fixtures only) and can be gamed by a
 * detector that rejects everything. {@link runTwoSidedEval} closes that hole: it also
 * runs clean fixtures and reports recall AND false-positive rate AND precision, so a
 * real reviewer can be held to a two-sided bar.
 */
import type { GateResult, PlannedChapter } from '../author';
import type {
    BaselineReport,
    CatchStat,
    CleanCase,
    EvalCase,
    EvalKind,
    PerCaseResult,
} from './types';

/** The injected gate under test. Matches AuthorDeps.verifyChapter. */
export type VerifyChapter = (draft: string, chapter: PlannedChapter) => Promise<GateResult>;

function rate(caught: number, total: number): number {
    return total === 0 ? 0 : caught / total;
}

function statFor(results: PerCaseResult[]): CatchStat {
    const total = results.length;
    const caught = results.filter((r) => r.caught).length;
    return { total, caught, catchRate: rate(caught, total) };
}

/**
 * Run the injected gate over every case and compute per-kind + overall catch rates.
 * Cases are evaluated sequentially so an injected real gate does not fan out
 * unbounded concurrent model calls.
 */
export async function runGateBaseline(
    cases: EvalCase[],
    verifyChapter: VerifyChapter
): Promise<BaselineReport> {
    const perCase: PerCaseResult[] = [];
    for (const c of cases) {
        const result = await verifyChapter(c.draft, c.chapter);
        perCase.push({
            id: c.id,
            kind: c.kind,
            expectedErrorType: c.expectedError.type,
            caught: !result.passed,
            issues: result.issues,
        });
    }

    const fiction = perCase.filter((r) => r.kind === 'fiction');
    const nonfiction = perCase.filter((r) => r.kind === 'nonfiction');
    const total = perCase.length;
    const caught = perCase.filter((r) => r.caught).length;

    return {
        total,
        caught,
        catchRate: rate(caught, total),
        perKind: {
            fiction: statFor(fiction),
            nonfiction: statFor(nonfiction),
        },
        perCase,
    };
}

/** Per-clean-case outcome: did the gate wrongly reject a draft it should have accepted? */
export interface PerCleanResult {
    id: string;
    kind: EvalKind;
    /** True iff the gate rejected this clean draft (!result.passed) — a false positive. */
    wronglyRejected: boolean;
    /** The issues the gate surfaced (should be empty for a clean draft). */
    issues: string[];
}

/**
 * A two-sided score: recall over the error fixtures (drift the gate should catch) AND
 * the false-positive rate over clean fixtures (drafts it should accept). Precision ties
 * the two together — a detector that rejects everything gets recall 1 but tanks precision.
 */
export interface TwoSidedReport {
    // Error side (drift detection).
    errorTotal: number;
    /** Errors correctly rejected (true positives). */
    caught: number;
    /** caught / errorTotal — identical to the old one-sided catchRate. */
    recall: number;
    // Clean side (false positives).
    cleanTotal: number;
    /** Clean drafts wrongly rejected. */
    falsePositives: number;
    /** falsePositives / cleanTotal. */
    falsePositiveRate: number;
    // Combined.
    /** caught / (caught + falsePositives); 0 when the denominator is 0. */
    precision: number;
    perError: PerCaseResult[];
    perClean: PerCleanResult[];
}

/**
 * Run the injected gate over BOTH error cases and clean cases and compute a two-sided
 * score (recall, false-positive rate, precision). Pure and sequential like
 * {@link runGateBaseline}; the injected `verifyChapter` signature is identical.
 */
export async function runTwoSidedEval(
    errorCases: EvalCase[],
    cleanCases: CleanCase[],
    verifyChapter: VerifyChapter
): Promise<TwoSidedReport> {
    const perError: PerCaseResult[] = [];
    for (const c of errorCases) {
        const result = await verifyChapter(c.draft, c.chapter);
        perError.push({
            id: c.id,
            kind: c.kind,
            expectedErrorType: c.expectedError.type,
            caught: !result.passed,
            issues: result.issues,
        });
    }

    const perClean: PerCleanResult[] = [];
    for (const c of cleanCases) {
        const result = await verifyChapter(c.draft, c.chapter);
        perClean.push({
            id: c.id,
            kind: c.kind,
            wronglyRejected: !result.passed,
            issues: result.issues,
        });
    }

    const errorTotal = perError.length;
    const caught = perError.filter((r) => r.caught).length;
    const cleanTotal = perClean.length;
    const falsePositives = perClean.filter((r) => r.wronglyRejected).length;

    return {
        errorTotal,
        caught,
        recall: rate(caught, errorTotal),
        cleanTotal,
        falsePositives,
        falsePositiveRate: rate(falsePositives, cleanTotal),
        precision: rate(caught, caught + falsePositives),
        perError,
        perClean,
    };
}

export default { runGateBaseline, runTwoSidedEval };
