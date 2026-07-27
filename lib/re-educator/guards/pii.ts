/**
 * pii guard — deterministic, no LLM.
 *
 * Scans for accidental PII (emails, phone numbers, credit-card-like sequences,
 * IP addresses, US SSN pattern). Always emits `author-required` severity intent:
 * per the spec, PII is FLAGGED, never auto-removed. Pure function.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 Stage 1, §4b (pii is frozen in both profiles).
 */

import type { Guard, Issue } from '../types';

interface Detector {
  label: string;
  re: RegExp;
  /** Optional extra check to reduce false positives (e.g. Luhn for cards). */
  validate?: (match: string) => boolean;
}

/** Luhn checksum — reduces false positives on credit-card-like digit runs. */
function luhnValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const DETECTORS: Detector[] = [
  {
    label: 'email address',
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    label: 'phone number',
    re: /(?<!\d)(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g,
  },
  {
    label: 'credit-card-like number',
    re: /\b(?:\d[ -]?){13,19}\b/g,
    validate: luhnValid,
  },
  {
    label: 'US SSN pattern',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    label: 'IPv4 address',
    re: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  },
];

export const pii: Guard = (text): Issue[] => {
  const issues: Issue[] = [];
  const seen = new Set<string>(); // dedupe overlapping detectors by span key

  for (const det of DETECTORS) {
    det.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = det.re.exec(text)) !== null) {
      const matched = m[0];
      if (det.validate && !det.validate(matched)) {
        if (m.index === det.re.lastIndex) det.re.lastIndex++;
        continue;
      }
      const key = `${m.index}:${m.index + matched.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({
          category: 'pii',
          span: { start: m.index, end: m.index + matched.length },
          severity: 'major',
          rationale: `Possible ${det.label} — flagged for author review (never auto-removed).`,
          text: matched,
          source: 'pii',
        });
      }
      if (m.index === det.re.lastIndex) det.re.lastIndex++;
    }
  }

  return issues.sort((a, b) => a.span.start - b.span.start);
};
