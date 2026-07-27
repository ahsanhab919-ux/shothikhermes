import { describe, it, expect } from 'vitest';
import { pii } from './pii';

describe('pii guard', () => {
  it('returns no issues for clean text', () => {
    expect(pii('There is nothing sensitive in this sentence.')).toEqual([]);
  });

  it('flags an email address', () => {
    const issues = pii('Contact jane.doe@example.com for details.');
    const hit = issues.find((i) => i.rationale.includes('email'));
    expect(hit).toBeDefined();
    expect(hit?.text).toBe('jane.doe@example.com');
    expect(hit?.category).toBe('pii');
  });

  it('flags a phone number', () => {
    const issues = pii('Call (415) 555-0132 today.');
    expect(issues.some((i) => i.rationale.includes('phone'))).toBe(true);
  });

  it('flags a Luhn-valid credit-card-like number', () => {
    // 4111 1111 1111 1111 is a canonical Luhn-valid test number.
    const issues = pii('Card: 4111 1111 1111 1111');
    expect(issues.some((i) => i.rationale.includes('credit-card'))).toBe(true);
  });

  it('does NOT flag a Luhn-invalid digit run as a card', () => {
    const issues = pii('Ref: 1234 5678 9012 3456');
    expect(issues.some((i) => i.rationale.includes('credit-card'))).toBe(false);
  });

  it('flags a US SSN pattern', () => {
    const issues = pii('SSN 123-45-6789 on file.');
    expect(issues.some((i) => i.rationale.includes('SSN'))).toBe(true);
  });

  it('flags an IPv4 address', () => {
    const issues = pii('Server at 192.168.1.100 is down.');
    expect(issues.some((i) => i.rationale.includes('IPv4'))).toBe(true);
  });

  it('always flags, never suggests a replacement (never auto-removed)', () => {
    const issues = pii('Reach me at jane@example.com');
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.suggestion).toBeUndefined();
      expect(issue.rationale).toContain('never auto-removed');
    }
  });

  it('returns issues sorted by span start', () => {
    const issues = pii('Email a@b.com then SSN 123-45-6789 later.');
    const starts = issues.map((i) => i.span.start);
    const sorted = [...starts].sort((x, y) => x - y);
    expect(starts).toEqual(sorted);
  });

  it('produces spans that index back into the source', () => {
    const text = 'Contact jane.doe@example.com now.';
    const issue = pii(text).find((i) => i.rationale.includes('email'))!;
    expect(text.slice(issue.span.start, issue.span.end)).toBe(issue.text);
  });

  it('is deterministic across repeated calls', () => {
    const text = 'a@b.com and 192.168.0.1';
    expect(pii(text)).toEqual(pii(text));
  });
});
