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
  aiDetectorCheck,
  fetchAiDetectorSections,
  fetchAiDetectorSection,
  renameAiDetectorSection,
  deleteAiDetectorSection,
  fetchAiDetectorHistories,
  fetchAiDetectorHistory,
  fetchAiDetectorShare,
  AIDetectorServiceError,
} from '../ai-detector.service';

const mockedApiPost = api.post as Mock;
const mockedApiGet = api.get as Mock;
const mockedApiPut = api.put as Mock;
const mockedApiDelete = api.delete as Mock;
const mockedGetCachedResult = getCachedResult as Mock;

describe('ai-detector.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('aiDetectorCheck', () => {
    it('sends text and returns response', async () => {
      const mockData = { success: true, data: { score: 85 } };
      mockedApiPost.mockResolvedValue({ data: mockData });

      const result = await aiDetectorCheck({ text: 'Hello world' });
      expect(result).toEqual(mockData);
    });

    it('uses cached result when available', async () => {
      const cached = { success: true, data: { score: 90 } };
      mockedGetCachedResult.mockReturnValueOnce({ data: cached, stale: false });

      const result = await aiDetectorCheck({ text: 'Cached text' });
      expect(result).toEqual(cached);
      expect(mockedApiPost).not.toHaveBeenCalled();
    });
  });

  describe('fetchAiDetectorSections', () => {
    it('fetches sections with default pagination', async () => {
      const mockData = { data: [{ id: '1', name: 'Section 1' }], total: 1 };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchAiDetectorSections();
      expect(result).toEqual(mockData);
      expect(mockedApiGet).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    });

    it('throws on API error', async () => {
      mockedApiGet.mockRejectedValue(new Error('Request failed'));
      await expect(fetchAiDetectorSections()).rejects.toThrow();
    });
  });

  describe('fetchAiDetectorSection', () => {
    it('fetches a single section by ID', async () => {
      const mockData = { id: '1', name: 'Section 1' };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchAiDetectorSection('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('renameAiDetectorSection', () => {
    it('renames a section', async () => {
      const mockData = { id: '1', name: 'New Name' };
      mockedApiPut.mockResolvedValue({ data: mockData });

      const result = await renameAiDetectorSection('1', { name: 'New Name' });
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteAiDetectorSection', () => {
    it('deletes a section', async () => {
      mockedApiDelete.mockResolvedValue({ data: { success: true } });

      const result = await deleteAiDetectorSection('1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('fetchAiDetectorHistories', () => {
    it('fetches histories with pagination', async () => {
      const mockData = { data: [], total: 0 };
      mockedApiGet.mockResolvedValue({ data: mockData });

      await fetchAiDetectorHistories({ page: 2, limit: 5 });
      expect(mockedApiGet).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });
  });

  describe('fetchAiDetectorHistory', () => {
    it('fetches a single history entry', async () => {
      const mockData = { id: '1', text: 'Test', score: 80, createdAt: '2025-01-01' };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchAiDetectorHistory('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchAiDetectorShare', () => {
    it('fetches a shared result', async () => {
      const mockData = { data: { id: '1', text: 'Test', score: 80, createdAt: '2025-01-01' } };
      mockedApiGet.mockResolvedValue({ data: mockData });

      const result = await fetchAiDetectorShare('1');
      expect(result).toEqual(mockData);
    });
  });

  describe('AIDetectorServiceError', () => {
    it('creates error with correct properties', () => {
      const err = new AIDetectorServiceError('Test error', 404, { detail: 'info' });
      expect(err.message).toBe('Test error');
      expect(err.status).toBe(404);
      expect(err.name).toBe('AIDetectorServiceError');
      expect(err.details).toEqual({ detail: 'info' });
    });

    it('defaults status to 500', () => {
      const err = new AIDetectorServiceError('Error');
      expect(err.status).toBe(500);
    });
  });
});
