import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/config/env', () => ({
  ENV: { api_url: 'https://test-api.shothik.ai' },
}));

vi.mock('@/lib/ai-gateway', () => ({
  executeWithGateway: vi.fn(async (fn: (signal: AbortSignal | undefined) => Promise<unknown>) => {
    const result = await fn(undefined);
    return { data: result };
  }),
}));

vi.mock('@/lib/result-cache', () => ({
  computeContentHash: vi.fn(async () => 'mock-hash'),
  getCachedResult: vi.fn(() => null),
  setCachedResult: vi.fn(),
}));

vi.mock('@/lib/tool-errors', () => ({
  normalizeError: vi.fn((err: unknown) => err),
}));

import { getCachedResult } from '@/lib/result-cache';
import {
  detectAutoFreezeTerms,
  disableAutoFreezeTerm,
  enableAutoFreezeTerm,
  getDisabledTerms,
  ParaphraseServiceError,
} from '../paraphrase.service';

const mockedGetCachedResult = getCachedResult as Mock;

describe('paraphrase.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('detectAutoFreezeTerms', () => {
    it('calls fetch with correct parameters', async () => {
      const mockResult = { success: true, terms: [{ term: 'test', type: 'keyword' }] };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      } as Response);

      const result = await detectAutoFreezeTerms({ text: 'Hello world' });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/auto-freeze/detect'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(mockResult);
    });

    it('uses cached result when available', async () => {
      const cached = { success: true, terms: [] };
      mockedGetCachedResult.mockReturnValueOnce({ data: cached, stale: false });

      const result = await detectAutoFreezeTerms({ text: 'Cached' });
      expect(result).toEqual(cached);
    });
  });

  describe('disableAutoFreezeTerm', () => {
    it('sends disable request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await disableAutoFreezeTerm('keyword', 'token-123');
      expect(result).toEqual({ success: true });
    });

    it('throws on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(disableAutoFreezeTerm('keyword', 'token-123')).rejects.toThrow(
        ParaphraseServiceError,
      );
    });

    it('rethrows AbortError when it is an Error instance', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

      await expect(disableAutoFreezeTerm('keyword', 'token-123')).rejects.toHaveProperty('name', 'AbortError');
    });
  });

  describe('enableAutoFreezeTerm', () => {
    it('sends enable request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await enableAutoFreezeTerm('keyword', 'token-123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getDisabledTerms', () => {
    it('fetches disabled terms', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, terms: ['term1'] }),
      } as Response);

      const result = await getDisabledTerms('token-123');
      expect(result).toEqual({ success: true, terms: ['term1'] });
    });
  });

  describe('ParaphraseServiceError', () => {
    it('creates error with correct properties', () => {
      const err = new ParaphraseServiceError('Test', 400, { detail: 'info' });
      expect(err.message).toBe('Test');
      expect(err.status).toBe(400);
      expect(err.name).toBe('ParaphraseServiceError');
    });
  });
});
