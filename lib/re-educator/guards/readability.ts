/**
 * readability guard — deterministic, no LLM.
 *
 * Flags long sentences and passive-voice constructions. Pure function; same
 * input always yields the same issues. Spec: RE-EDUCATOR-SPEC.md §3 Stage 1.
 */

import type { Guard, Issue } from '../types';

export interface ReadabilityOptions {
  /** Word count above which a sentence is flagged as too long. */
  maxSentenceWords?: number;
}

const DEFAULTS: Required<ReadabilityOptions> = {
  maxSentenceWords: 30,
};

// "to be" auxiliaries that, followed by a past participle, signal passive voice.
const BE_FORMS = ['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am'];
// A pragmatic past-participle detector: regular -ed plus common irregulars.
const IRREGULAR_PARTICIPLES = new Set([
  'begun', 'broken', 'brought', 'built', 'chosen', 'done', 'driven', 'eaten',
  'fallen', 'found', 'given', 'gone', 'grown', 'held', 'kept', 'known', 'led',
  'made', 'meant', 'met', 'paid', 'put', 'read', 'run', 'said', 'seen', 'sent',
  'shown', 'sold', 'taken', 'taught', 'told', 'thrown', 'understood', 'written',
]);

function isParticiple(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return false;
  if (IRREGULAR_PARTICIPLES.has(w)) return true;
  // Regular participle, but exclude very short words like "red"/"bed".
  return w.length > 4 && w.endsWith('ed');
}

/**
 * Split text into sentences, keeping absolute offsets. Splits on . ! ? followed
 * by whitespace. Deliberately simple and deterministic.
 */
function splitSentences(text: string): { start: number; end: number; body: string }[] {
  const out: { start: number; end: number; body: string }[] = [];
  const re = /[^.!?]*[.!?]+|\S[^.!?]*$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const body = m[0];
    if (body.trim() === '') continue;
    const leadingWs = body.length - body.trimStart().length;
    const start = m.index + leadingWs;
    const trimmed = body.trim();
    out.push({ start, end: start + trimmed.length, body: trimmed });
    if (m[0].length === 0) re.lastIndex++; // guard against zero-length matches
  }
  return out;
}

export const readability: Guard<ReadabilityOptions> = (text, ctx): Issue[] => {
  const opts = { ...DEFAULTS, ...(ctx ?? {}) };
  const issues: Issue[] = [];

  for (const s of splitSentences(text)) {
    const words = s.body.split(/\s+/).filter(Boolean);

    // Long sentence.
    if (words.length > opts.maxSentenceWords) {
      issues.push({
        category: 'readability',
        span: { start: s.start, end: s.end },
        severity: words.length > opts.maxSentenceWords * 1.5 ? 'major' : 'minor',
        rationale: `Sentence is ${words.length} words (over ${opts.maxSentenceWords}); consider splitting.`,
        text: s.body,
        source: 'readability',
      });
    }

    // Passive voice: a "to be" form followed within 2 words by a participle.
    for (let i = 0; i < words.length - 1; i++) {
      if (BE_FORMS.includes(words[i].toLowerCase().replace(/[^a-z]/g, ''))) {
        const next = words.slice(i + 1, i + 3);
        if (next.some(isParticiple)) {
          issues.push({
            category: 'readability',
            span: { start: s.start, end: s.end },
            severity: 'info',
            rationale: `Possible passive voice ("${words[i]} ${next.join(' ')}"); prefer active voice.`,
            text: s.body,
            source: 'readability',
          });
          break; // one passive flag per sentence is enough
        }
      }
    }
  }

  return issues;
};
