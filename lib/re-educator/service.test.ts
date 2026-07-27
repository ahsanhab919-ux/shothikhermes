import { describe, it, expect } from 'vitest';
import {
  parseRequest,
  runReEducator,
  defaultGuards,
  buildMeta,
  ReEducatorRequestError,
  RE_EDUCATOR_MODES,
} from './service';
import { verifyChain } from './ledger';

/**
 * Phase 1 #1 — service layer tests.
 *
 * The service is the pure seam the HTTP route delegates to. These tests pin:
 *   - request parsing/validation (the 400 surface),
 *   - the default guard set composition,
 *   - mode dispatch producing a verifiable ledger + a uniform envelope,
 *   - the deterministic (no-LLM) guarantee: same input, same output, valid chain.
 *
 * The route (auth + Mongo persistence) and model are thin shells over these and
 * over infra vitest doesn't stand up, so the meaningful coverage lives here.
 */

describe('parseRequest — validation', () => {
  it('rejects a non-object body', () => {
    expect(() => parseRequest(null)).toThrow(ReEducatorRequestError);
    expect(() => parseRequest('nope')).toThrow(ReEducatorRequestError);
  });

  it('requires a string text field', () => {
    expect(() => parseRequest({ mode: 'review' })).toThrow(/"text"/);
  });

  it('requires a valid mode', () => {
    expect(() => parseRequest({ text: 'hi', mode: 'bogus' })).toThrow(/"mode"/);
    expect(() => parseRequest({ text: 'hi' })).toThrow(/"mode"/);
  });

  it('accepts a minimal review request', () => {
    const req = parseRequest({ text: 'Some text here.', mode: 'review' });
    expect(req.mode).toBe('review');
    expect(req.text).toBe('Some text here.');
    expect(req.anchors).toEqual([]);
    expect(req.writingMdVersion).toBeUndefined();
  });

  it('validates anchor spans shape and bounds', () => {
    expect(() => parseRequest({ text: 'x', mode: 'review', anchors: 'no' })).toThrow(/anchors/);
    expect(() =>
      parseRequest({ text: 'x', mode: 'review', anchors: [{ start: 5, end: 2 }] }),
    ).toThrow(/start <= end/);
    const ok = parseRequest({ text: 'hello world', mode: 'review', anchors: [{ start: 0, end: 5 }] });
    expect(ok.anchors).toEqual([{ start: 0, end: 5 }]);
  });

  it('parses candidateSpans (absent/empty => undefined, provided => kept)', () => {
    const absent = parseRequest({ text: 'hello world', mode: 'review' });
    expect(absent.candidateSpans).toBeUndefined();
    const empty = parseRequest({ text: 'hello world', mode: 'review', candidateSpans: [] });
    expect(empty.candidateSpans).toBeUndefined();
    const provided = parseRequest({
      text: 'hello world',
      mode: 'review',
      candidateSpans: [{ start: 0, end: 5 }],
    });
    expect(provided.candidateSpans).toEqual([{ start: 0, end: 5 }]);
  });

  it('rejects malformed candidateSpans', () => {
    expect(() => parseRequest({ text: 'x', mode: 'review', candidateSpans: 'no' })).toThrow(
      /candidateSpans/,
    );
    expect(() =>
      parseRequest({ text: 'x', mode: 'review', candidateSpans: [{ start: 5, end: 2 }] }),
    ).toThrow(/start <= end/);
  });

  it('nudge mode requires a well-formed nudge object', () => {
    expect(() => parseRequest({ text: 'x', mode: 'nudge' })).toThrow(/nudge/);
    expect(() =>
      parseRequest({ text: 'x', mode: 'nudge', nudge: { span: { start: 0, end: 1 } } }),
    ).toThrow(/replacement/);
    expect(() =>
      parseRequest({
        text: 'x',
        mode: 'nudge',
        nudge: { span: { start: 0, end: 1 }, replacement: 'y' },
      }),
    ).toThrow(/category/);
    const ok = parseRequest({
      text: 'the color is nice',
      mode: 'nudge',
      nudge: { span: { start: 4, end: 9 }, replacement: 'colour', category: 'terminology' },
    });
    expect(ok.nudge).toEqual({
      text: 'the color is nice',
      span: { start: 4, end: 9 },
      replacement: 'colour',
      category: 'terminology',
    });
  });

  it('auto mode requires optIn boolean; authorization may be null', () => {
    expect(() => parseRequest({ text: 'x', mode: 'auto' })).toThrow(/auto/);
    expect(() =>
      parseRequest({ text: 'x', mode: 'auto', auto: { authorization: null } }),
    ).toThrow(/optIn/);
    const ok = parseRequest({
      text: 'x',
      mode: 'auto',
      auto: { optIn: false, authorization: null },
    });
    expect(ok.auto).toEqual({
      optIn: false,
      authorization: null,
      quietRoundsToStop: undefined,
      maxRounds: undefined,
    });
  });

  it('exposes exactly the four build-order modes', () => {
    expect([...RE_EDUCATOR_MODES]).toEqual(['nudge', 'review', 'auto', 'paraphrase']);
  });
});

describe('parseRequest — inline .anchor markers', () => {
  it('resolves markers to cleaned text + anchor spans', () => {
    const req = parseRequest({
      text: 'Revenue was .anchor {$2.3M} last year.',
      mode: 'review',
    });
    expect(req.text).toBe('Revenue was $2.3M last year.');
    expect(req.anchors).toEqual([{ start: 12, end: 17 }]);
  });

  it('merges parsed anchors with explicitly-passed anchors (dedup)', () => {
    const req = parseRequest({
      text: '.anchor {AAA} tail',
      mode: 'review',
      anchors: [{ start: 0, end: 3 }, { start: 4, end: 8 }],
    });
    expect(req.text).toBe('AAA tail');
    // explicit {0,3} equals the parsed anchor -> deduped; explicit {4,8} kept.
    expect(req.anchors).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 8 },
    ]);
  });

  it('threads the CLEANED text into a nudge request', () => {
    const req = parseRequest({
      text: 'the .anchor {color} is nice',
      mode: 'nudge',
      nudge: { span: { start: 0, end: 3 }, replacement: 'THE', category: 'terminology' },
    });
    expect(req.text).toBe('the color is nice');
    expect(req.nudge!.text).toBe('the color is nice');
  });

  it('maps a malformed marker to a request error (=> 400)', () => {
    expect(() => parseRequest({ text: '.anchor {unclosed', mode: 'review' })).toThrow(
      ReEducatorRequestError,
    );
  });
});

describe('defaultGuards — composition', () => {
  it('always registers readability, links, pii', () => {
    const g = defaultGuards();
    expect(g.map((x) => x.name).sort()).toEqual(['links', 'pii', 'readability']);
  });

  it('adds terminology only when rules are supplied', () => {
    const g = defaultGuards({
      terminologyRules: [{ avoid: 'color', prefer: 'colour' }],
    });
    const term = g.find((x) => x.name === 'terminology');
    expect(term).toBeDefined();
    expect(term!.ctx).toEqual({ rules: [{ avoid: 'color', prefer: 'colour' }] });
  });

  it('adds voice-drift only when a voice profile is supplied', () => {
    const g = defaultGuards({ voiceProfile: { bannedPhrases: ['very'] } });
    expect(g.some((x) => x.name === 'voice-drift')).toBe(true);
  });

  it('does not add empty-rule terminology', () => {
    const g = defaultGuards({ terminologyRules: [] });
    expect(g.some((x) => x.name === 'terminology')).toBe(false);
  });
});

describe('runReEducator — mode dispatch', () => {
  it('review returns a verifiable ledger and a review result', async () => {
    const out = await runReEducator({ text: 'This is a simple sentence.', mode: 'review', anchors: [] });
    expect(out.mode).toBe('review');
    expect(verifyChain(out.ledger).valid).toBe(true);
    if (out.mode === 'review') {
      expect(out.result.rounds).toBe(1);
      expect(out.result.summary).toBeDefined();
    }
  });

  it('paraphrase records the paraphrase profile and stays verifiable', async () => {
    const out = await runReEducator({ text: 'This is a simple sentence.', mode: 'paraphrase' });
    expect(out.mode).toBe('paraphrase');
    expect(verifyChain(out.ledger).valid).toBe(true);
    if (out.mode === 'paraphrase') {
      expect(out.result.profile).toBe('paraphrase');
    }
  });

  it('nudge returns an empty-chain ledger (nudge writes no chain of its own)', async () => {
    const out = await runReEducator({
      text: 'the color is nice',
      mode: 'nudge',
      nudge: {
        text: 'the color is nice',
        span: { start: 4, end: 9 },
        replacement: 'colour',
        category: 'terminology',
      },
    });
    expect(out.mode).toBe('nudge');
    expect(out.ledger.entries).toEqual([]);
    // An empty chain is trivially valid.
    expect(verifyChain(out.ledger).valid).toBe(true);
  });

  it('auto without opt-in refuses (hard rule 1) but still yields a valid ledger', async () => {
    const out = await runReEducator({
      text: 'This is a simple sentence.',
      mode: 'auto',
      auto: { optIn: false, authorization: null },
    });
    expect(out.mode).toBe('auto');
    if (out.mode === 'auto') {
      expect(out.result.status).toBe('refused');
      expect(out.result.stopReason).toBe('refused-no-optin');
    }
    expect(verifyChain(out.ledger).valid).toBe(true);
  });

  it('rejects with a request error if a mode is dispatched without its required payload', async () => {
    // Bypass parseRequest to hit the dispatcher guard directly. runReEducator is
    // async since Phase 2, so the dispatcher throw surfaces as a rejection.
    await expect(runReEducator({ text: 'x', mode: 'nudge' })).rejects.toThrow(ReEducatorRequestError);
    await expect(runReEducator({ text: 'x', mode: 'auto' })).rejects.toThrow(ReEducatorRequestError);
  });
});

describe('runReEducator — determinism (no LLM in Phase 1)', () => {
  it('produces byte-identical ledgers across two runs of the same input', async () => {
    const input = { text: 'A short, clear sentence for review.', mode: 'review' as const };
    const a = await runReEducator(input);
    const b = await runReEducator(input);
    expect(JSON.stringify(a.ledger)).toBe(JSON.stringify(b.ledger));
  });
});

describe('buildMeta', () => {
  it('threads manuscript, anchors and the writing-md version tag', () => {
    const meta = buildMeta('hello', [{ start: 0, end: 5 }], 'v1');
    expect(meta.manuscript).toBe('hello');
    expect(meta.anchors).toEqual([{ start: 0, end: 5 }]);
    expect(meta.writing_md_version).toBe('v1');
  });
});
