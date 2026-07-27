import { ENV } from "@/config/env";
import { executeWithGateway } from "@/lib/ai-gateway";
import { normalizeError } from "@/lib/tool-errors";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

const API_BASE = ENV.api_url + "/api";

export class ParaphraseServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "ParaphraseServiceError";
    this.status = status;
    this.details = details;
  }
}

interface DetectAutoFreezeParams {
  text: string;
  language?: string;
  useLLM?: boolean;
  accessToken?: string | null;
  signal?: AbortSignal;
}

interface AutoFreezeDetectionResult {
  success: boolean;
  terms?: Array<{
    term: string;
    type: string;
    [key: string]: unknown;
  }>;
  message?: string;
}

interface DisabledTermsResult {
  success: boolean;
  terms?: string[];
  message?: string;
}

const handleFetchError = async (response: Response): Promise<never> => {
  let errorData: { message?: string } = {};
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText || "Request failed" };
  }
  throw new ParaphraseServiceError(
    errorData.message || "Request failed",
    response.status,
    errorData
  );
};

export const detectAutoFreezeTerms = async ({
  text,
  language = "en",
  useLLM = false,
  accessToken = null,
  signal,
}: DetectAutoFreezeParams): Promise<AutoFreezeDetectionResult> => {
  try {
    const hash = await computeContentHash(text, language, String(useLLM));
    const cached = getCachedResult<AutoFreezeDetectionResult>("paraphrase", hash);
    if (cached && !cached.stale) {
      return cached.data;
    }

    const result = await executeWithGateway(
      async (gatewaySignal) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const combinedSignal = signal && gatewaySignal
          ? AbortSignal.any([signal, gatewaySignal])
          : signal || gatewaySignal;

        const response = await fetch(`${API_BASE}/auto-freeze/detect`, {
          method: "POST",
          headers,
          body: JSON.stringify({ text, language, useLLM }),
          signal: combinedSignal,
        });

        if (!response.ok) {
          return handleFetchError(response);
        }

        return await response.json();
      },
      { tool: "paraphrase", signal }
    );

    setCachedResult("paraphrase", hash, result.data);
    return result.data;
  } catch (error) {
    if (error instanceof ParaphraseServiceError) throw error;
    throw normalizeError(error, "paraphrase");
  }
};

export const disableAutoFreezeTerm = async (
  term: string,
  accessToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> => {
  let response: Response;
  try {
    response = await fetchWithRetry(`${API_BASE}/auto-freeze/disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ term }),
      signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw fetchError;
    }
    throw new ParaphraseServiceError(
      "Could not connect to the server. Please check your connection and try again.",
      0,
      fetchError
    );
  }

  if (!response.ok) {
    return handleFetchError(response);
  }

  return await response.json();
};

export const enableAutoFreezeTerm = async (
  term: string,
  accessToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> => {
  let response: Response;
  try {
    response = await fetchWithRetry(`${API_BASE}/auto-freeze/enable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ term }),
      signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw fetchError;
    }
    throw new ParaphraseServiceError(
      "Could not connect to the server. Please check your connection and try again.",
      0,
      fetchError
    );
  }

  if (!response.ok) {
    return handleFetchError(response);
  }

  return await response.json();
};

export const getDisabledTerms = async (
  accessToken: string,
  signal?: AbortSignal
): Promise<DisabledTermsResult> => {
  let response: Response;
  try {
    response = await fetchWithRetry(`${API_BASE}/auto-freeze/disabled-terms`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw fetchError;
    }
    throw new ParaphraseServiceError(
      "Could not connect to the server. Please check your connection and try again.",
      0,
      fetchError
    );
  }

  if (!response.ok) {
    return handleFetchError(response);
  }

  return await response.json();
};
