import { executeWithGateway } from "@/lib/ai-gateway";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { normalizeError } from "@/lib/tool-errors";

export class SummarizeServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "SummarizeServiceError";
    this.status = status;
    this.details = details;
  }
}

export type SummarizeType = "key-points" | "paragraph" | "bullets" | "tldr" | "abstract";
export type SummarizeLength = "short" | "medium" | "long";

export interface SummarizePayload {
  text: string;
  type?: SummarizeType;
  length?: SummarizeLength;
}

export interface SummarizeResponse {
  success: boolean;
  summary: string;
  type: SummarizeType;
  length: SummarizeLength;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export const summarizeText = async (
  payload: SummarizePayload,
  signal?: AbortSignal
): Promise<SummarizeResponse> => {
  try {
    const type = payload.type ?? "key-points";
    const length = payload.length ?? "medium";
    const hash = await computeContentHash(payload.text, type, length);
    const cached = getCachedResult<SummarizeResponse>("summarize", hash);
    if (cached && !cached.stale) {
      return cached.data;
    }

    const result = await executeWithGateway(
      async (gatewaySignal) => {
        const combinedSignal =
          signal && gatewaySignal
            ? AbortSignal.any([signal, gatewaySignal])
            : signal || gatewaySignal;

        const response = await fetch("/api/tools/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: payload.text, type, length }),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const err = new SummarizeServiceError(
            errorData.error || "Failed to summarize",
            response.status,
            errorData
          );
          throw err;
        }

        return (await response.json()) as SummarizeResponse;
      },
      { tool: "summarize", signal }
    );

    setCachedResult("summarize", hash, result.data);
    return result.data;
  } catch (error) {
    if (error instanceof SummarizeServiceError) throw error;
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TaskCancelledError" || error.message === "The operation was aborted")
    ) {
      const abortErr = new Error("Request was cancelled");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    throw normalizeError(error, "summarize");
  }
};
