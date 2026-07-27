import api from "@/lib/api";
import { AxiosError } from "axios";
import { executeWithGateway } from "@/lib/ai-gateway";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { normalizeError } from "@/lib/tool-errors";

export class GrammarServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "GrammarServiceError";
    this.status = status;
    this.details = details;
  }
}

interface GrammarCheckPayload {
  text: string;
  language?: string;
  [key: string]: unknown;
}

interface GrammarCheckResponse {
  success: boolean;
  data?: {
    correctedText: string;
    corrections: Array<{
      original: string;
      suggestion: string;
      type: string;
    }>;
    [key: string]: unknown;
  };
  message?: string;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface SectionData {
  id: string;
  name: string;
  [key: string]: unknown;
}

const handleError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message || "Request failed";
    const status = error.response?.status || 500;
    throw new GrammarServiceError(message, status, error.response?.data);
  }
  throw new GrammarServiceError(
    error instanceof Error ? error.message : "An unexpected error occurred"
  );
};

export const grammarCheck = async (
  payload: GrammarCheckPayload,
  signal?: AbortSignal
): Promise<GrammarCheckResponse> => {
  try {
    const extraKeys = Object.keys(payload).filter(k => k !== 'text' && k !== 'language').sort();
    const extraPairs = extraKeys.length > 0 ? JSON.stringify(extraKeys.map(k => [k, payload[k]])) : undefined;
    const hash = await computeContentHash(payload.text, payload.language, extraPairs);
    const cached = getCachedResult<GrammarCheckResponse>("grammar", hash);
    if (cached && !cached.stale) {
      return cached.data;
    }

    const result = await executeWithGateway(
      async (gatewaySignal) => {
        const response = await api.post("/api/grammar/check", payload, { signal: gatewaySignal });
        return response?.data as GrammarCheckResponse;
      },
      { tool: "grammar", signal }
    );

    setCachedResult("grammar", hash, result.data);
    return result.data;
  } catch (error) {
    throw normalizeError(error, "grammar");
  }
};

export const fetchGrammarSections = async (
  query: PaginationQuery = {}
): Promise<{ data: SectionData[]; total: number }> => {
  try {
    const queryParams = new URLSearchParams();
    const { page = 1, limit = 10, search = "" } = query;
    queryParams.set("page", page.toString());
    queryParams.set("limit", limit.toString());
    queryParams.set("search", search.trim());

    const response = await api.get(`/api/grammar/sections?${queryParams}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchGrammarSection = async (id: string): Promise<SectionData> => {
  try {
    const response = await api.get(`/api/grammar/section/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const renameGrammarSection = async (
  id: string,
  payload: { name: string }
): Promise<SectionData> => {
  try {
    const response = await api.put(`/api/grammar/section-rename/${id}`, payload);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteGrammarSection = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/api/grammar/section-delete/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};
