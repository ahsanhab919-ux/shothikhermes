import { describe, it, expect } from 'vitest';
import { readability } from './readability';

const longSentence = `${Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ')}.`;

describe('readability guard', () => {
  it('returns no issues for clean, short, active prose', () => {
    const issues = readability('The cat sat. The dog ran.');
    expect(issues).toEqual([]);
  });

  it('flags a sentence over the default 30-word limit', () => {
    const issues = readability(longSentence).filter((i) =>
      i.rationale.includes('words'),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('readability');
    expect(issues[0].source).toBe('readability');
  });

  it('escalates severity to major past 1.5x the limit', () => {
    // 50 words > 30 * 1.5 = 45 -> major
    const words = Array.from({ length: 50 }, (_, i) => `w${i}`).join(' ') + '.';
    const issue = readability(words).find((i) => i.rationale.includes('words'));
    expect(issue?.severity).toBe('major');
  });

  it('uses minor severity between the limit and 1.5x', () => {
    // 35 words: > 30 but < 45 -> minor
    const issue = readability(longSentence).find((i) => i.rationale.includes('words'));
    expect(issue?.severity).toBe('minor');
  });

  it('respects a custom maxSentenceWords option', () => {
    const text = 'One two three four five.';
    expect(readability(text)).toEqual([]);
    const issues = readability(text, { maxSentenceWords: 3 });
    expect(issues.some((i) => i.rationale.includes('words'))).toBe(true);
  });

  it('flags passive voice with a "to be" form plus participle', () => {
    const issues = readability('The report was written by the team.');
    const passive = issues.find((i) => i.rationale.includes('passive'));
    expect(passive).toBeDefined();
    expect(passive?.severity).toBe('info');
  });

  it('does not flag active-voice sentences as passive', () => {
    const issues = readability('The team wrote the report.');
    expect(issues.find((i) => i.rationale.includes('passive'))).toBeUndefined();
  });

  it('emits at most one passive flag per sentence', () => {
    const issues = readability('It was seen and was taken and was done.');
    const passives = issues.filter((i) => i.rationale.includes('passive'));
    expect(passives).toHaveLength(1);
  });

  it('produces spans that index back into the source text', () => {
    const text = 'The report was written by the team.';
    const issue = readability(text).find((i) => i.rationale.includes('passive'));
    expect(issue).toBeDefined();
    expect(text.slice(issue!.span.start, issue!.span.end)).toBe(issue!.text);
  });

  it('is deterministic across repeated calls', () => {
    const a = readability(longSentence);
    const b = readability(longSentence);
    expect(a).toEqual(b);
  });
});
