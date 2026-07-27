import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/llm/gateway', () => ({
  completeForTool: vi.fn(async () => ({
    text: JSON.stringify({
      sentences: [{ sentence: 'Hello world.', highlight_sentence_for_ai: false }],
      ai_percentage: 10,
    }),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST } from '../../check/route';

function createNextRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai-detector/check', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/ai-detector/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('returns 400 when text is missing', async () => {
    const req = createNextRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('text is required');
  });

  it('returns 400 when text is not a string', async () => {
    const req = createNextRequest({ text: 123 });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('uses Gemini fallback when desklib is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'));

    const req = createNextRequest({ text: 'Hello world. This is a test.' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toBeDefined();
    expect(data.result).toHaveProperty('ai_percentage');
    expect(data.result).toHaveProperty('sentences');
  });

  it('uses desklib when available', async () => {
    const desklibResponse = {
      success: true,
      result: {
        sentences: [
          { sentence: 'Hello.', highlight_sentence_for_ai: false, classification: 'human', perplexity: 50 },
        ],
        summary: { ai_percentage: 5, ai_probability: 0.05, assessment: 'human', total_sentences: 1, total_words: 1 },
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(desklibResponse), { status: 200 }),
    );

    const req = createNextRequest({ text: 'Hello.' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.ai_percentage).toBe(5);
  });
});
