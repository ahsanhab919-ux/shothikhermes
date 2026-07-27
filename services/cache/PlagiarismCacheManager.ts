import type { PlagiarismReport } from "@/types/plagiarism";

interface CacheEntry {
  report: PlagiarismReport;
  timestamp: number;
}

// Module-level state (singleton pattern via module scope)
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached report by key
 */
export const getCachedReport = (key: string): PlagiarismReport | null => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }

  return entry.report;
};

/**
 * Cache a report with key
 */
export const setCachedReport = (
  key: string,
  report: PlagiarismReport,
): void => {
  cache.set(key, {
    report,
    timestamp: Date.now(),
  });
};

/**
 * Clear all cached reports
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Cleanup expired entries
 */
export const cleanupExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > TTL) {
      cache.delete(key);
    }
  }
};

/**
 * Remove specific entry from cache
 */
export const removeCachedReport = (key: string): void => {
  cache.delete(key);
};

// Setup periodic cleanup (only in browser)
if (typeof window !== "undefined") {
  setInterval(cleanupExpiredEntries, 60000); // Every minute
}
