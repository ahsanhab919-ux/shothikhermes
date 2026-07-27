/**
 * Gate-baseline eval — NON-FICTION fixtures (8 cases).
 *
 * Each draft contains ONE known, labelled error relative to `priorContext`:
 * an invented citation/figure (fabrication), a claim that contradicts an
 * established fact (contradiction), a mis-ordered event (timeline), or a
 * definition/entity drift from earlier chapters (continuity). Drafts are kept
 * short and plausible so the gate is tested on the error, not on length or noise.
 */
import type { EvalCase } from '../types';

export const NONFICTION_CASES: EvalCase[] = [
    {
        id: 'nf-01-fabricated-citation',
        kind: 'nonfiction',
        chapter: { index: 3, intent: 'Summarize the evidence for spaced repetition' },
        priorContext:
            'Sources established in Chapter 1: Ebbinghaus (1885) on the forgetting curve; ' +
            'Cepeda et al. (2006) meta-analysis on distributed practice. No 2019 Stanford study is cited anywhere.',
        draft:
            'Spaced repetition is now beyond dispute. A 2019 Stanford study of 40,000 students found ' +
            'that spacing reviews tripled long-term retention versus massed study, settling the debate ' +
            'that Ebbinghaus first opened in 1885.',
        expectedError: {
            type: 'fabrication',
            note: 'The "2019 Stanford study of 40,000 students … tripled retention" is invented; no such source exists in priorContext.',
        },
    },
    {
        id: 'nf-02-contradicts-established-figure',
        kind: 'nonfiction',
        chapter: { index: 4, intent: 'Recap the project budget' },
        priorContext:
            'Chapter 2 stated the total program budget was $2.4 million, allocated over three years.',
        draft:
            'As we saw earlier, the program ran on a lean $240,000 budget, which is why every hire ' +
            'had to be justified twice over.',
        expectedError: {
            type: 'contradiction',
            note: 'Budget stated as $240,000 contradicts the established $2.4 million from priorContext (off by 10x).',
        },
    },
    {
        id: 'nf-03-timeline-out-of-order',
        kind: 'nonfiction',
        chapter: { index: 5, intent: 'Trace the history of the standard' },
        priorContext:
            'Established timeline: the protocol was drafted in 2008, ratified in 2011, and deprecated in 2020.',
        draft:
            'The protocol was deprecated in 2020, and it was this deprecation that finally spurred the ' +
            'community to ratify it in 2011 after years of informal use.',
        expectedError: {
            type: 'timeline',
            note: 'Claims the 2020 deprecation caused the 2011 ratification — effect precedes cause; ordering contradicts priorContext.',
        },
    },
    {
        id: 'nf-04-definition-drift',
        kind: 'nonfiction',
        chapter: { index: 6, intent: 'Apply the earlier definition of "active recall"' },
        priorContext:
            'Chapter 1 defined "active recall" as retrieving information from memory without looking at the source.',
        draft:
            'Because active recall simply means re-reading your notes until they feel familiar, it pairs ' +
            'naturally with highlighting and margin annotation.',
        expectedError: {
            type: 'continuity',
            note: 'Redefines "active recall" as re-reading, contradicting the Chapter 1 definition (retrieval without the source).',
        },
    },
    {
        id: 'nf-05-fabricated-statistic',
        kind: 'nonfiction',
        chapter: { index: 2, intent: 'Motivate the chapter with a hard number' },
        priorContext:
            'No survey data has been introduced. The book has, so far, only cited qualitative interviews.',
        draft:
            'Our proprietary survey shows that exactly 87.3% of knowledge workers forget a new skill ' +
            'within 72 hours unless they apply it immediately.',
        expectedError: {
            type: 'fabrication',
            note: 'The precise "87.3% within 72 hours" statistic and "proprietary survey" are invented; no such data in priorContext.',
        },
    },
    {
        id: 'nf-06-contradicts-author-claim',
        kind: 'nonfiction',
        chapter: { index: 7, intent: 'Restate the book’s central thesis' },
        priorContext:
            'The book’s thesis, stated in the Introduction, is that talent is largely built through ' +
            'deliberate practice rather than innate.',
        draft:
            'As this book has argued from the start, elite performance is fundamentally innate: no amount ' +
            'of practice can move someone without the underlying genetic gift.',
        expectedError: {
            type: 'contradiction',
            note: 'Directly reverses the established thesis (built via practice) into an innate-talent claim.',
        },
    },
    {
        id: 'nf-07-timeline-anachronism',
        kind: 'nonfiction',
        chapter: { index: 8, intent: 'Describe the researcher’s early influences' },
        priorContext:
            'Established: the researcher earned her PhD in 1994 and published her landmark paper in 1997.',
        draft:
            'While writing her landmark 1997 paper, she drew heavily on the deep-learning breakthroughs of ' +
            'the mid-2010s, which shaped her methodology.',
        expectedError: {
            type: 'timeline',
            note: 'A 1997 paper cannot draw on mid-2010s breakthroughs; anachronism contradicts the established dates.',
        },
    },
    {
        id: 'nf-08-entity-continuity',
        kind: 'nonfiction',
        chapter: { index: 9, intent: 'Continue the running case study of Acme Corp' },
        priorContext:
            'The running case study concerns Acme Corp, a mid-size logistics company founded in Ohio.',
        draft:
            'Returning to our case study: Acme Corp, the Berlin-based pharmaceutical startup, illustrates ' +
            'how a young biotech firm scales its clinical trials.',
        expectedError: {
            type: 'continuity',
            note: 'Acme Corp changes from an Ohio logistics company to a Berlin pharma startup — entity drift from priorContext.',
        },
    },
];
