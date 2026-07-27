/**
 * Gate-baseline eval — CLEAN fixtures (6 cases: 3 fiction + 3 non-fiction).
 *
 * The negative control for the two-sided eval. Each draft is short, coherent, and
 * internally consistent, with NO continuity / fabrication / timeline / contradiction
 * error — the gate SHOULD accept every one. A clean draft that the gate rejects is a
 * FALSE POSITIVE. These make the eval two-sided: recall over the error fixtures alone
 * can be gamed by rejecting everything, but that would light up every case here.
 */
import type { CleanCase } from '../types';

export const CLEAN_CASES: CleanCase[] = [
    {
        id: 'clean-fic-01-consistent-scene',
        kind: 'fiction',
        chapter: { index: 4, intent: 'Mara confronts the harbourmaster' },
        draft:
            'Mara leaned into the lamplight, her green eyes narrowing as the harbourmaster stammered. ' +
            '"You knew," she said, and her gaze did not waver until he looked away.',
        note: 'Coherent scene; eye colour (green) matches the established detail and nothing is invented.',
    },
    {
        id: 'clean-fic-02-plain-action',
        kind: 'fiction',
        chapter: { index: 5, intent: 'Mara and Tomas prepare to leave' },
        draft:
            'Tomas shouldered the pack while Mara banked the fire. "Ready?" she asked. Her younger brother ' +
            'nodded, and the two of them slipped out into the grey morning without a word.',
        note: 'Simple, self-consistent action; brother named Tomas, no timeline or fact conflict.',
    },
    {
        id: 'clean-fic-03-quiet-reflection',
        kind: 'fiction',
        chapter: { index: 6, intent: 'A quiet beat before the journey' },
        draft:
            'The orchard was in full leaf, heavy with the warmth of high summer. Mara sat beneath the oldest ' +
            'tree and let herself, for one breath, simply be still before the road ahead.',
        note: 'Atmospheric passage; season (high summer) is internally consistent, no claims to contradict.',
    },
    {
        id: 'clean-nf-01-supported-summary',
        kind: 'nonfiction',
        chapter: { index: 3, intent: 'Summarize the evidence for spaced repetition' },
        draft:
            'The case for spacing your reviews is old and well supported: Ebbinghaus mapped the forgetting ' +
            'curve in 1885, and later work on distributed practice has repeatedly found that spreading study ' +
            'sessions out improves long-term retention.',
        note: 'Accurate, hedged summary; references only established sources, no invented figures.',
    },
    {
        id: 'clean-nf-02-consistent-definition',
        kind: 'nonfiction',
        chapter: { index: 6, intent: 'Apply the earlier definition of "active recall"' },
        draft:
            'Active recall — retrieving information from memory without looking at the source — is most ' +
            'effective when it is a little effortful. Closing the book and trying to reconstruct the argument ' +
            'is exactly the kind of retrieval that builds durable memory.',
        note: 'Uses the established definition of active recall consistently; no drift, no fabrication.',
    },
    {
        id: 'clean-nf-03-consistent-case-study',
        kind: 'nonfiction',
        chapter: { index: 9, intent: 'Continue the running case study of Acme Corp' },
        draft:
            'Returning to Acme Corp, the Ohio logistics company we have been following: its regional focus ' +
            'kept overheads low, and that discipline is what let it absorb a bad quarter without layoffs.',
        note: 'Keeps Acme Corp as the same Ohio logistics firm; consistent entity, no contradiction.',
    },
];
