import { mapToReport } from "../mappers/PlagiarismDataMapper";
import type {
  PlagiarismReport,
  RawPlagiarismResponse,
} from "../types/plagiarism";
import { executeWithGateway } from "@/lib/ai-gateway";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_PLAGIARISM_REDIRECT_PREFIX
  ? `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PLAGIARISM_REDIRECT_PREFIX}`
  : process.env.NEXT_PUBLIC_API_URL || "";
const ANALYZE_ENDPOINT = "/plagiarism/analyze";
const ANALYZE_FILE_ENDPOINT = "/plagiarism/analyze-file";

// Raw types are now in @/types/plagiarism as RawPlagiarismResponse

export class PlagiarismServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "PlagiarismServiceError";
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends PlagiarismServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 401, details);
    this.name = "UnauthorizedError";
  }
}

export class QuotaExceededError extends PlagiarismServiceError {
  constructor(message: string, details?: unknown, status = 429) {
    super(message, status, details);
    this.name = "QuotaExceededError";
  }
}

export class ServerUnavailableError extends PlagiarismServiceError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, status, details);
    this.name = "ServerUnavailableError";
  }
}

export interface AnalyzePlagiarismParams {
  text: string;
  token?: string;
  signal?: AbortSignal;
  baseUrl?: string;
  options?: {
    analysisType?: "basic" | "full" | "deep";
    maxChunks?: number;
    sourcesPerChunk?: number;
  };
}

export interface AnalyzePlagiarismFileParams {
  file: File;
  token?: string;
  signal?: AbortSignal;
  baseUrl?: string;
  options?: {
    analysisType?: "basic" | "full" | "deep";
    maxChunks?: number;
    sourcesPerChunk?: number;
  };
}

// Normalization logic moved to PlagiarismDataMapper

const parseErrorBody = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const analyzePlagiarism = async ({
  text,
  token,
  signal,
  baseUrl = DEFAULT_API_BASE,
  options,
}: AnalyzePlagiarismParams): Promise<PlagiarismReport> => {
  if (!text?.trim()) {
    throw new PlagiarismServiceError("Text input is required", 400);
  }

  if (!baseUrl) {
    throw new PlagiarismServiceError(
      "API URL is not configured. Please check your environment settings.",
      0,
    );
  }

  const hash = await computeContentHash(text, options?.analysisType, options?.maxChunks, options?.sourcesPerChunk);
  const cached = getCachedResult<PlagiarismReport>("plagiarism", hash);
  if (cached && !cached.stale) {
    return cached.data;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${baseUrl}${ANALYZE_ENDPOINT}`;

  const result = await executeWithGateway(
    async (gatewaySignal) => {
      const combinedSignal = signal && gatewaySignal
        ? AbortSignal.any([signal, gatewaySignal])
        : signal || gatewaySignal;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            text,
            ...(options && { options }),
          }),
          signal: combinedSignal,
        });
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          if (signal?.aborted) {
            throw fetchError;
          }
          throw new PlagiarismServiceError(
            "The scan took too long and was cancelled. Try with shorter text or try again later.",
            408,
          );
        }
        throw new PlagiarismServiceError(
          "Could not connect to the plagiarism server. Please check your connection and try again.",
          0,
          fetchError,
        );
      }

      if (!response.ok) {
        const details = await parseErrorBody(response);
        const message =
          (typeof details === "object" &&
            details !== null &&
            "message" in details &&
            typeof (details as Record<string, unknown>).message === "string" &&
            (details as Record<string, unknown>).message) ||
          `Request failed with status ${response.status}`;

        if (response.status === 401) {
          throw new UnauthorizedError(message as string, details);
        }

        if (response.status === 402) {
          throw new QuotaExceededError(
            (message as string) ||
              "Insufficient credits. Please upgrade your plan.",
            details,
            response.status,
          );
        }

        if (response.status === 403 || response.status === 429) {
          throw new QuotaExceededError(message as string, details, response.status);
        }

        if (response.status >= 500) {
          throw new ServerUnavailableError(
            message as string,
            response.status,
            details,
          );
        }

        throw new PlagiarismServiceError(
          message as string,
          response.status,
          details,
        );
      }

      let raw: RawPlagiarismResponse;
      try {
        const responseText = await response.text();
        raw = JSON.parse(responseText) as RawPlagiarismResponse;
      } catch (jsonError) {
        throw new PlagiarismServiceError(
          "Received an invalid response from the server. Please try again.",
          response.status,
          { jsonError },
        );
      }

      return mapToReport(raw);
    },
    { tool: "plagiarism", signal }
  );

  setCachedResult("plagiarism", hash, result.data);
  return result.data;
};

export interface DownloadPdfParams {
  analysisId: string;
  token?: string;
  baseUrl?: string;
}

export const downloadPlagiarismPdf = async ({
  analysisId,
  token,
  baseUrl = DEFAULT_API_BASE,
}: DownloadPdfParams): Promise<Blob> => {
  if (!analysisId) {
    throw new PlagiarismServiceError("Analysis ID is required", 400);
  }

  const headers: Record<string, string> = {};

  // Add authorization header only if token is provided
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithRetry(
    `${baseUrl}/plagiarism/analysis/${analysisId}/pdf`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const details = await parseErrorBody(response);
    const message =
      (typeof details === "object" &&
        details !== null &&
        "message" in details &&
        typeof (details as Record<string, unknown>).message === "string" &&
        (details as Record<string, unknown>).message) ||
      `Failed to download PDF: ${response.status}`;

    throw new PlagiarismServiceError(
      message as string,
      response.status,
      details,
    );
  }

  return await response.blob();
};

export const analyzePlagiarismFile = async ({
  file,
  token,
  signal,
  baseUrl = DEFAULT_API_BASE,
  options,
}: AnalyzePlagiarismFileParams): Promise<PlagiarismReport> => {
  if (!file) {
    throw new PlagiarismServiceError("File is required", 400);
  }

  if (!baseUrl) {
    throw new PlagiarismServiceError(
      "API URL is not configured. Please check your environment settings.",
      0,
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  if (options) {
    formData.append("options", JSON.stringify(options));
  }

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const SCAN_TIMEOUT_MS = 5 * 60 * 1000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), SCAN_TIMEOUT_MS);

  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${ANALYZE_FILE_ENDPOINT}`, {
      method: "POST",
      headers,
      body: formData,
      signal: combinedSignal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      if (signal?.aborted) {
        throw fetchError;
      }
      throw new PlagiarismServiceError(
        "The file scan took too long and was cancelled. Try with a smaller file or try again later.",
        408,
      );
    }
    throw new PlagiarismServiceError(
      "Could not connect to the plagiarism server. Please check your connection and try again.",
      0,
      fetchError,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const details = await parseErrorBody(response);
    const message =
      (typeof details === "object" &&
        details !== null &&
        "message" in details &&
        typeof (details as Record<string, unknown>).message === "string" &&
        (details as Record<string, unknown>).message) ||
      `Request failed with status ${response.status}`;

    if (response.status === 401) {
      throw new UnauthorizedError(message as string, details);
    }

    if (response.status === 402) {
      // Payment required - insufficient credits
      throw new QuotaExceededError(
        (message as string) ||
          "Insufficient credits. Please upgrade your plan.",
        details,
        response.status,
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new QuotaExceededError(message as string, details, response.status);
    }

    if (response.status >= 500) {
      throw new ServerUnavailableError(
        message as string,
        response.status,
        details,
      );
    }

    throw new PlagiarismServiceError(
      message as string,
      response.status,
      details,
    );
  }

  const raw = (await response.json()) as RawPlagiarismResponse;
  return mapToReport(raw);
};
