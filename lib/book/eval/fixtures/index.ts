/**
 * Gate-baseline eval — the full labelled fixture set (8 non-fiction + 8 fiction).
 *
 * The ground-truth error set the isolated done-gate is scored against. Add cases
 * here (in the per-kind files) to grow the eval; the harness computes rates over
 * whatever set it is handed.
 */
import type { EvalCase } from '../types';
import { NONFICTION_CASES } from './nonfiction';
import { FICTION_CASES } from './fiction';

export { NONFICTION_CASES } from './nonfiction';
export { FICTION_CASES } from './fiction';
export { CLEAN_CASES } from './clean';

/** All eval cases, non-fiction first then fiction. */
export const EVAL_CASES: EvalCase[] = [...NONFICTION_CASES, ...FICTION_CASES];
