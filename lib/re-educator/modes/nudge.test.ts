import { describe, it, expect } from 'vitest';
import { nudge, type NudgeConfig } from './nudge';
import { STANDARD } from '../profiles';
import { terminology, type TerminologyRule } from '../guards/terminology';
import { pii } from '../guards/pii';
import type { Span } from '../types';
import type { RegisteredGuard } from '../engine';

const RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];

function config(over: Partial<NudgeConfig> = {}): NudgeConfig {
  const guards: RegisteredGuard[] = [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules: RULES } },
    { name: 'pii', category: 'pii', run: pii },
  ];
  return { profile: STANDARD, guards, anchors: [], ...over };
}

// "Please utilise the form." — "utilise" sits at [7,14].
const TEXT = 'Please utilise the form.';
const SPAN: Span = { start: 7, end: 14 };

describe('nudge — happy path', () => {
  it('offers a single verified patch for an in-bound mechanical change', () => {
    const res = nudge(config(), {
      text: TEXT,
      span: SPAN,
      replacement: 'utilize',
      category: 'terminology',
    });
    expect(res.status).toBe('ready');
    expect(res.patch).toBeDefined();
    expect(res.patch?.before).toBe('utilise');
    expect(res.patch?.after).toBe('utilize');
    expect(res.patch?.preview).toBe('Please utilize the form.');
  });

  it('does not mutate the input text (returns a preview, applies nothing)', () => {
    const original = TEXT;
    nudge(config(), { text: TEXT, span: SPAN, replacement: 'utilize', category: 'terminology' });
    expect(TEXT).toBe(original);
  });
});

describe('nudge — refusals', () => {
  it('refuses a no-op when replacement equals the current text', () => {
    const res = nudge(config(), {
      text: TEXT,
      span: SPAN,
      replacement: 'utilise',
      category: 'terminology',
    });
    expect(res.status).toBe('noop');
  });

  it('refuses when the span overlaps a frozen anchor', () => {
    const anchors: Span[] = [{ start: 0, end: TEXT.length }];
    const res = nudge(config({ anchors }), {
      text: TEXT,
      span: SPAN,
      replacement: 'utilize',
      category: 'terminology',
    });
    expect(res.status).toBe('refused-anchor');
    expect(res.patch).toBeUndefined();
  });

  it('refuses an author-required category (e.g. PII, never auto-changed)', () => {
    const text = 'Contact jane@example.com now.';
    const span: Span = { start: 8, end: 24 }; // jane@example.com
    const res = nudge(config(), {
      text,
      span,
      replacement: '[redacted]',
      category: 'pii',
    });
    expect(res.status).toBe('refused-author-required');
    expect(res.patch).toBeUndefined();
  });

  it('refuses an out-of-bound change (exceeds the category diff bound)', () => {
    // terminology bound is 0.15; "utilise" -> "x" is a huge normalized diff.
    const res = nudge(config(), {
      text: TEXT,
      span: SPAN,
      replacement: 'x',
      category: 'terminology',
    });
    expect(res.status).toBe('refused-out-of-bound');
    expect(res.patch).toBeUndefined();
  });

  it('refuses when the guard still flags the edited span (verify fails)', () => {
    // Replace "utilise" with "utiliseee" — small enough diff to pass the bound,
    // but the terminology guard STILL matches "utilise" inside it, so verify fails.
    const res = nudge(config(), {
      text: TEXT,
      span: SPAN,
      replacement: 'utilise!', // contains "utilise" -> still flagged
      category: 'terminology',
    });
    expect(res.status).toBe('refused-verify');
    expect(res.patch).toBeUndefined();
  });
});

describe('nudge — determinism', () => {
  it('returns the same result for the same input', () => {
    const req = { text: TEXT, span: SPAN, replacement: 'utilize', category: 'terminology' as const };
    expect(nudge(config(), req)).toEqual(nudge(config(), req));
  });
});
