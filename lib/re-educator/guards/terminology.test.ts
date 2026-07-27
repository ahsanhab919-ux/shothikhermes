import { describe, it, expect } from 'vitest';
import { terminology, type TerminologyRule } from './terminology';

const RULES: TerminologyRule[] = [
  { avoid: 'utilize', prefer: 'use', note: 'plain language.' },
  { avoid: 'AI', prefer: 'artificial intelligence' },
];

describe('terminology guard', () => {
  it('returns no issues when no rules are supplied', () => {
    expect(terminology('utilize the utility')).toEqual([]);
  });

  it('flags a disallowed term and suggests the preferred one', () => {
    const issues = terminology('Please utilize the form.', { rules: RULES });
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('terminology');
    expect(issues[0].text).toBe('utilize');
    expect(issues[0].suggestion).toBe('use');
    expect(issues[0].rationale).toContain('plain language');
  });

  it('matches case-insensitively but preserves capitalization in the suggestion', () => {
    const issues = terminology('Utilize this now.', { rules: RULES });
    expect(issues[0].text).toBe('Utilize');
    expect(issues[0].suggestion).toBe('Use');
  });

  it('uppercases the suggestion when the match is all caps', () => {
    const issues = terminology('UTILIZE it.', { rules: RULES });
    expect(issues[0].suggestion).toBe('USE');
  });

  it('only matches whole words (word boundaries)', () => {
    // "AI" should not match inside "maintain" or "email"
    const issues = terminology('maintain the email chain', { rules: RULES });
    expect(issues).toEqual([]);
  });

  it('flags every occurrence and reports correct spans', () => {
    const text = 'utilize and utilize again';
    const issues = terminology(text, { rules: RULES });
    expect(issues).toHaveLength(2);
    for (const issue of issues) {
      expect(text.slice(issue.span.start, issue.span.end)).toBe(issue.text);
    }
  });

  it('skips rules with an empty avoid term', () => {
    const issues = terminology('anything', { rules: [{ avoid: '', prefer: 'x' }] });
    expect(issues).toEqual([]);
  });

  it('is deterministic across repeated calls', () => {
    const a = terminology('Utilize and utilize', { rules: RULES });
    const b = terminology('Utilize and utilize', { rules: RULES });
    expect(a).toEqual(b);
  });
});
