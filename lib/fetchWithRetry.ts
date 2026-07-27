interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: (response: Response) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  retryOn: (res) => res.status >= 500 || res.status === 429,
};

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      if (response.ok || attempt === opts.maxRetries || !opts.retryOn(response)) {
        return response;
      }

      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? Math.min(parseInt(retryAfter, 10) * 1000, opts.maxDelay)
        : Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay);

      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      const delay = Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("fetchWithRetry: max retries exceeded");
}

export default fetchWithRetry;
