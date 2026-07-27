import { describe, it, expect } from 'vitest';
import { STANDARD, PARAPHRASE, PROFILES, resolvePolicy } from './profiles';
import type { IssueCategory } from './types';

const ALL_CATEGORIES: IssueCategory[] = [
  'terminology',
  'links',
  'readability',
  'voice-drift',
  'clarity',
  'unsupported-assertion',
  'pii',
];

describe('profiles cover every category', () => {
  it('STANDARD has a policy for each IssueCategory', () => {
    for (const c of ALL_CATEGORIES) {
      expect(STANDARD[c]).toBeDefined();
    }
  });

  it('PARAPHRASE has a policy for each IssueCategory', () => {
    for (const c of ALL_CATEGORIES) {
      expect(PARAPHRASE[c]).toBeDefined();
    }
  });

  it('every maxDiff is within [0,1]', () => {
    for (const profile of [STANDARD, PARAPHRASE]) {
      for (const c of ALL_CATEGORIES) {
        expect(profile[c].maxDiff).toBeGreaterThanOrEqual(0);
        expect(profile[c].maxDiff).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('meaning-bearing categories are frozen in both profiles', () => {
  it('unsupported-assertion is author-required, maxDiff 0 everywhere', () => {
    for (const profile of [STANDARD, PARAPHRASE]) {
      expect(profile['unsupported-assertion'].verdict).toBe('author-required');
      expect(profile['unsupported-assertion'].maxDiff).toBe(0);
    }
  });

  it('pii is author-required, maxDiff 0 everywhere', () => {
    for (const profile of [STANDARD, PARAPHRASE]) {
      expect(profile.pii.verdict).toBe('author-required');
      expect(profile.pii.maxDiff).toBe(0);
    }
  });
});

describe('PARAPHRASE loosens exactly the intended categories', () => {
  it('readability becomes auto-fixable with a wider bound', () => {
    expect(STANDARD.readability.verdict).toBe('propose');
    expect(PARAPHRASE.readability.verdict).toBe('auto-fixable');
    expect(PARAPHRASE.readability.maxDiff).toBeGreaterThan(STANDARD.readability.maxDiff);
  });

  it('voice-drift becomes auto-fixable with a wider bound', () => {
    expect(STANDARD['voice-drift'].verdict).toBe('propose');
    expect(PARAPHRASE['voice-drift'].verdict).toBe('auto-fixable');
    expect(PARAPHRASE['voice-drift'].maxDiff).toBeGreaterThan(STANDARD['voice-drift'].maxDiff);
  });

  it('clarity keeps propose but widens the bound', () => {
    expect(PARAPHRASE.clarity.verdict).toBe('propose');
    expect(PARAPHRASE.clarity.maxDiff).toBeGreaterThan(STANDARD.clarity.maxDiff);
  });

  it('leaves terminology and links exactly as STANDARD', () => {
    expect(PARAPHRASE.terminology).toEqual(STANDARD.terminology);
    expect(PARAPHRASE.links).toEqual(STANDARD.links);
  });

  it('does not mutate STANDARD when deriving PARAPHRASE', () => {
    expect(STANDARD.readability.verdict).toBe('propose');
    expect(STANDARD['voice-drift'].verdict).toBe('propose');
  });
});

describe('PROFILES registry', () => {
  it('maps names to the right profile objects', () => {
    expect(PROFILES.standard).toBe(STANDARD);
    expect(PROFILES.paraphrase).toBe(PARAPHRASE);
  });
});

describe('resolvePolicy anchor-freeze invariant', () => {
  it('returns the profile policy when no anchor overlap', () => {
    expect(resolvePolicy('readability', PARAPHRASE, false)).toEqual(
      PARAPHRASE.readability,
    );
  });

  it('forces author-required / maxDiff 0 when the span overlaps a frozen anchor', () => {
    const p = resolvePolicy('readability', PARAPHRASE, true);
    expect(p.verdict).toBe('author-required');
    expect(p.maxDiff).toBe(0);
  });

  it('no profile can unfreeze an anchor — even the loosest category', () => {
    for (const category of ALL_CATEGORIES) {
      const p = resolvePolicy(category, PARAPHRASE, true);
      expect(p.verdict).toBe('author-required');
      expect(p.maxDiff).toBe(0);
    }
  });

  it('the freeze is applied before the profile is consulted', () => {
    // Even a category that is auto-fixable in the profile ends up frozen.
    expect(PARAPHRASE['voice-drift'].verdict).toBe('auto-fixable');
    expect(resolvePolicy('voice-drift', PARAPHRASE, true).verdict).toBe(
      'author-required',
    );
  });
});
