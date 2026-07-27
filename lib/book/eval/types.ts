/**
 * Gate-baseline eval — shared types (Phase R0, MEASUREMENT harness).
 *
 * This directory is an ADDITIVE measurement harness: it quantifies how well the
 * CURRENT isolated done-gate (src/lib/book/gate.ts) catches known drift/fabrication
 * errors, BEFORE any retrieval-grounding work. It imports no product code beyond
 * the shared `PlannedChapter` type and never mutates the gate.
 *
 * Ground truth: each EvalCase carries a KNOWN, labelled error in `draft` that
 * contradicts `priorContext`. The isolated gate does NOT receive `priorContext`
 * (it judges a chapter in isolation) — that omission is exactly what we are
 * measuring. `priorContext` documents what the error contradicts so the fixture is
 * auditable and so a future grounded gate can be scored against the same set.
 */
import type { GateResult, PlannedChapter } from '../author';

/**
 * Structural mirror of the gate's result, re-exported here as a convenience so eval
 * code can refer to the gate's shape without reaching into product code. Kept
 * assignable from the real `GateResult` (asserted in harness.test.ts).
 */
export type GateResultLike = GateResult;

/** The class of drift/fabrication error a fixture's draft deliberately contains. */
export type ExpectedErrorType = 'continuity' | 'fabrication' | 'timeline' | 'contradiction';

/** Which authoring path a case exercises. */
export type EvalKind = 'fiction' | 'nonfiction';

/** The labelled ground-truth error a draft contains, relative to priorContext. */
export interface ExpectedError {
    type: ExpectedErrorType;
    /** Human note: what specifically is wrong and what it contradicts. */
    note: string;
}

/** One labelled evaluation case: a draft with a known error the gate SHOULD catch. */
export interface EvalCase {
    id: string;
    kind: EvalKind;
    chapter: PlannedChapter;
    /** Bible / prior-chapter facts the draft's error contradicts. NOT fed to the gate. */
    priorContext: string;
    /** A short chapter draft containing the labelled error. */
    draft: string;
    expectedError: ExpectedError;
}

/**
 * A clean, error-FREE case the gate SHOULD accept. The negative control that makes
 * the eval two-sided: without these, a detector that rejects everything would score
 * a perfect drift-catch rate. A clean draft that is rejected is a FALSE POSITIVE.
 */
export interface CleanCase {
    id: string;
    kind: EvalKind;
    chapter: PlannedChapter;
    /** A short, coherent draft with no continuity/fabrication/timeline/contradiction error. */
    draft: string;
    /** Human note: why this draft is clean (expected to pass the gate). */
    note: string;
}

/** Aggregate stats for one kind (or overall). */
export interface CatchStat {
    total: number;
    caught: number;
    /** caught / total; 0 when total is 0. */
    catchRate: number;
}

/** Per-case outcome of running the gate over one fixture. */
export interface PerCaseResult {
    id: string;
    kind: EvalKind;
    expectedErrorType: ExpectedErrorType;
    /** True iff the gate rejected the draft (!result.passed). */
    caught: boolean;
    /** The issues the gate surfaced (empty when it passed the draft). */
    issues: string[];
}

/** The whole baseline run's report. */
export interface BaselineReport {
    total: number;
    caught: number;
    /** Overall drift-catch rate = caught / total. */
    catchRate: number;
    perKind: {
        fiction: CatchStat;
        nonfiction: CatchStat;
    };
    perCase: PerCaseResult[];
}
