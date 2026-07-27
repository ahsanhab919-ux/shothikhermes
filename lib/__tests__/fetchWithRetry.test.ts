import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithRetry } from '../fetchWithRetry';

describe('fetchWithRetry', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns response on first successful call', async () => {
    const mockResponse = new Response('OK', { status: 200 });
    fetchMock.mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com');
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns non-retryable error responses immediately', async () => {
    const mockResponse = new Response('Not Found', { status: 404 });
    fetchMock.mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com', undefined, {
      maxRetries: 2,
      baseDelay: 1,
      maxDelay: 5,
    });
    expect(result.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 errors and succeeds', async () => {
    const error500 = new Response('Error', { status: 500 });
    const ok200 = new Response('OK', { status: 200 });
    fetchMock
      .mockResolvedValueOnce(error500)
      .mockResolvedValueOnce(ok200);

    const result = await fetchWithRetry('https://example.com', undefined, {
      maxRetries: 1,
      baseDelay: 1,
      maxDelay: 5,
    });

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 errors', async () => {
    const error429 = new Response('Rate Limited', { status: 429 });
    const ok200 = new Response('OK', { status: 200 });
    fetchMock
      .mockResolvedValueOnce(error429)
      .mockResolvedValueOnce(ok200);

    const result = await fetchWithRetry('https://example.com', undefined, {
      maxRetries: 1,
      baseDelay: 1,
      maxDelay: 5,
    });

    expect(result.status).toBe(200);
  });

  it('returns error response after exhausting retries', async () => {
    const error500 = new Response('Error', { status: 500 });
    fetchMock.mockResolvedValue(error500);

    const result = await fetchWithRetry('https://example.com', undefined, {
      maxRetries: 1,
      baseDelay: 1,
      maxDelay: 5,
    });

    expect(result.status).toBe(500);
  });

  it('throws on network error after exhausting retries', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    await expect(
      fetchWithRetry('https://example.com', undefined, {
        maxRetries: 0,
        baseDelay: 1,
        maxDelay: 5,
      }),
    ).rejects.toThrow('Network error');
  });

  it('passes init options to fetch', async () => {
    const mockResponse = new Response('OK', { status: 200 });
    fetchMock.mockResolvedValue(mockResponse);

    await fetchWithRetry('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
