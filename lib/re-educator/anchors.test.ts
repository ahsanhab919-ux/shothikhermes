import { describe, it, expect } from 'vitest';
import { parseAnchors, hasAnchorMarkers, AnchorSyntaxError } from './anchors';

/**
 * Phase 1 #2 — `.anchor {...}` inline frozen-anchor parser.
 *
 * The load-bearing invariant these tests defend: the returned anchor spans are
 * offsets into the CLEANED text (markers stripped), so they line up with the
 * manuscript the engine actually runs against. A misaligned span would freeze
 * the wrong characters — the exact failure mode this feature must never have.
 */

/** Helper: read back the substring an anchor points at, from the CLEANED text. */
function slice(text: string, s: { start: number; end: number }): string {
  return text.slice(s.start, s.end);
}

describe('hasAnchorMarkers', () => {
  it('detects a real marker', () => {
    expect(hasAnchorMarkers('a .anchor {x} b')).toBe(true);
  });
  it('ignores text with no marker', () => {
    expect(hasAnchorMarkers('just some prose about anchors')).toBe(false);
  });
  it('does not treat .anchor without a brace as a marker', () => {
    expect(hasAnchorMarkers('the .anchor tag was dropped')).toBe(false);
  });
  it('ignores an escaped marker', () => {
    expect(hasAnchorMarkers('literal \\.anchor {x}')).toBe(false);
  });
});

describe('parseAnchors — cleaning + span alignment', () => {
  it('returns unchanged text and no anchors when there are no markers', () => {
    const { text, anchors } = parseAnchors('plain text');
    expect(text).toBe('plain text');
    expect(anchors).toEqual([]);
  });

  it('strips a single marker and points the span at the content in cleaned text', () => {
    const { text, anchors } = parseAnchors('Revenue was .anchor {$2.3M} last year.');
    expect(text).toBe('Revenue was $2.3M last year.');
    expect(anchors).toHaveLength(1);
    expect(slice(text, anchors[0])).toBe('$2.3M');
    // Explicit offsets: "$2.3M" starts at index 12 in the cleaned text.
    expect(anchors[0]).toEqual({ start: 12, end: 17 });
  });

  it('keeps spans aligned across MULTIPLE markers (the misalignment trap)', () => {
    const { text, anchors } = parseAnchors('.anchor {AAA} middle .anchor {BBB} end');
    expect(text).toBe('AAA middle BBB end');
    expect(anchors).toHaveLength(2);
    expect(slice(text, anchors[0])).toBe('AAA');
    expect(slice(text, anchors[1])).toBe('BBB');
    // Second anchor's offsets are into the CLEANED text, not the raw text.
    expect(anchors[1]).toEqual({ start: 11, end: 14 });
  });

  it('handles adjacent markers', () => {
    const { text, anchors } = parseAnchors('.anchor {X}.anchor {Y}');
    expect(text).toBe('XY');
    expect(anchors).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
    ]);
  });

  it('allows whitespace between .anchor and the brace', () => {
    const { text, anchors } = parseAnchors('.anchor   {kept}');
    expect(text).toBe('kept');
    expect(slice(text, anchors[0])).toBe('kept');
  });

  it('supports an empty anchor (zero-length span)', () => {
    const { text, anchors } = parseAnchors('a.anchor {}b');
    expect(text).toBe('ab');
    expect(anchors[0]).toEqual({ start: 1, end: 1 });
  });
});

describe('parseAnchors — escaping and nesting', () => {
  it('treats \\.anchor as literal text, not a marker', () => {
    const { text, anchors } = parseAnchors('write \\.anchor {notframe} here');
    expect(text).toBe('write .anchor {notframe} here');
    expect(anchors).toEqual([]);
  });

  it('preserves balanced inner braces inside content', () => {
    const { text, anchors } = parseAnchors('.anchor {f(x) = {1,2}}');
    expect(text).toBe('f(x) = {1,2}');
    expect(slice(text, anchors[0])).toBe('f(x) = {1,2}');
  });

  it('honors escaped braces inside content (literal, not delimiters)', () => {
    const { text, anchors } = parseAnchors('.anchor {a\\}b}');
    expect(text).toBe('a}b');
    expect(slice(text, anchors[0])).toBe('a}b');
  });
});

describe('parseAnchors — malformed input', () => {
  it('throws on an unclosed marker', () => {
    expect(() => parseAnchors('start .anchor {never closed')).toThrow(AnchorSyntaxError);
  });

  it('throws on an unclosed marker with only inner opens', () => {
    expect(() => parseAnchors('.anchor {a {b}')).toThrow(/Unclosed/);
  });
});

describe('parseAnchors — determinism', () => {
  it('is a pure function: same input, same output', () => {
    const input = 'x .anchor {a} y .anchor {b} z';
    expect(JSON.stringify(parseAnchors(input))).toBe(JSON.stringify(parseAnchors(input)));
  });
});
