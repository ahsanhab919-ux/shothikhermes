import { describe, it, expect } from 'vitest';
import { voiceDrift } from './voice-drift';

describe('voice-drift guard', () => {
  it('returns no issues with no profile context', () => {
    expect(voiceDrift('Any old sentence here.')).toEqual([]);
  });

  it('flags a banned phrase (case-insensitive)', () => {
    const issues = voiceDrift('We must LEVERAGE synergies.', {
      bannedPhrases: ['leverage synergies'],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('voice-drift');
    expect(issues[0].rationale).toContain('Discouraged phrase');
  });

  it('flags every occurrence of a banned phrase', () => {
    const text = 'leverage this, then leverage that';
    const issues = voiceDrift(text, { bannedPhrases: ['leverage'] });
    expect(issues).toHaveLength(2);
    for (const issue of issues) {
      expect(text.slice(issue.span.start, issue.span.end).toLowerCase()).toBe(
        'leverage',
      );
    }
  });

  it('ignores empty banned phrases', () => {
    expect(voiceDrift('anything', { bannedPhrases: [''] })).toEqual([]);
  });

  it('skips sentences shorter than 5 content tokens for drift', () => {
    const issues = voiceDrift('Short one here.', {
      referenceText: 'completely unrelated vocabulary about gardening tools and soil',
      driftThreshold: 0.1,
    });
    // too few tokens to judge -> no drift issues
    expect(issues.filter((i) => i.rationale.includes('drift'))).toEqual([]);
  });

  it('flags a sentence that lexically diverges from the reference', () => {
    const reference =
      'quarterly revenue growth margins earnings guidance forecast operating income';
    const text =
      'The purple dinosaur juggled seven watermelons across the sandy beach yesterday.';
    const issues = voiceDrift(text, { referenceText: reference, driftThreshold: 0.5 });
    expect(issues.some((i) => i.rationale.includes('drift'))).toBe(true);
  });

  it('does not flag drift for a sentence close to the reference vocabulary', () => {
    const reference = 'revenue growth margins earnings guidance forecast operating income';
    const text = 'Revenue growth and operating income beat the earnings guidance forecast.';
    const issues = voiceDrift(text, { referenceText: reference, driftThreshold: 0.85 });
    expect(issues.filter((i) => i.rationale.includes('drift'))).toEqual([]);
  });

  it('returns issues sorted by span start', () => {
    const text = 'foo bar baz and foo again here now';
    const issues = voiceDrift(text, { bannedPhrases: ['foo'] });
    const starts = issues.map((i) => i.span.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('is deterministic across repeated calls', () => {
    const ctx = {
      referenceText: 'revenue growth margins earnings guidance forecast',
      bannedPhrases: ['leverage'],
      driftThreshold: 0.5,
    };
    const text = 'Leverage the purple dinosaur juggling watermelons on beaches.';
    expect(voiceDrift(text, ctx)).toEqual(voiceDrift(text, ctx));
  });
});
