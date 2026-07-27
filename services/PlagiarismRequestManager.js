class PlagiarismRequestManager {
  constructor() {
    this.activeRequests = new Map(); // textHash -> { promise, abortController, timestamp }
    this.cachedResults = new Map(); // textHash -> { score, results, timestamp, ttl }
    this.subscribers = new Map(); // textHash -> Set of callback functions
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    // this.REQUEST_TIMEOUT = 30000; // 30 seconds
    this.REQUEST_TIMEOUT = 600000; // 10 minutes
  }

  // Generate consistent hash for text content
  generateTextHash(text, language = "en") {
    const normalizedText =
      text?.trim().toLowerCase().replace(/\s+/g, " ") || "";
    return `${normalizedText.slice(0, 100)}_${
      normalizedText.length
    }_${language}`;
  }

  // Subscribe to plagiarism check updates
  subscribe(textHash, callback) {
    if (!this.subscribers.has(textHash)) {
      this.subscribers.set(textHash, new Set());
    }
    this.subscribers.get(textHash).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(textHash);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(textHash);
        }
      }
    };
  }

  // Notify all subscribers for a specific text hash
  notifySubscribers(textHash, data) {
    const subs = this.subscribers.get(textHash);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in plagiarism subscriber callback:", error);
        }
      });
    }
  }

  // Check if result is cached and valid
  getCachedResult(textHash) {
    const cached = this.cachedResults.get(textHash);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cachedResults.delete(textHash);
      return null;
    }

    return {
      score: cached.score,
      results: cached.results,
      fromCache: true,
    };
  }

  // Cache the result
  setCachedResult(textHash, score, results) {
    this.cachedResults.set(textHash, {
      score,
      results,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    });
  }

  // Main method to get plagiarism check
  async checkPlagiarism(text, accessToken, language = "en") {
    if (!text?.trim()) {
      return { score: null, results: [], fromCache: false };
    }

    const textHash = this.generateTextHash(text, language);

    // Check cache first
    const cached = this.getCachedResult(textHash);
    if (cached) {
      // Notify subscribers immediately with cached data
      this.notifySubscribers(textHash, {
        loading: false,
        ...cached,
      });
      return cached;
    }

    // Check if request is already in progress
    const existingRequest = this.activeRequests.get(textHash);
    if (existingRequest) {
      // Notify subscribers that loading is in progress
      this.notifySubscribers(textHash, { loading: true });

      try {
        return await existingRequest.promise;
      } catch (error) {
        throw error;
      }
    }

    // Create new request
    const abortController = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.REQUEST_TIMEOUT);

    const promise = this.performPlagiarismCheck(
      text,
      accessToken,
      abortController.signal,
    );

    // Store active request
    this.activeRequests.set(textHash, {
      promise,
      abortController,
      timestamp: Date.now(),
    });

    // Notify subscribers that loading started
    this.notifySubscribers(textHash, { loading: true });

    try {
      const result = await promise;

      // Cache the result
      this.setCachedResult(textHash, result.score, result.results);

      // Notify subscribers with results
      this.notifySubscribers(textHash, {
        loading: false,
        ...result,
        fromCache: false,
      });

      return result;
    } catch (error) {
      // Don't notify or throw for abort errors during cleanup
      if (error.name === "AbortError") {
        this.notifySubscribers(textHash, {
          loading: false,
          cancelled: true,
        });
        return { score: null, results: [], cancelled: true };
      }

      // Notify subscribers about actual errors
      this.notifySubscribers(textHash, {
        loading: false,
        error: error.message,
      });
      throw error;
    } finally {
      // Clean up
      clearTimeout(timeoutId);
      this.activeRequests.delete(textHash);
    }
  }

  // Actual API call
  async performPlagiarismCheck(text, accessToken, signal) {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL +
      `/${process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX}/api`;

    // const API_BASE = "http://localhost:3050/api";

    const response = await fetch(`${API_BASE}/plagiarism`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, token: accessToken }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(data.message || "Plagiarism check failed");
    }

    // Process the response
    let finalScore =
      typeof data.score === "number"
        ? data.score
        : (data.summary?.match(/\((\d+)%\)/)?.[1] ?? 0) * 1;

    const results = Array.isArray(data.matches)
      ? data.matches.map((m) => ({
          percent: Math.round(m.score * 100),
          source: m?.author || "Unknown",
          chunkText: m?.chunkText || "",
        }))
      : [];

    return { score: finalScore, results };
  }

  // Cancel active request
  cancelRequest(textHash) {
    const request = this.activeRequests.get(textHash);
    if (request) {
      request.abortController.abort();
      this.activeRequests.delete(textHash);
      this.notifySubscribers(textHash, { loading: false, cancelled: true });
    }
  }

  // Clean up expired requests and cache
  cleanup() {
    const now = Date.now();

    // Clean expired cache entries
    for (const [hash, cached] of this.cachedResults.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cachedResults.delete(hash);
      }
    }

    // Clean stuck requests (older than timeout) - only if no subscribers
    for (const [hash, request] of this.activeRequests.entries()) {
      const hasActiveSubscribers =
        this.subscribers.has(hash) && this.subscribers.get(hash).size > 0;

      if (
        !hasActiveSubscribers &&
        now - request.timestamp > this.REQUEST_TIMEOUT
      ) {
        try {
          request.abortController.abort();
        } catch (error) {
          // Ignore abort errors during cleanup
        }
        this.activeRequests.delete(hash);
      }
    }
  }

  // Get current status for debugging
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      cachedResults: this.cachedResults.size,
      subscribers: this.subscribers.size,
    };
  }
}

// Create singleton instance
const plagiarismManager = new PlagiarismRequestManager();

// Set up periodic cleanup
if (typeof window !== "undefined") {
  setInterval(() => plagiarismManager.cleanup(), 60000); // Every minute
}

export default plagiarismManager;
