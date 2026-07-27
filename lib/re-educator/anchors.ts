/**
 * Inline frozen-anchor markers — the `.anchor {...}` convention (Phase 1 #2).
 *
 * Borrowed from Quarkdown's `.function {arg}` syntax (RE-EDUCATOR-SPEC.md §7a).
 * It lets an author declare a frozen anchor — a span the engine must never edit
 * (a claim, a number, the thesis) — inline in the text, instead of computing raw
 * offset spans by hand and passing them through the API.
 *
 *   Input : "Revenue was .anchor {$2.3M} last year."
 *   Output: { text: "Revenue was $2.3M last year.",
 *             anchors: [{ start: 12, end: 17 }] }   // "$2.3M" in the CLEANED text
 *
 * The single most important invariant: the returned spans are offsets into the
 * CLEANED text (markers removed), because the cleaned text is what becomes the
 * manuscript the guards and engine actually run against. Spans over the raw
 * marked-up text would be misaligned by the width of every preceding marker.
 *
 * This is a pure convenience layer over the same frozen-anchor set the engine
 * already consumes (engine.ts `overlapsAnyAnchor`): it never changes the trust
 * semantics, it only makes declaring anchors easier — and harder to forget.
 *
 * Escaping (so real prose can contain the marker characters):
 *   - `\.anchor` -> a literal ".anchor" (not a marker start)
 *   - `\{` / `\}` inside anchor content -> literal braces (do not open/close)
 * Balanced `{ }` pairs inside content are allowed (depth-counted), so
 * `.anchor {f(x) = {1,2}}` captures `f(x) = {1,2}`.
 */

import type { Span } from './types';

export interface ParsedAnchors {
  /** The manuscript with all `.anchor {...}` wrappers removed (content kept). */
  text: string;
  /** Frozen-anchor spans as half-open [start,end) offsets into `text`. */
  anchors: Span[];
}

/** Thrown on a malformed marker (e.g. an unclosed `.anchor {`). */
export class AnchorSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnchorSyntaxError';
  }
}

const MARKER = '.anchor';

/** True if the text contains at least one (unescaped) `.anchor` marker start.
 * Cheap pre-check so callers can skip parsing when there is nothing to do. */
export function hasAnchorMarkers(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++; // skip the escaped char
      continue;
    }
    if (startsMarker(text, i)) return true;
  }
  return false;
}

/** Does an (unescaped) marker begin exactly at index i? Requires `.anchor`
 * followed by optional whitespace and then `{`. */
function startsMarker(text: string, i: number): boolean {
  if (!text.startsWith(MARKER, i)) return false;
  let j = i + MARKER.length;
  while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++;
  return text[j] === '{';
}

/**
 * Parse `.anchor {...}` markers out of `raw`, returning the cleaned text and the
 * anchor spans over that cleaned text. Pure; no I/O.
 *
 * A single left-to-right pass builds the output string char by char, so the
 * output length IS the cleaned offset — spans are recorded directly against it.
 */
export function parseAnchors(raw: string): ParsedAnchors {
  let out = '';
  const anchors: Span[] = [];
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    // Escape: `\x` emits the escaped char literally and consumes both. This lets
    // authors write a literal ".anchor", "{", or "}" without triggering parsing.
    if (ch === '\\' && i + 1 < raw.length) {
      out += raw[i + 1];
      i += 2;
      continue;
    }

    if (ch === '.' && startsMarker(raw, i)) {
      // Advance past `.anchor` + whitespace to the opening `{`.
      let j = i + MARKER.length;
      while (raw[j] === ' ' || raw[j] === '\t') j++;
      // j now points at `{`.
      const contentStart = out.length; // offset into the CLEANED text
      const { content, next } = readBraced(raw, j);
      out += content;
      anchors.push({ start: contentStart, end: out.length });
      i = next;
      continue;
    }

    out += ch;
    i++;
  }

  return { text: out, anchors };
}

/**
 * Read a `{ ... }` group starting at `openIdx` (which must be `{`). Returns the
 * inner content (with escapes resolved and balanced inner braces preserved) and
 * the index just past the matching `}`. Throws AnchorSyntaxError if unclosed.
 */
function readBraced(raw: string, openIdx: number): { content: string; next: number } {
  if (raw[openIdx] !== '{') {
    throw new AnchorSyntaxError('.anchor must be followed by "{".');
  }
  let content = '';
  let depth = 1;
  let k = openIdx + 1;

  while (k < raw.length) {
    const c = raw[k];

    if (c === '\\' && k + 1 < raw.length) {
      // Escaped char inside content: emit literally, do not count braces.
      content += raw[k + 1];
      k += 2;
      continue;
    }
    if (c === '{') {
      depth++;
      content += c;
      k++;
      continue;
    }
    if (c === '}') {
      depth--;
      if (depth === 0) {
        return { content, next: k + 1 }; // consumed the closing brace
      }
      content += c;
      k++;
      continue;
    }
    content += c;
    k++;
  }

  throw new AnchorSyntaxError('Unclosed ".anchor {" — missing "}".');
}
