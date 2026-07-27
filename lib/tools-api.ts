import { executeWithGateway } from "@/lib/ai-gateway";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export class UsageLimitError extends Error {
  code = "USAGE_LIMIT_EXCEEDED" as const;
  tier: string;
  used: number;
  limit: number;
  upgradeUrl: string;

  constructor(data: { tier: string; used: number; limit: number; upgradeUrl: string }) {
    super("Usage limit reached. Please upgrade your plan.");
    this.name = "UsageLimitError";
    this.tier = data.tier;
    this.used = data.used;
    this.limit = data.limit;
    this.upgradeUrl = data.upgradeUrl;
  }
}

async function safeFetch<T = unknown>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as Record<string, unknown>;
    if (response.status === 429 && err.code === "USAGE_LIMIT_EXCEEDED") {
      throw new UsageLimitError({
        tier: (err.tier as string) || "free",
        used: (err.used as number) || 0,
        limit: (err.limit as number) || 0,
        upgradeUrl: (err.upgradeUrl as string) || "/account/billing",
      });
    }
    throw new Error((err.error as string) || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const grammarCheck = async (text: string, language: string = "en") => {
  const result = await executeWithGateway(
    async () => {
      return safeFetch(`${API_BASE}/api/tools/grammar/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
    },
    { tool: "grammar" }
  );
  return result.data;
};

export const paraphraseText = async ({
  text,
  mode = "standard",
  strength = "medium",
  language = "en",
}: {
  text: string;
  mode?: string;
  strength?: string;
  language?: string;
}) => {
  return safeFetch(`${API_BASE}/api/tools/paraphrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, strength, language }),
  });
};

export const detectAI = async (text: string) => {
  return safeFetch(`${API_BASE}/api/tools/ai-detector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
};

export const detectAIFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return safeFetch(`${API_BASE}/api/tools/ai-detector/file`, {
    method: "POST",
    body: formData,
  });
};

export const translateText = async ({
  text,
  sourceLang,
  targetLang,
}: {
  text: string;
  sourceLang: string;
  targetLang: string;
}) => {
  return safeFetch(`${API_BASE}/api/tools/translator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
};

export const humanizeText = async ({
  text,
  mode = "standard",
  intensity = "medium",
}: {
  text: string;
  mode?: string;
  intensity?: string;
}) => {
  return safeFetch(`${API_BASE}/api/tools/humanize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, intensity }),
  });
};

export const summarizeText = async ({
  text,
  type = "key-points",
  length = "medium",
}: {
  text: string;
  type?: string;
  length?: string;
}) => {
  return safeFetch(`${API_BASE}/api/tools/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, type, length }),
  });
};
