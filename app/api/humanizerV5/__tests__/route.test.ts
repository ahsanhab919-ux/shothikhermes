import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/llm/gateway', () => ({
  completeForTool: vi.fn(async () => ({
    text: 'This is humanized text.',
  })),
  refineOutput: vi.fn(async ({ draft }: { draft: string }) => draft),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { POST } from '../../humanizerV5/route';

let ipOctet = 1;

function createNextRequest(body: Record<string, unknown>): NextRequest {
  const ip = `127.0.0.${ipOctet++}`;
  return new NextRequest('http://localhost:3000/api/humanizerV5', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
  });
}

describe('POST /api/humanizerV5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns humanized text', async () => {
    const req = createNextRequest({ text: 'This is AI generated text.' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.output).toBeDefined();
    expect(Array.isArray(data.output)).toBe(true);
    expect(data.output[0]).toHaveProperty('text');
    expect(data.output[0]).toHaveProperty('aiPercentage');
  });

  it('returns 422 when text is missing', async () => {
    const req = createNextRequest({});
    const response = await POST(req);

    expect(response.status).toBe(422);
  });

  it('returns 422 when text is empty', async () => {
    const req = createNextRequest({ text: '' });
    const response = await POST(req);

    expect(response.status).toBe(422);
  });
});
