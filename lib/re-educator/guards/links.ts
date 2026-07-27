/**
 * links guard — deterministic, no LLM, no network.
 *
 * Finds URLs and Markdown links in the text and flags malformed ones. It does
 * NOT fetch anything (that would break purity + determinism); "dead target"
 * detection is a later network-backed stage. This guard only judges structure:
 * malformed schemes, empty targets, broken Markdown link syntax.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 Stage 1.
 */

import type { Guard, Issue } from '../types';

// Markdown link: [text](target)
const MD_LINK = /\[([^\]]*)\]\(([^)]*)\)/g;
// Bare URL-ish token.
const BARE_URL = /\bhttps?:\/\/[^\s)]+/gi;

function isMalformedUrl(url: string): { bad: boolean; reason: string } {
  const trimmed = url.trim();
  if (trimmed === '') return { bad: true, reason: 'empty link target' };
  // Must have a scheme we recognize, or be an anchor/relative path.
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    // Reject obvious structural breakage.
    if (/\s/.test(trimmed)) return { bad: true, reason: 'URL contains whitespace' };
    if (/^https?:\/\/$/i.test(trimmed)) return { bad: true, reason: 'scheme with no host' };
    if (/^https?:\/[^/]/i.test(trimmed)) return { bad: true, reason: 'malformed scheme (single slash)' };
    return { bad: false, reason: '' };
  }
  // Anything with a scheme-like prefix that isn't http/https/mailto.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^mailto:/i.test(trimmed)) {
    return { bad: true, reason: `unsupported URL scheme in "${trimmed}"` };
  }
  return { bad: false, reason: '' };
}

export const links: Guard = (text): Issue[] => {
  const issues: Issue[] = [];

  // Markdown links.
  let m: RegExpExecArray | null;
  MD_LINK.lastIndex = 0;
  while ((m = MD_LINK.exec(text)) !== null) {
    const full = m[0];
    const target = m[2];
    const { bad, reason } = isMalformedUrl(target);
    if (bad) {
      issues.push({
        category: 'links',
        span: { start: m.index, end: m.index + full.length },
        severity: 'major',
        rationale: `Malformed Markdown link: ${reason}.`,
        text: full,
        source: 'links',
      });
    }
    if (m.index === MD_LINK.lastIndex) MD_LINK.lastIndex++;
  }

  // Bare URLs with obvious breakage.
  BARE_URL.lastIndex = 0;
  while ((m = BARE_URL.exec(text)) !== null) {
    const url = m[0];
    if (/^https?:\/\/$/i.test(url) || /^https?:\/[^/]/i.test(url)) {
      issues.push({
        category: 'links',
        span: { start: m.index, end: m.index + url.length },
        severity: 'major',
        rationale: 'Malformed URL (broken scheme).',
        text: url,
        source: 'links',
      });
    }
  }

  return issues;
};
