import { logger } from "./logger";
import type { ToolName } from "./ai-gateway";
import { incrementCounter, setGauge } from "./runtime-metrics";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  hash: string;
}

interface CacheConfig {
  maxEntries: number;
  ttlMs: number;
  staleTtlMs: number;
}

const TOOL_CACHE_CONFIGS: Record<ToolName, CacheConfig> = {
  paraphrase: { maxEntries: 100, ttlMs: 4 * 60 * 60 * 1000, staleTtlMs: 72 * 60 * 60 * 1000 },
  plagiarism: { maxEntries: 50, ttlMs: 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 },
  ai_detector: { maxEntries: 100, ttlMs: 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 },
  grammar: { maxEntries: 100, ttlMs: 2 * 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 },
  humanize: { maxEntries: 80, ttlMs: 4 * 60 * 60 * 1000, staleTtlMs: 72 * 60 * 60 * 1000 },
  summarize: { maxEntries: 80, ttlMs: 2 * 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 },
  translator: { maxEntries: 80, ttlMs: 2 * 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 },
  ai_cowriter: { maxEntries: 50, ttlMs: 30 * 60 * 1000, staleTtlMs: 2 * 60 * 60 * 1000 },
};

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private staleCache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private tool: ToolName;

  constructor(tool: ToolName) {
    this.tool = tool;
    this.config = TOOL_CACHE_CONFIGS[tool];
  }

  get(hash: string): { data: T; stale: boolean } | null {
    const entry = this.cache.get(hash);
    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (age < this.config.ttlMs) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        incrementCounter(`cache.${this.tool}.hit`);
        return { data: entry.data, stale: false };
      }

      this.cache.delete(hash);
      this.staleCache.set(hash, entry);
    }

    const staleEntry = this.staleCache.get(hash);
    if (staleEntry) {
      const age = Date.now() - staleEntry.timestamp;
      if (age < this.config.staleTtlMs) {
        incrementCounter(`cache.${this.tool}.stale_hit`);
        return { data: staleEntry.data, stale: true };
      }
      this.staleCache.delete(hash);
    }

    incrementCounter(`cache.${this.tool}.miss`);
    return null;
  }

  set(hash: string, data: T): void {
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
      incrementCounter(`cache.${this.tool}.lru_evictions`);
    }

    this.cache.set(hash, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      hash,
    });

    this.staleCache.delete(hash);
    setGauge(`cache.${this.tool}.size`, this.cache.size);
    setGauge(`cache.${this.tool}.stale_size`, this.staleCache.size);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const evicted = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      if (evicted) {
        this.staleCache.set(oldestKey, evicted);
        this.evictStale();
      }
    }
  }

  private evictStale(): void {
    const maxStale = this.config.maxEntries * 2;
    if (this.staleCache.size <= maxStale) return;

    const sizeBefore = this.staleCache.size;
    const now = Date.now();
    for (const [key, entry] of this.staleCache) {
      if (now - entry.timestamp > this.config.staleTtlMs) {
        this.staleCache.delete(key);
      }
    }

    if (this.staleCache.size > maxStale) {
      const excess = this.staleCache.size - maxStale;
      const keys = this.staleCache.keys();
      for (let i = 0; i < excess; i++) {
        const next = keys.next();
        if (!next.done) this.staleCache.delete(next.value);
      }
    }

    const evicted = sizeBefore - this.staleCache.size;
    if (evicted > 0) {
      incrementCounter(`cache.${this.tool}.stale_evictions`, evicted);
    }
  }

  clear(): void {
    this.cache.clear();
    this.staleCache.clear();
  }

  getStats(): {
    size: number;
    staleSize: number;
    maxEntries: number;
    ttlMs: number;
  } {
    return {
      size: this.cache.size,
      staleSize: this.staleCache.size,
      maxEntries: this.config.maxEntries,
      ttlMs: this.config.ttlMs,
    };
  }
}

const caches = new Map<ToolName, LRUCache<unknown>>();

function getCache<T>(tool: ToolName): LRUCache<T> {
  if (!caches.has(tool)) {
    caches.set(tool, new LRUCache<unknown>(tool));
  }
  return caches.get(tool)! as LRUCache<T>;
}

export async function computeContentHash(
  ...parts: (string | number | boolean | undefined | null)[]
): Promise<string> {
  const content = parts
    .map((p) => (p === undefined || p === null ? "" : String(p)))
    .join("|");

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getCachedResult<T>(
  tool: ToolName,
  hash: string
): { data: T; stale: boolean } | null {
  const cache = getCache<T>(tool);
  const result = cache.get(hash);
  if (result) {
    logger.info(
      `Cache ${result.stale ? "STALE HIT" : "HIT"} for ${tool}: ${hash.substring(0, 8)}...`
    );
  }
  return result;
}

export function setCachedResult<T>(
  tool: ToolName,
  hash: string,
  data: T
): void {
  const cache = getCache<T>(tool);
  cache.set(hash, data);
}

export function clearToolCache(tool: ToolName): void {
  const cache = caches.get(tool);
  if (cache) {
    cache.clear();
    logger.info(`Cache cleared for ${tool}`);
  }
}

export function clearAllCaches(): void {
  for (const [tool, cache] of caches) {
    cache.clear();
  }
  logger.info("All caches cleared");
}

export function getCacheStats(): Record<
  string,
  { size: number; staleSize: number; maxEntries: number; ttlMs: number }
> {
  const stats: Record<
    string,
    { size: number; staleSize: number; maxEntries: number; ttlMs: number }
  > = {};
  for (const [tool, cache] of caches) {
    stats[tool] = cache.getStats();
  }
  return stats;
}
