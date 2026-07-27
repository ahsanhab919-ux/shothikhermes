import pRetry, { AbortError } from "p-retry";
import { z } from "zod";

/**
 * Enterprise Retry Mechanism
 * Uses exponential backoff for transient network errors.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    minTimeout?: number;
    onFailedAttempt?: (error: Error) => void;
  } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const minTimeout = options.minTimeout ?? 1000;

  return pRetry(
    async () => {
      try {
        return await operation();
      } catch (error) {
        // Don't retry on Zod validation errors (client errors)
        if (error instanceof z.ZodError) {
          throw new AbortError(error);
        }
        
        // Don't retry on 4xx HTTP errors (client errors)
        if (error instanceof Error && error.message.includes("status 4")) {
          throw new AbortError(error);
        }

        throw error;
      }
    },
    {
      retries,
      minTimeout,
      onFailedAttempt: options.onFailedAttempt ? (error: any) => {
        options.onFailedAttempt!(new Error(`Attempt ${error.attemptNumber} failed: ${error.message || 'unknown error'}`));
      } : (error: any) => {
        console.warn(`[Retry] Attempt ${error.attemptNumber} failed: ${error.message || 'unknown error'}`);
      },
    }
  );
}

/**
 * Simple Circuit Breaker Implementation
 * Prevents cascading failures when a downstream service is struggling.
 */
export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeoutMs: number;
  
  private failures: number = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private nextAttemptAt: number = 0;

  constructor(options: { failureThreshold?: number; resetTimeoutMs?: number } = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000; // 30 seconds default
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() > this.nextAttemptAt) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("CircuitBreaker is OPEN. Fast-failing request.");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptAt = Date.now() + this.resetTimeoutMs;
      console.error(`[CircuitBreaker] State transitioned to OPEN. Cooling down for ${this.resetTimeoutMs}ms.`);
    }
  }
}
