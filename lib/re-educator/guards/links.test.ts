import { describe, it, expect } from 'vitest';
import { links } from './links';

describe('links guard', () => {
  it('passes a well-formed Markdown link', () => {
    expect(links('See [docs](https://example.com/docs).')).toEqual([]);
  });

  it('passes relative and anchor targets', () => {
    expect(links('[home](/index) and [top](#top)')).toEqual([]);
  });

  it('flags an empty Markdown link target', () => {
    const issues = links('Broken [text]().');
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('links');
    expect(issues[0].severity).toBe('major');
    expect(issues[0].rationale).toContain('empty');
  });

  it('flags a Markdown target with whitespace', () => {
    const issues = links('[x](https://exa mple.com)');
    expect(issues.some((i) => i.rationale.includes('whitespace'))).toBe(true);
  });

  it('flags a scheme with no host', () => {
    const issues = links('[x](https://)');
    expect(issues.some((i) => i.rationale.includes('no host'))).toBe(true);
  });

  it('flags an unsupported URL scheme', () => {
    const issues = links('[x](javascript:alert(1))');
    expect(issues.some((i) => i.rationale.includes('unsupported'))).toBe(true);
  });

  it('allows mailto targets', () => {
    expect(links('[mail](mailto:a@b.com)')).toEqual([]);
  });

  it('leaves a well-formed bare URL alone', () => {
    // The bare-URL pass only reacts to structurally broken schemes; a valid
    // bare URL is not flagged (dead-target checks are a later network stage).
    expect(links('visit https://example.com/docs now')).toEqual([]);
  });

  it('does not fetch — passes a valid but nonexistent host', () => {
    // Purity: structure only, no network. A syntactically valid URL is fine.
    expect(links('[x](https://this-host-does-not-exist.invalid/path)')).toEqual([]);
  });

  it('produces spans that index back into the source', () => {
    const text = 'Broken [text]() here.';
    const issue = links(text)[0];
    expect(text.slice(issue.span.start, issue.span.end)).toBe(issue.text);
  });

  it('is deterministic and re-runnable (regex lastIndex is reset)', () => {
    const text = '[a]() and [b]()';
    const first = links(text);
    const second = links(text);
    expect(first).toHaveLength(2);
    expect(first).toEqual(second);
  });
});
