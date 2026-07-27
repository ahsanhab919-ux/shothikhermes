/**
 * voice-drift guard — deterministic, no LLM.
 *
 * A cheap lexical measure of how far a passage sits from the author's WRITING.md
 * voice profile. Two signals, both offline:
 *   1) banned/discouraged phrases from WRITING.md -> per-hit issue.
 *   2) per-sentence cosine distance from the profile's word distribution;
 *      sentences past a threshold are flagged as drifted.
 *
 * This is intentionally coarse: it narrows WHERE the semantic stage should look,
 * it does not itself judge voice. Pure function. Spec: RE-EDUCATOR-SPEC.md §3.
 */

import type { Guard, Issue } from '../types';

export interface VoiceProfile {
  /** Reference text (e.g. the author's WRITING.md samples) to model voice from. */
  referenceText?: string;
  /** Phrases the author has asked to avoid (case-insensitive substring). */
  bannedPhrases?: string[];
  /** Cosine-distance threshold [0,1]; sentences above this drift-flag. Default 0.85. */
  driftThreshold?: number;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'is',
  'are', 'was', 'were', 'be', 'it', 'this', 'that', 'with', 'as', 'at', 'by',
  'from', 'we', 'you', 'i', 'they', 'he', 'she', 'our', 'your', 'their',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z']+/g) ?? []).filter((w) => !STOPWORDS.has(w));
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** Cosine similarity of two term-frequency maps in [0,1]. */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [t, av] of a) {
    const bv = b.get(t);
    if (bv) dot += av * bv;
  }
  const mag = (m: Map<string, number>) =>
    Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  const denom = mag(a) * mag(b);
  return denom === 0 ? 0 : dot / denom;
}

function splitSentences(text: string): { start: number; end: number; body: string }[] {
  const out: { start: number; end: number; body: string }[] = [];
  const re = /[^.!?]*[.!?]+|\S[^.!?]*$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim() === '') continue;
    const leadingWs = m[0].length - m[0].trimStart().length;
    const start = m.index + leadingWs;
    const trimmed = m[0].trim();
    out.push({ start, end: start + trimmed.length, body: trimmed });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

export const voiceDrift: Guard<VoiceProfile> = (text, ctx): Issue[] => {
  const issues: Issue[] = [];
  const banned = ctx?.bannedPhrases ?? [];
  const threshold = ctx?.driftThreshold ?? 0.85;

  // 1) Banned phrases.
  for (const phrase of banned) {
    if (!phrase) continue;
    const needle = phrase.toLowerCase();
    let from = 0;
    const hay = text.toLowerCase();
    let idx = hay.indexOf(needle, from);
    while (idx !== -1) {
      issues.push({
        category: 'voice-drift',
        span: { start: idx, end: idx + phrase.length },
        severity: 'minor',
        rationale: `Discouraged phrase per WRITING.md: "${phrase}".`,
        text: text.slice(idx, idx + phrase.length),
        source: 'voice-drift',
      });
      from = idx + needle.length;
      idx = hay.indexOf(needle, from);
    }
  }

  // 2) Lexical distance from the voice profile (only if we have a reference).
  const ref = ctx?.referenceText?.trim();
  if (ref) {
    const refTf = termFreq(tokenize(ref));
    for (const s of splitSentences(text)) {
      const tokens = tokenize(s.body);
      if (tokens.length < 5) continue; // too short to judge
      const sim = cosine(termFreq(tokens), refTf);
      const dist = 1 - sim;
      if (dist > threshold) {
        issues.push({
          category: 'voice-drift',
          span: { start: s.start, end: s.end },
          severity: 'info',
          rationale: `Lexical drift ${dist.toFixed(2)} from WRITING.md voice (> ${threshold}); review tone.`,
          text: s.body,
          source: 'voice-drift',
        });
      }
    }
  }

  return issues.sort((a, b) => a.span.start - b.span.start);
};
