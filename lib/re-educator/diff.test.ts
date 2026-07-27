import { describe, it, expect } from 'vitest';
import { levenshtein, normalizedDistance, withinBound } from './diff';

describe('levenshtein', () => {
  it('is 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0);
  });

  it('equals length when one side is empty', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('counts single-character substitutions', () => {
    expect(levenshtein('kitten', 'sitten')).toBe(1);
  });

  it('matches the classic kitten/sitting distance of 3', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('is symmetric', () => {
    expect(levenshtein('flaw', 'lawn')).toBe(levenshtein('lawn', 'flaw'));
  });
});

describe('normalizedDistance', () => {
  it('is 0 for two empty strings', () => {
    expect(normalizedDistance('', '')).toBe(0);
  });

  it('is 0 for identical strings', () => {
    expect(normalizedDistance('same', 'same')).toBe(0);
  });

  it('is 1 for fully different equal-length strings', () => {
    expect(normalizedDistance('abc', 'xyz')).toBe(1);
  });

  it('normalizes by the longer string length', () => {
    // 'sitten' -> 'sitting' is 2 edits over max length 7 -> 2/7
    expect(normalizedDistance('sitten', 'sitting')).toBeCloseTo(2 / 7, 10);
  });

  it('stays within [0,1]', () => {
    const d = normalizedDistance('a longer sentence here', 'totally different text!!');
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});

describe('withinBound', () => {
  it('is true when the change is under the bound', () => {
    expect(withinBound('color', 'colour', 0.5)).toBe(true);
  });

  it('is true at exactly the bound (inclusive)', () => {
    // 'abc' -> 'abx' is 1/3
    expect(withinBound('abc', 'abx', 1 / 3)).toBe(true);
  });

  it('is false when the change exceeds the bound', () => {
    expect(withinBound('abc', 'xyz', 0.5)).toBe(false);
  });

  it('is true for a no-op edit even at bound 0', () => {
    expect(withinBound('frozen', 'frozen', 0)).toBe(true);
  });

  it('is false for any change at bound 0 (frozen anchor semantics)', () => {
    expect(withinBound('frozen', 'frozeN', 0)).toBe(false);
  });
});
