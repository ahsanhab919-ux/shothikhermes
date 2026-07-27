import { describe, it, expect, afterEach } from 'vitest';
import {
  reviewerFromByok,
  verifierFromByok,
  isByokProvider,
  BYOK_PROVIDERS,
  type ByokRequest,
} from './byok';

const KEY = 'sk-secret-value';
const TEXT_LEN = 100;

const ORIGINAL_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

describe('isByokProvider', () => {
  it('accepts exactly the supported providers', () => {
    for (const p of BYOK_PROVIDERS) expect(isByokProvider(p)).toBe(true);
  });

  it('accepts gemini (registered in Phase R1a)', () => {
    expect(isByokProvider('gemini')).toBe(true);
  });

  it('accepts omniroute (local OpenAI-compatible gateway)', () => {
    expect(isByokProvider('omniroute')).toBe(true);
  });

  it('rejects anything else', () => {
    for (const bad of ['google', 'OPENAI', '', undefined, null, 42, {}]) {
      expect(isByokProvider(bad)).toBe(false);
    }
  });
});

describe('reviewerFromByok — fail-closed to undefined', () => {
  it('returns undefined when the descriptor is absent', () => {
    expect(reviewerFromByok(undefined, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined when the provider is missing or unsupported', () => {
    expect(reviewerFromByok({ apiKey: KEY }, TEXT_LEN)).toBeUndefined();
    expect(reviewerFromByok({ provider: 'google', apiKey: KEY }, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined when the key is missing or empty', () => {
    expect(reviewerFromByok({ provider: 'openai' }, TEXT_LEN)).toBeUndefined();
    expect(reviewerFromByok({ provider: 'openai', apiKey: '' }, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined for empty text (nothing to review)', () => {
    expect(reviewerFromByok({ provider: 'openai', apiKey: KEY }, 0)).toBeUndefined();
  });

  it('never throws on a malformed descriptor', () => {
    // Deliberately wrong shapes — the factory must degrade, not crash.
    expect(() =>
      reviewerFromByok({ provider: 123 as unknown as string }, TEXT_LEN),
    ).not.toThrow();
    expect(() =>
      reviewerFromByok(42 as unknown as ByokRequest, TEXT_LEN),
    ).not.toThrow();
  });
});

describe('reviewerFromByok — builds a reviewer for valid descriptors', () => {
  it('builds a function for a valid OpenAI descriptor', () => {
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN);
    expect(typeof reviewer).toBe('function');
  });

  it('builds a function for a valid Anthropic descriptor with a model override', () => {
    const reviewer = reviewerFromByok(
      { provider: 'anthropic', apiKey: KEY, model: 'claude-opus-4' },
      TEXT_LEN,
    );
    expect(typeof reviewer).toBe('function');
  });

  it('builds a function for a valid Gemini descriptor', () => {
    const reviewer = reviewerFromByok({ provider: 'gemini', apiKey: KEY }, TEXT_LEN);
    expect(typeof reviewer).toBe('function');
  });

  it('builds a function for a valid OmniRoute descriptor', () => {
    const reviewer = reviewerFromByok({ provider: 'omniroute', apiKey: KEY, model: undefined }, TEXT_LEN);
    expect(typeof reviewer).toBe('function');
  });

  it('does not leak the key through the returned reviewer', () => {
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN);
    // The reviewer is an opaque closure; its string form must not contain the key.
    expect(String(reviewer)).not.toContain(KEY);
    // And no enumerable property on the function carries it.
    expect(JSON.stringify(Object.entries(reviewer as object))).not.toContain(KEY);
  });
});

describe('reviewerFromByok — candidate spans + caps + usage (Phase 2 #6)', () => {
  // A tiny fetch stub so the built reviewer can run without a real network call.
  // It captures the request body so we can assert what reached the "model".
  function stubFetch(): { calls: Array<{ url: string; body: unknown }> } {
    const calls: Array<{ url: string; body: unknown }> = [];
    globalThis.fetch = (async (url: unknown, init?: { body?: string }) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : undefined });
      // A shape both adapters treat as "no issues" — empty content.
      return {
        ok: true,
        status: 200,
        async json() {
          return { choices: [{ message: { content: '[]' } }], content: [{ text: '[]' }] };
        },
      };
    }) as unknown as typeof fetch;
    return { calls };
  }

  it('reports usage through onUsage when the reviewer runs (whole-document fallback)', async () => {
    stubFetch();
    const usages: unknown[] = [];
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN, {
      onUsage: (u) => usages.push(u),
    });
    await reviewer?.('x'.repeat(TEXT_LEN));
    // Fallback candidate span is the whole document; under the default caps.
    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({ provider: 'openai', spansReviewed: 1, capped: false });
  });

  it('honours caller-supplied candidate spans over the whole-document fallback', async () => {
    stubFetch();
    const usages: Array<{ charsSent: number }> = [];
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN, {
      candidateSpans: [{ start: 0, end: 10 }],
      onUsage: (u) => usages.push(u as { charsSent: number }),
    });
    await reviewer?.('x'.repeat(TEXT_LEN));
    // Only the 10-char caller span is sent, not the whole 100-char document.
    expect(usages[0].charsSent).toBe(10);
  });

  it('applies caller-supplied caps to bound the fallback', async () => {
    stubFetch();
    const usages: Array<{ charsSent: number; capped: boolean }> = [];
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN, {
      caps: { maxChars: 20 },
      onUsage: (u) => usages.push(u as { charsSent: number; capped: boolean }),
    });
    await reviewer?.('x'.repeat(TEXT_LEN));
    // Whole-document fallback span is 100 chars > 20 cap, so it is dropped whole:
    // nothing to review, zero usage, capped=true.
    expect(usages[0]).toMatchObject({ charsSent: 0, capped: true });
  });
});

describe('verifierFromByok', () => {
  it('returns undefined on absent / unsupported / keyless descriptors', () => {
    expect(verifierFromByok(undefined)).toBeUndefined();
    expect(verifierFromByok({ apiKey: KEY })).toBeUndefined();
    expect(verifierFromByok({ provider: 'gemini', apiKey: KEY })).toBeUndefined();
    expect(verifierFromByok({ provider: 'openai' })).toBeUndefined();
    expect(verifierFromByok({ provider: 'openai', apiKey: '' })).toBeUndefined();
  });

  it('builds a named verifier for valid openai / anthropic descriptors', () => {
    const oa = verifierFromByok({ provider: 'openai', apiKey: KEY });
    expect(oa?.name).toBe('openai');
    const an = verifierFromByok({ provider: 'anthropic', apiKey: KEY });
    expect(an?.name).toBe('anthropic');
  });

  it('never throws on a malformed descriptor', () => {
    expect(() => verifierFromByok(42 as unknown as ByokRequest)).not.toThrow();
    expect(() =>
      verifierFromByok({ provider: 123 as unknown as string }),
    ).not.toThrow();
  });
});
