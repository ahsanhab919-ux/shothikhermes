/**
 * terminology guard — deterministic, no LLM.
 *
 * Flags terms that violate the author's WRITING.md preferred spellings/terms and
 * suggests the mechanical replacement. Rules come from the caller (parsed from
 * WRITING.md), so the guard stays pure and content-agnostic.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 Stage 1.
 */

import type { Guard, Issue } from '../types';

export interface TerminologyRule {
  /** The disallowed term (matched case-insensitively, on word boundaries). */
  avoid: string;
  /** The preferred replacement. */
  prefer: string;
  /** Optional note shown in the rationale. */
  note?: string;
}

export interface TerminologyOptions {
  rules?: TerminologyRule[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Preserve the capitalization shape of the matched token in the suggestion. */
function matchCase(sample: string, replacement: string): string {
  if (sample === sample.toUpperCase() && sample.length > 1) {
    return replacement.toUpperCase();
  }
  if (sample[0] === sample[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export const terminology: Guard<TerminologyOptions> = (text, ctx): Issue[] => {
  const rules = ctx?.rules ?? [];
  const issues: Issue[] = [];

  for (const rule of rules) {
    if (!rule.avoid) continue;
    const re = new RegExp(`\\b${escapeRegExp(rule.avoid)}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      issues.push({
        category: 'terminology',
        span: { start: m.index, end: m.index + matched.length },
        severity: 'minor',
        rationale: `WRITING.md prefers "${rule.prefer}" over "${rule.avoid}".${rule.note ? ' ' + rule.note : ''}`,
        text: matched,
        suggestion: matchCase(matched, rule.prefer),
        source: 'terminology',
      });
      if (m.index === re.lastIndex) re.lastIndex++; // avoid infinite loop
    }
  }

  return issues;
};
