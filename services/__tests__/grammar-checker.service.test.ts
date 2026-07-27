import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
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

import api from '@/lib/api';
import { getCachedResult } from '@/lib/result-cache';
import {
  grammarCheck,
  fetchGrammarSections,
  fetchGrammarSection,
  renameGrammarSection,
  deleteGrammarSection,
  GrammarServiceError,
} from '../grammar-checker.service';

const mockedApiPost = api.post as Mock;
const mockedApiGet = api.get as Mock;
const mockedApiPut = api.put as Mock;
const mockedApiDelete = api.delete as Mock;
const mockedGetCachedResult = getCachedResult as Mock;

describe('grammar-checker.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('grammarCheck', () => {
    it('sends text and returns grammar check response', async () => {
      const mockData = {
        success: true,
        data: {
          correctedText: 'Hello world.',
          corrections: [{ original: 'Helo', suggestion: 'Hello', type: 'spelling' }],
        },
      };
      mockedApiPost.mockResolvedValue({ data: mockData });

      const result = await grammarCheck({ text: 'Helo world.' });
      expect(result).toEqual(mockData);
    });

    it('uses cached result when available', async () => {
      const cached = { success: true, data: { correctedText: 'cached', corrections: [] } };
      mockedGetCachedResult.mockReturnValueOnce({ data: cached, stale: false });

      const result = await grammarCheck({ text: 'test' });
      expect(result).toEqual(cached);
      expect(mockedApiPost).not.toHaveBeenCalled();
    });
  });

  describe('fetchGrammarSections', () => {
    it('fetches sections with default params', async () => {
      const mockData = { data: [{ id: '1', name: 'Section' }], total: 1 };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchGrammarSections();
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchGrammarSection', () => {
    it('fetches a single section', async () => {
      const mockData = { id: '1', name: 'Section' };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchGrammarSection('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('renameGrammarSection', () => {
    it('renames a section', async () => {
      mockedApiPut.mockResolvedValue({ data: { id: '1', name: 'New' } });

      const result = await renameGrammarSection('1', { name: 'New' });
      expect(result).toEqual({ id: '1', name: 'New' });
    });
  });

  describe('deleteGrammarSection', () => {
    it('deletes a section', async () => {
      mockedApiDelete.mockResolvedValue({ data: { success: true } });

      const result = await deleteGrammarSection('1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('GrammarServiceError', () => {
    it('creates error with correct properties', () => {
      const err = new GrammarServiceError('Error', 500, { detail: 'info' });
      expect(err.message).toBe('Error');
      expect(err.status).toBe(500);
      expect(err.name).toBe('GrammarServiceError');
    });
  });
});
