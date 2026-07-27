import { describe, it, expect, vi } from 'vitest';
import {
  SEMANTIC_CATEGORIES,
  validateProviderIssue,
  providerToReviewer,
  fakeProvider,
  applyCaps,
  DEFAULT_PROVIDER_CAPS,
  type SemanticProvider,
  type SemanticProviderInput,
  type SemanticUsage,
} from './provider';
import { runEngine, review, type EngineConfig, type RegisteredGuard } from './engine';
import { STANDARD } from './profiles';
import { readability } from './guards/readability';
import type { Issue, Span } from './types';
import type { LedgerMeta } from './ledger';

const META: LedgerMeta = {
  manuscript: 'doc_provider',
  writing_md_version: 'wmd_v1',
  anchors: [],
};

// A source long enough to hold several spans.
const TEXT = 'The quick brown fox jumps over the lazy dog near the river.';
//            0123456789...                                          58
const CANDIDATE: Span = { start: 4, end: 19 }; // "quick brown fox"

/** A well-formed clarity issue the provider might return for the candidate. */
function goodIssue(over: Partial<Issue> = {}): Issue {
  return {
    category: 'clarity',
    span: { start: 4, end: 19 },
    severity: 'minor',
    rationale: 'unclear phrasing',
    text: 'IGNORED — adapter re-derives this from source',
    ...over,
  };
}

describe('validateProviderIssue — fail-closed output validation', () => {
  it('accepts a well-formed issue overlapping a candidate span', () => {
    const out = validateProviderIssue(goodIssue(), TEXT, [CANDIDATE], 'fake');
    expect(out).not.toBeNull();
    expect(out?.category).toBe('clarity');
    expect(out?.source).toBe('fake');
  });

  it('re-derives issue.text from the source, never trusting the echo', () => {
    const out = validateProviderIssue(goodIssue(), TEXT, [CANDIDATE], 'fake');
    // span 4..19 of TEXT is exactly "quick brown fox".
    expect(out?.text).toBe('quick brown fox');
  });

  it('drops a non-object', () => {
    expect(validateProviderIssue(null, TEXT, [CANDIDATE], 'fake')).toBeNull();
    expect(validateProviderIssue('nope', TEXT, [CANDIDATE], 'fake')).toBeNull();
  });

  it('drops an issue with a missing or malformed span', () => {
    expect(validateProviderIssue({ category: 'clarity' }, TEXT, [CANDIDATE], 'fake')).toBeNull();
    expect(
      validateProviderIssue(goodIssue({ span: { start: 4 } as unknown as Span }), TEXT, [CANDIDATE], 'fake'),
    ).toBeNull();
  });

  it('drops a span out of the text bounds', () => {
    expect(
      validateProviderIssue(goodIssue({ span: { start: 50, end: 999 } }), TEXT, [{ start: 50, end: 58 }], 'fake'),
    ).toBeNull();
  });

  it('drops an inverted or empty span', () => {
    expect(validateProviderIssue(goodIssue({ span: { start: 19, end: 4 } }), TEXT, [CANDIDATE], 'fake')).toBeNull();
    expect(validateProviderIssue(goodIssue({ span: { start: 10, end: 10 } }), TEXT, [CANDIDATE], 'fake')).toBeNull();
  });

  it('drops a non-integer span', () => {
    expect(
      validateProviderIssue(goodIssue({ span: { start: 4.5, end: 19 } }), TEXT, [CANDIDATE], 'fake'),
    ).toBeNull();
  });

  it('drops an issue whose span does not overlap any candidate span', () => {
    // Well-formed in itself, but outside the region the provider was shown.
    const outside = goodIssue({ span: { start: 40, end: 48 } });
    expect(validateProviderIssue(outside, TEXT, [CANDIDATE], 'fake')).toBeNull();
  });

  it('drops an off-vocabulary category (e.g. a mechanical one)', () => {
    expect(
      validateProviderIssue(goodIssue({ category: 'terminology' }), TEXT, [CANDIDATE], 'fake'),
    ).toBeNull();
    expect(
      validateProviderIssue({ ...goodIssue(), category: 'made-up' }, TEXT, [CANDIDATE], 'fake'),
    ).toBeNull();
  });

  it('only allows the semantic category set', () => {
    for (const c of SEMANTIC_CATEGORIES) {
      const out = validateProviderIssue(goodIssue({ category: c }), TEXT, [CANDIDATE], 'fake');
      expect(out?.category).toBe(c);
    }
  });

  it('defaults an unknown severity to minor', () => {
    const out = validateProviderIssue(
      { ...goodIssue(), severity: 'catastrophic' },
      TEXT,
      [CANDIDATE],
      'fake',
    );
    expect(out?.severity).toBe('minor');
  });

  it('keeps a string suggestion but not a non-string one', () => {
    expect(validateProviderIssue(goodIssue({ suggestion: 'clearer text' }), TEXT, [CANDIDATE], 'fake')?.suggestion).toBe(
      'clearer text',
    );
    expect(
      validateProviderIssue({ ...goodIssue(), suggestion: 42 }, TEXT, [CANDIDATE], 'fake')?.suggestion,
    ).toBeUndefined();
  });
});

describe('providerToReviewer — adapter-layer enforcement', () => {
  it('never calls the provider when there are no candidate spans', async () => {
    const spy = vi.fn(async () => [goodIssue()]);
    const provider: SemanticProvider = { name: 'spy', review: spy };
    const reviewer = providerToReviewer(provider, { candidateSpans: [] });
    const out = await reviewer(TEXT);
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows the provider ONLY the candidate spans (input scoping)', async () => {
    let seen: SemanticProviderInput | undefined;
    const provider: SemanticProvider = {
      name: 'capture',
      async review(input) {
        seen = input;
        return [];
      },
    };
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE], writingMd: 'voice rules' });
    await reviewer(TEXT);
    expect(seen?.spans).toEqual([CANDIDATE]);
    expect(seen?.text).toBe(TEXT);
    expect(seen?.writingMd).toBe('voice rules');
  });

  it('validates + clamps provider output before it enters the pipeline', async () => {
    const provider = fakeProvider({
      issues: [
        goodIssue(), // valid
        goodIssue({ span: { start: 40, end: 48 } }), // outside candidate → dropped
        { category: 'terminology', span: { start: 4, end: 19 }, severity: 'minor', rationale: '', text: '' }, // off-vocab → dropped
        'garbage', // → dropped
      ],
    });
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    const out = await reviewer(TEXT);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('clarity');
    expect(out[0].text).toBe('quick brown fox');
  });

  it('fails closed to [] when the provider throws', async () => {
    const provider = fakeProvider({ throwError: true });
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    await expect(reviewer(TEXT)).resolves.toEqual([]);
  });

  it('fails closed to [] when the provider returns a non-array', async () => {
    const provider: SemanticProvider = {
      name: 'bad',
      async review() {
        return 'not an array' as unknown as Issue[];
      },
    };
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    await expect(reviewer(TEXT)).resolves.toEqual([]);
  });
});

describe('fakeProvider satisfies the SemanticReviewer seam end-to-end', () => {
  function config(over: Partial<EngineConfig> = {}): EngineConfig {
    const guards: RegisteredGuard[] = [
      { name: 'readability', category: 'readability', run: readability },
    ];
    return { profile: STANDARD, guards, anchors: [], meta: META, ...over };
  }

  it('merges provider issues into REVIEW output', async () => {
    const provider = fakeProvider({ issues: [goodIssue()] });
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    const issues = await review(config({ semanticReview: reviewer }), TEXT);
    expect(issues.some((i) => i.category === 'clarity' && i.source === 'fake')).toBe(true);
  });

  it('a clarity issue from the provider becomes a proposed outcome (not auto-applied)', async () => {
    const provider = fakeProvider({ issues: [goodIssue({ suggestion: 'the fox' })] });
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    const result = await runEngine(config({ semanticReview: reviewer }), TEXT);
    const clarity = result.outcomes.find((o) => o.issue.category === 'clarity');
    expect(clarity?.disposition).toBe('proposed');
    // clarity is 'propose' under STANDARD — the text is NOT changed by the model.
    expect(result.text).toBe(TEXT);
  });

  it('an author-required semantic issue is never edited', async () => {
    const provider = fakeProvider({
      issues: [goodIssue({ category: 'unsupported-assertion', suggestion: 'anything' })],
    });
    const reviewer = providerToReviewer(provider, { candidateSpans: [CANDIDATE] });
    const result = await runEngine(config({ semanticReview: reviewer }), TEXT);
    const outcome = result.outcomes.find((o) => o.issue.category === 'unsupported-assertion');
    expect(outcome?.disposition).toBe('author-required');
    expect(result.text).toBe(TEXT);
  });

  it('an unavailable provider (empty candidates) leaves the run deterministic-only', async () => {
    const provider = fakeProvider({ issues: [goodIssue()] });
    const reviewer = providerToReviewer(provider, { candidateSpans: [] });
    const withProvider = await review(config({ semanticReview: reviewer }), TEXT);
    const deterministicOnly = await review(config(), TEXT);
    expect(withProvider).toEqual(deterministicOnly);
  });
});

describe('applyCaps — deterministic cost bounds (Phase 2 #6)', () => {
  const s = (start: number, end: number): Span => ({ start, end });

  it('returns everything unchanged when under both caps', () => {
    const spans = [s(0, 5), s(10, 15)];
    expect(applyCaps(spans, { maxSpans: 10, maxChars: 100 })).toEqual(spans);
  });

  it('caps by span count, keeping lowest-start-first', () => {
    const spans = [s(30, 35), s(0, 5), s(10, 15)];
    const kept = applyCaps(spans, { maxSpans: 2 });
    expect(kept).toEqual([s(0, 5), s(10, 15)]);
  });

  it('caps by total chars, dropping the overflowing span whole (never truncates)', () => {
    const spans = [s(0, 10), s(20, 25)]; // 10 chars then 5 chars
    const kept = applyCaps(spans, { maxChars: 12 });
    // 10 fits; 10+5=15 > 12 so the 5-char span is dropped whole.
    expect(kept).toEqual([s(0, 10)]);
  });

  it('keeps a later shorter span that still fits after a big one was dropped', () => {
    const spans = [s(0, 3), s(10, 30), s(40, 42)]; // 3, 20, 2
    const kept = applyCaps(spans, { maxChars: 6 });
    // 3 fits (used 3); 20 overflows (skip); 2 fits (used 5). Order preserved.
    expect(kept).toEqual([s(0, 3), s(40, 42)]);
  });

  it('drops zero-length spans (nothing to read) and never mutates the input', () => {
    const spans = [s(5, 5), s(0, 4)];
    const kept = applyCaps(spans, {});
    expect(kept).toEqual([s(0, 4)]);
    expect(spans).toEqual([s(5, 5), s(0, 4)]); // input untouched
  });

  it('treats absent/non-positive caps as no cap', () => {
    const spans = [s(0, 5), s(10, 15), s(20, 25)];
    expect(applyCaps(spans, { maxSpans: 0, maxChars: 0 })).toEqual(spans);
    expect(applyCaps(spans)).toEqual(spans);
  });
});

describe('providerToReviewer — caps + usage reporting (Phase 2 #6)', () => {
  it('applies the default caps and shows the provider only the kept spans', async () => {
    // 41 one-char candidate spans; DEFAULT_PROVIDER_CAPS.maxSpans is 40.
    const many: Span[] = Array.from({ length: 41 }, (_, i) => ({ start: i, end: i + 1 }));
    let seen: Span[] = [];
    const provider: SemanticProvider = {
      name: 'spy',
      async review(input: SemanticProviderInput) {
        seen = input.spans;
        return [];
      },
    };
    const reviewer = providerToReviewer(provider, { candidateSpans: many });
    await reviewer(TEXT);
    expect(seen.length).toBe(DEFAULT_PROVIDER_CAPS.maxSpans);
  });

  it('reports post-cap usage through onUsage, marking capped=true when spans were dropped', async () => {
    const many: Span[] = Array.from({ length: 41 }, (_, i) => ({ start: i, end: i + 1 }));
    const usages: SemanticUsage[] = [];
    const provider = fakeProvider({ name: 'openai', issues: [] });
    const reviewer = providerToReviewer(provider, {
      candidateSpans: many,
      onUsage: (u) => usages.push(u),
    });
    await reviewer(TEXT);
    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({
      provider: 'openai',
      spansReviewed: DEFAULT_PROVIDER_CAPS.maxSpans,
      capped: true,
    });
    expect(usages[0].charsSent).toBe(DEFAULT_PROVIDER_CAPS.maxSpans); // 1 char each
  });

  it('reports capped=false and the exact chars when under caps', async () => {
    const usages: SemanticUsage[] = [];
    const provider = fakeProvider({ name: 'anthropic', issues: [] });
    const reviewer = providerToReviewer(provider, {
      candidateSpans: [CANDIDATE], // 15 chars
      onUsage: (u) => usages.push(u),
    });
    await reviewer(TEXT);
    expect(usages[0]).toEqual({
      provider: 'anthropic',
      spansReviewed: 1,
      charsSent: CANDIDATE.end - CANDIDATE.start,
      capped: false,
    });
  });

  it('reports zero-usage (spansReviewed 0) when every candidate span is empty', async () => {
    const usages: SemanticUsage[] = [];
    const provider = fakeProvider({ name: 'openai', issues: [goodIssue()] });
    const reviewer = providerToReviewer(provider, {
      candidateSpans: [{ start: 3, end: 3 }],
      onUsage: (u) => usages.push(u),
    });
    const out = await reviewer(TEXT);
    expect(out).toEqual([]); // nothing reviewed
    expect(usages[0]).toMatchObject({ spansReviewed: 0, charsSent: 0, capped: true });
  });

  it('still reports usage even when the provider then throws (fails closed to [])', async () => {
    const usages: SemanticUsage[] = [];
    const provider = fakeProvider({ name: 'openai', throwError: true });
    const reviewer = providerToReviewer(provider, {
      candidateSpans: [CANDIDATE],
      onUsage: (u) => usages.push(u),
    });
    const out = await reviewer(TEXT);
    expect(out).toEqual([]);
    expect(usages[0]).toMatchObject({ provider: 'openai', spansReviewed: 1 });
  });
});
