import api from "@/lib/api";
import { AxiosError } from "axios";
import { executeWithGateway } from "@/lib/ai-gateway";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { normalizeError } from "@/lib/tool-errors";

export class AIDetectorServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "AIDetectorServiceError";
    this.status = status;
    this.details = details;
  }
}

interface AIDetectorCheckPayload {
  text: string;
  [key: string]: unknown;
}

interface AIDetectorCheckResponse {
  success: boolean;
  data?: {
    score: number;
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

interface HistoryData {
  id: string;
  text: string;
  score: number;
  createdAt: string;
  [key: string]: unknown;
}

const handleError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message || "Request failed";
    const status = error.response?.status || 500;
    throw new AIDetectorServiceError(message, status, error.response?.data);
  }
  throw new AIDetectorServiceError(
    error instanceof Error ? error.message : "An unexpected error occurred"
  );
};

export const aiDetectorCheck = async (
  payload: AIDetectorCheckPayload,
  signal?: AbortSignal
): Promise<AIDetectorCheckResponse> => {
  try {
    const extraKeys = Object.keys(payload).filter(k => k !== 'text').sort();
    const extraPairs = extraKeys.length > 0 ? JSON.stringify(extraKeys.map(k => [k, payload[k]])) : undefined;
    const hash = await computeContentHash(payload.text, extraPairs);
    const cached = getCachedResult<AIDetectorCheckResponse>("ai_detector", hash);
    if (cached && !cached.stale) {
      return cached.data;
    }

    const result = await executeWithGateway(
      async (gatewaySignal) => {
        const response = await api.post("/ai-detector/check", payload, { signal: gatewaySignal });
        return response?.data as AIDetectorCheckResponse;
      },
      { tool: "ai_detector", signal }
    );

    setCachedResult("ai_detector", hash, result.data);
    return result.data;
  } catch (error) {
    throw normalizeError(error, "ai_detector");
  }
};

export const fetchAiDetectorSections = async (
  query: PaginationQuery = {}
): Promise<{ data: SectionData[]; total: number }> => {
  try {
    const queryParams = new URLSearchParams();
    const { page = 1, limit = 10, search = "" } = query;
    queryParams.set("page", page.toString());
    queryParams.set("limit", limit.toString());
    queryParams.set("search", search.trim());

    const response = await api.get(`/api/ai-detector/sections?${queryParams}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchAiDetectorSection = async (id: string): Promise<SectionData> => {
  try {
    const response = await api.get(`/api/ai-detector/section/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const renameAiDetectorSection = async (
  id: string,
  payload: { name: string }
): Promise<SectionData> => {
  try {
    const response = await api.put(`/api/ai-detector/section-rename/${id}`, payload);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteAiDetectorSection = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/api/ai-detector/section-delete/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchAiDetectorHistories = async (
  query: PaginationQuery = {}
): Promise<{ data: HistoryData[]; total: number }> => {
  try {
    const queryParams = new URLSearchParams();
    const { page = 1, limit = 10, search = "" } = query;
    queryParams.set("page", page.toString());
    queryParams.set("limit", limit.toString());
    queryParams.set("search", search.trim());

    const response = await api.get(`/api/ai-detector/histories?${queryParams}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchAiDetectorHistory = async (id: string): Promise<HistoryData> => {
  try {
    const response = await api.get(`/api/ai-detector/history/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchAiDetectorShare = async (id: string): Promise<{ data: HistoryData }> => {
  try {
    const response = await api.get(`/api/ai-detector/share/${id}`);
    return response?.data;
  } catch (error) {
    return handleError(error);
  }
};
