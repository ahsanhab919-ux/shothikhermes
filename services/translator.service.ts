import { executeWithGateway } from "@/lib/ai-gateway";
import { computeContentHash, getCachedResult, setCachedResult } from "@/lib/result-cache";
import { normalizeError } from "@/lib/tool-errors";

export class TranslatorServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "TranslatorServiceError";
    this.status = status;
    this.details = details;
  }
}

export interface TranslatePayload {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslateResponse {
  success: boolean;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ur", name: "Urdu" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "cs", name: "Czech" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
];

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  ...Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l.name, l.code])),
  Bangla: "bn",
  "Auto Detect": "auto",
};

export const LANGUAGE_NAME_MAP: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.name])
);

export const translateText = async (
  payload: TranslatePayload,
  signal?: AbortSignal
): Promise<TranslateResponse> => {
  try {
    const hash = await computeContentHash(
      payload.text,
      payload.sourceLang,
      payload.targetLang
    );
    const cached = getCachedResult<TranslateResponse>("translator", hash);
    if (cached && !cached.stale) {
      return cached.data;
    }

    const result = await executeWithGateway(
      async (gatewaySignal) => {
        const combinedSignal =
          signal && gatewaySignal
            ? AbortSignal.any([signal, gatewaySignal])
            : signal || gatewaySignal;

        const response = await fetch("/api/tools/translator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const err = new TranslatorServiceError(
            errorData.error || "Failed to translate",
            response.status,
            errorData
          );
          throw err;
        }

        return (await response.json()) as TranslateResponse;
      },
      { tool: "translator", signal }
    );

    setCachedResult("translator", hash, result.data);
    return result.data;
  } catch (error) {
    if (error instanceof TranslatorServiceError) throw error;
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TaskCancelledError" || error.message === "The operation was aborted")
    ) {
      const abortErr = new Error("Request was cancelled");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    throw normalizeError(error, "translator");
  }
};

export const fetchSupportedLanguages = async (
  signal?: AbortSignal
): Promise<SupportedLanguage[]> => {
  try {
    const response = await fetch("/api/tools/translator", {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      throw new TranslatorServiceError("Failed to fetch languages", response.status);
    }

    const data = await response.json();
    return data.languages as SupportedLanguage[];
  } catch (error) {
    if (error instanceof TranslatorServiceError) throw error;
    throw normalizeError(error, "translator");
  }
};
