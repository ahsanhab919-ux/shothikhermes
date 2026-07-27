import { describe, it, expect, vi } from 'vitest';
import {
  openAiVerifier,
  anthropicVerifier,
  verifyMeaningPreserved,
  parseEntailmentAnswer,
  buildEntailmentPrompt,
  ENTAILMENT_MAX_OUTPUT_TOKENS,
  ENTAILMENT_MAX_CHARS,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  type MeaningVerifier,
} from './entailment';

const BEFORE = 'The report is due on Friday.';
const AFTER = 'The report is due by Friday.';

/** Fake fetch returning an OpenAI-shaped body with the given content + status. */
function openAiFetch(content: string, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({ choices: [{ message: { content } }] }),
  })) as unknown as typeof fetch;
}

/** Fake fetch returning an Anthropic-shaped body with the given text + status. */
function anthropicFetch(text: string, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({ content: [{ text }] }),
  })) as unknown as typeof fetch;
}

describe('parseEntailmentAnswer — strict affirmative only', () => {
  it('accepts explicit affirmatives', () => {
    for (const yes of ['YES', 'yes', 'Yes.', 'true', 'preserved', 'equivalent', 'same meaning']) {
      expect(parseEntailmentAnswer(yes)).toBe(true);
    }
  });

  it('accepts a JSON-ish preserved:true', () => {
    expect(parseEntailmentAnswer('{"preserved": true}')).toBe(true);
    expect(parseEntailmentAnswer('entailed = true')).toBe(true);
  });

  it('rejects negatives, empties, and ambiguity (fail closed)', () => {
    for (const no of ['', 'NO', 'no', 'nope', 'maybe', 'I think so', 'false', 'not sure', '{}']) {
      expect(parseEntailmentAnswer(no)).toBe(false);
    }
  });
});

describe('buildEntailmentPrompt', () => {
  it('embeds both sides and biases toward NO on doubt', () => {
    const prompt = buildEntailmentPrompt(BEFORE, AFTER);
    expect(prompt).toContain(BEFORE);
    expect(prompt).toContain(AFTER);
    expect(prompt).toContain('YES or NO');
    expect(prompt.toLowerCase()).toContain('doubt');
  });

  it('truncates each side to ENTAILMENT_MAX_CHARS', () => {
    const huge = 'x'.repeat(ENTAILMENT_MAX_CHARS + 500);
    const prompt = buildEntailmentPrompt(huge, huge);
    // The full oversized string must not appear verbatim.
    expect(prompt.includes(huge)).toBe(false);
  });
});

describe('openAiVerifier', () => {
  it('returns false with no API key and never calls fetch', async () => {
    const spy = openAiFetch('YES');
    const v = openAiVerifier({ apiKey: undefined, fetchImpl: spy });
    expect(await v.verify(BEFORE, AFTER)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns true for a no-op edit without calling fetch', async () => {
    const spy = openAiFetch('NO'); // even if the model would say no, a no-op is safe
    const v = openAiVerifier({ apiKey: 'sk-test', fetchImpl: spy });
    expect(await v.verify(BEFORE, BEFORE)).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('POSTs to OpenAI with a Bearer key and bounded tokens', async () => {
    const spy = openAiFetch('YES');
    const v = openAiVerifier({ apiKey: 'sk-test', fetchImpl: spy });
    await v.verify(BEFORE, AFTER);
    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(body.max_tokens).toBe(ENTAILMENT_MAX_OUTPUT_TOKENS);
  });

  it('returns true only on an affirmative answer', async () => {
    const yes = openAiVerifier({ apiKey: 'sk-test', fetchImpl: openAiFetch('YES') });
    expect(await yes.verify(BEFORE, AFTER)).toBe(true);
    const no = openAiVerifier({ apiKey: 'sk-test', fetchImpl: openAiFetch('NO') });
    expect(await no.verify(BEFORE, AFTER)).toBe(false);
  });

  it('fails closed to false on non-2xx and on network error', async () => {
    const bad = openAiVerifier({ apiKey: 'sk-test', fetchImpl: openAiFetch('', false, 429) });
    expect(await bad.verify(BEFORE, AFTER)).toBe(false);
    const throwing = vi.fn(async () => {
      throw new Error('down');
    }) as unknown as typeof fetch;
    const netErr = openAiVerifier({ apiKey: 'sk-test', fetchImpl: throwing });
    expect(await netErr.verify(BEFORE, AFTER)).toBe(false);
  });
});

describe('anthropicVerifier', () => {
  it('POSTs to Anthropic with x-api-key + version and parses the content shape', async () => {
    const spy = anthropicFetch('YES');
    const v = anthropicVerifier({ apiKey: 'sk-ant', fetchImpl: spy });
    expect(await v.verify(BEFORE, AFTER)).toBe(true);
    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse((init as RequestInit).body as string).model).toBe(DEFAULT_ANTHROPIC_MODEL);
  });

  it('fails closed to false on non-2xx', async () => {
    const v = anthropicVerifier({ apiKey: 'sk-ant', fetchImpl: anthropicFetch('', false, 500) });
    expect(await v.verify(BEFORE, AFTER)).toBe(false);
  });
});

describe('verifyMeaningPreserved — the fail-closed gate', () => {
  it('returns false when no verifier is supplied', async () => {
    expect(await verifyMeaningPreserved(undefined, BEFORE, AFTER)).toBe(false);
  });

  it('returns true when the verifier confirms', async () => {
    const ok: MeaningVerifier = { name: 'stub', verify: async () => true };
    expect(await verifyMeaningPreserved(ok, BEFORE, AFTER)).toBe(true);
  });

  it('returns false when the verifier denies', async () => {
    const no: MeaningVerifier = { name: 'stub', verify: async () => false };
    expect(await verifyMeaningPreserved(no, BEFORE, AFTER)).toBe(false);
  });

  it('returns false (never throws) when the verifier throws', async () => {
    const boom: MeaningVerifier = {
      name: 'stub',
      verify: async () => {
        throw new Error('boom');
      },
    };
    await expect(verifyMeaningPreserved(boom, BEFORE, AFTER)).resolves.toBe(false);
  });

  it('coerces a non-true return to false (defensive)', async () => {
    const weird = {
      name: 'stub',
      verify: async () => 'yes' as unknown as boolean,
    } as MeaningVerifier;
    expect(await verifyMeaningPreserved(weird, BEFORE, AFTER)).toBe(false);
  });
});
