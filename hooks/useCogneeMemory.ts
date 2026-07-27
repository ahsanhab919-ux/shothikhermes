"use client";

import { useState, useCallback } from "react";

interface MemoryEntry {
  id: string;
  text: string;
  type: string;
  createdAt: number;
}

interface UseCogneeMemoryOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useCogneeMemory(options: UseCogneeMemoryOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Add memory to Cognee
  const addMemory = useCallback(
    async (text: string, type: string = "conversation", metadata?: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, type, metadata }),
        });

        if (!response.ok) {
          throw new Error("Failed to add memory");
        }

        const result = await response.json();
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  // Search memories
  const searchMemory = useCallback(
    async (query: string, limit: number = 10) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/memory?q=${encodeURIComponent(query)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Failed to search memory");
        }

        const result = await response.json();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  // Build knowledge graph
  const cognify = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/memory", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to build knowledge graph");
      }

      const result = await response.json();
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    addMemory,
    searchMemory,
    cognify,
    isLoading,
    error,
  };
}
