import { describe, it, expect } from 'vitest';
import { paraphrase, MEANING_FROZEN_CATEGORIES, type ParaphraseConfig } from './paraphrase';
import { review } from './review';
import { STANDARD, PARAPHRASE } from '../profiles';
import { terminology, type TerminologyRule } from '../guards/terminology';
import { pii } from '../guards/pii';
import { readability } from '../guards/readability';
import { verifyChain, type LedgerMeta } from '../ledger';
import type { RegisteredGuard } from '../engine';
import type { Span } from '../types';

const META: LedgerMeta = { manuscript: 'doc_para', writing_md_version: 'wmd_v1', anchors: [] };
const APPLY_RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];

function guards(rules: TerminologyRule[] = APPLY_RULES): RegisteredGuard[] {
  return [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules } },
    { name: 'pii', category: 'pii', run: pii },
    { name: 'readability', category: 'readability', run: readability },
  ];
}

function config(over: Partial<ParaphraseConfig> = {}): ParaphraseConfig {
  return { guards: guards(), anchors: [], meta: META, ...over };
}

const LONG = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';

describe('Paraphrase = config, not new code', () => {
  it('records the paraphrase profile and stays single-round', async () => {
    const res = await paraphrase(config(), 'Please utilise the form.');
    expect(res.profile).toBe('paraphrase');
    expect(res.rounds).toBe(1);
  });

  it('flips readability from propose (Standard) to auto-fixable (Paraphrase)', async () => {
    // Same engine, same guards, same text — only the profile differs.
    const std = await review({ profile: STANDARD, guards: guards(), anchors: [], meta: META }, LONG);
    const para = await paraphrase(config(), LONG);

    const stdRead = [...std.panel.proposed, ...std.panel.applied].find(
      (o) => o.issue.category === 'readability',
    );
    const paraRead = [
      ...para.panel.proposed,
      ...para.panel.applied,
    ].find((o) => o.issue.category === 'readability');

    expect(stdRead?.verdict).toBe('propose');
    expect(paraRead?.verdict).toBe('auto-fixable');
  });

  it('is exactly a Review run with the PARAPHRASE profile (parity)', async () => {
    const viaReview = await review(
      { profile: PARAPHRASE, guards: guards(), anchors: [], meta: META },
      'Please utilise the form.',
    );
    const viaParaphrase = await paraphrase(config(), 'Please utilise the form.');
    expect(viaParaphrase.text).toBe(viaReview.text);
    expect(viaParaphrase.summary).toEqual(viaReview.summary);
    expect(viaParaphrase.ledger.entries.map((e) => e.hash)).toEqual(
      viaReview.ledger.entries.map((e) => e.hash),
    );
  });
});

describe('Paraphrase — meaning-preserving invariant (the feature)', () => {
  it('keeps PII author-required and never edits it, even under the loosened profile', async () => {
    const res = await paraphrase(config(), 'Reach me at jane@example.com please.');
    expect(res.text).toBe('Reach me at jane@example.com please.');
    expect(res.panel.authorRequired.some((o) => o.issue.category === 'pii')).toBe(true);
    expect(res.ledger.entries.every((e) => e.category !== 'pii')).toBe(true);
  });

  it('freezes anchor-overlapping spans to author-required with maxDiff 0', async () => {
    const text = 'Please utilise the form.';
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const res = await paraphrase(config({ anchors }), text);
    expect(res.text).toBe(text); // untouched
    expect(res.ledger.entries).toHaveLength(0);
    expect(res.panel.authorRequired.some((o) => o.issue.category === 'terminology')).toBe(true);
  });

  it('confirms pii + unsupported-assertion are identical in STANDARD and PARAPHRASE', async () => {
    for (const cat of MEANING_FROZEN_CATEGORIES) {
      expect(PARAPHRASE[cat]).toEqual(STANDARD[cat]);
      expect(PARAPHRASE[cat].verdict).toBe('author-required');
      expect(PARAPHRASE[cat].maxDiff).toBe(0);
    }
  });
});

describe('Paraphrase — still applies safe mechanical fixes + ledgers them', () => {
  it('applies an in-bound terminology fix and chains it', async () => {
    const res = await paraphrase(config(), 'Please utilise the form.');
    expect(res.text).toBe('Please utilize the form.');
    expect(res.ledger.entries).toHaveLength(1);
    expect(verifyChain(res.ledger).valid).toBe(true);
  });
});

describe('Paraphrase — determinism', () => {
  it('is deterministic across repeated runs', async () => {
    const a = await paraphrase(config(), 'Please utilise the form. Email a@b.com.');
    const b = await paraphrase(config(), 'Please utilise the form. Email a@b.com.');
    expect(a.text).toBe(b.text);
    expect(a.ledger.entries.map((e) => e.hash)).toEqual(b.ledger.entries.map((e) => e.hash));
  });
});
