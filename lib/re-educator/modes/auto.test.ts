import { describe, it, expect } from 'vitest';
import { auto, type AutoConfig, type AutoAuthorization, type AutoRun } from './auto';
import { STANDARD } from '../profiles';
import { terminology, type TerminologyRule } from '../guards/terminology';
import { pii } from '../guards/pii';
import { readability } from '../guards/readability';
import { verifyChain, type LedgerMeta } from '../ledger';
import type { RegisteredGuard } from '../engine';
import type { Span } from '../types';

const META: LedgerMeta = { manuscript: 'doc_auto', writing_md_version: 'wmd_v1', anchors: [] };
const APPLY_RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];

type Over = Partial<AutoConfig> & { termRules?: TerminologyRule[] };

function config(over: Over = {}): AutoConfig {
  const { termRules = APPLY_RULES, ...rest } = over;
  const guards: RegisteredGuard[] = [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules: termRules } },
    { name: 'pii', category: 'pii', run: pii },
    { name: 'readability', category: 'readability', run: readability },
  ];
  return { profile: STANDARD, guards, meta: META, ...rest };
}

/** A fully-authorized run over the whole text. */
function authorizedRun(text: string, anchors: Span[] = []): AutoRun {
  const authorization: AutoAuthorization = {
    anchorsFrozen: true,
    anchors,
    scopeConfirmed: true,
    scope: [{ start: 0, end: text.length }],
  };
  return { text, optIn: true, authorization };
}

describe('Auto — hard rule 1 (never self-detect)', () => {
  it('refuses when optIn is not explicitly true', async () => {
    const run = authorizedRun('Please utilise the form.');
    const res = await auto(config(), { ...run, optIn: false });
    expect(res.status).toBe('refused');
    expect(res.stopReason).toBe('refused-no-optin');
    expect(res.text).toBe('Please utilise the form.'); // untouched
    expect(res.rounds).toBe(0);
  });

  it('exposes no way to enter Auto without the opt-in boolean', async () => {
    // optIn defaults to nothing meaningful; only literal true proceeds.
    const run = authorizedRun('Please utilise the form.');
    // @ts-expect-error — optIn is required; omitting it is a type error by design.
    const res = await auto(config(), { text: run.text, authorization: run.authorization });
    expect(res.status).toBe('refused');
  });
});

describe('Auto — hard rule 2 (two blocking sign-offs)', () => {
  it('refuses when authorization is null', async () => {
    const res = await auto(config(), { text: 'Please utilise it.', optIn: true, authorization: null });
    expect(res.status).toBe('refused');
    expect(res.stopReason).toBe('refused-no-authorization');
  });

  it('refuses when anchors are not frozen', async () => {
    const bad = {
      text: 'Please utilise it.',
      optIn: true,
      authorization: {
        anchorsFrozen: false,
        anchors: [],
        scopeConfirmed: true,
        scope: [{ start: 0, end: 18 }],
      },
    } as unknown as AutoRun;
    expect((await auto(config(), bad)).stopReason).toBe('refused-no-authorization');
  });

  it('refuses when scope is not confirmed', async () => {
    const bad = {
      text: 'Please utilise it.',
      optIn: true,
      authorization: {
        anchorsFrozen: true,
        anchors: [],
        scopeConfirmed: false,
        scope: [],
      },
    } as unknown as AutoRun;
    expect((await auto(config(), bad)).stopReason).toBe('refused-no-authorization');
  });
});

describe('Auto — hard rule 3 (deterministic completion)', () => {
  it('converges to zero-gate-blocking on clean text (nothing to do)', async () => {
    const res = await auto(config(), authorizedRun('The cat sat. The dog ran.'));
    expect(res.status).toBe('ran');
    expect(res.stopReason).toBe('zero-gate-blocking');
    expect(res.rounds).toBe(1);
    expect(res.queued).toHaveLength(0);
  });

  it('applies safe fixes then stops on quiet rounds when only queued issues remain', async () => {
    // terminology applies; pii is author-required (a permanent gate-blocker).
    const res = await auto(config(), authorizedRun('Please utilise it. Email a@b.com.'));
    expect(res.status).toBe('ran');
    expect(res.text).toContain('Please utilize it.');
    // A gate-blocker (pii) remains, so it cannot converge; it stops quiet.
    expect(res.stopReason).toBe('quiet-rounds');
    expect(res.queued.some((o) => o.issue.category === 'pii')).toBe(true);
  });

  it('respects the hard round cap', async () => {
    // Force many rounds with a large K so the cap is the binding limit.
    const res = await auto(
      config({ quietRoundsToStop: 99, maxRounds: 2 }),
      authorizedRun('Please utilise it. Email a@b.com.'),
    );
    expect(res.rounds).toBe(2);
    expect(res.stopReason).toBe('round-cap');
  });

  it('honors a custom K quiet-round threshold', async () => {
    const res = await auto(
      config({ quietRoundsToStop: 2, maxRounds: 10 }),
      authorizedRun('Email a@b.com only.'),
    );
    // No edits ever apply (pii is author-required), so it stops after K=2 quiet rounds.
    expect(res.stopReason).toBe('quiet-rounds');
    expect(res.rounds).toBe(2);
  });
});

describe('Auto — ledger + anchors', () => {
  it('produces one continuous chain across rounds that verifies', async () => {
    const res = await auto(config(), authorizedRun('Please utilise it. Email a@b.com.'));
    expect(verifyChain(res.ledger).valid).toBe(true);
    expect(res.ledger.entries.length).toBeGreaterThan(0);
  });

  it('never edits inside a frozen anchor', async () => {
    const text = 'Please utilise the form.';
    const res = await auto(config(), authorizedRun(text, [{ start: 0, end: text.length }]));
    expect(res.text).toBe(text);
    expect(res.ledger.entries).toHaveLength(0);
    expect(res.queued.some((o) => o.issue.category === 'terminology')).toBe(true);
  });

  it('does not apply edits outside the confirmed scope', async () => {
    // Scope covers only the first sentence; the second "utilise" is out of bounds.
    const text = 'Please utilise this. Please utilise that.';
    const firstEnd = text.indexOf('.') + 1; // end of first sentence
    const run: AutoRun = {
      text,
      optIn: true,
      authorization: {
        anchorsFrozen: true,
        anchors: [],
        scopeConfirmed: true,
        scope: [{ start: 0, end: firstEnd }],
      },
    };
    const res = await auto(config(), run);
    // First fixed, second left alone.
    expect(res.text.startsWith('Please utilize this.')).toBe(true);
    expect(res.text).toContain('Please utilise that.');
  });
});

describe('Auto — determinism', () => {
  it('is deterministic across repeated runs', async () => {
    const a = await auto(config(), authorizedRun('Please utilise it. Email a@b.com.'));
    const b = await auto(config(), authorizedRun('Please utilise it. Email a@b.com.'));
    expect(a.text).toBe(b.text);
    expect(a.stopReason).toBe(b.stopReason);
    expect(a.ledger.entries.map((e) => e.hash)).toEqual(b.ledger.entries.map((e) => e.hash));
  });
});
