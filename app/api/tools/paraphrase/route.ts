import { NextRequest, NextResponse } from "next/server";
import { paraphraseRequestSchema } from "@/lib/validation";
import { completeForTool } from "@/lib/llm/gateway";
import { detectDomain, getDomainNote } from "@/lib/llm/domain-detector";
import { refineOutput } from "@/lib/llm/refine";
import { checkOutputQuality, buildRetryNote } from "@/lib/llm/similarity";
import { logger } from "@/lib/logger";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const MAX_OUTPUT_TOKENS = 8000;
const ROUTE_TIMEOUT_MS = 60_000;
const NLP_INFERENCE_URL = process.env.NLP_INFERENCE_URL || "http://localhost:3001";
const LOCAL_MODES = new Set(["standard", "fluency"]);

const modeDescriptions: Record<string, string> = {
  standard: "natural and clear",
  academic: "formal and scholarly",
  casual: "conversational and informal",
  creative: "vivid and expressive",
  fluency: "smooth and fluent",
  formal: "professional and formal",
};

const modeExtraInstructions: Record<string, string> = {
  academic: "Prefer active voice constructions where natural. Use discipline-appropriate hedging language ('suggests', 'indicates', 'may', 'appears to'). Avoid casual contractions.",
  creative: "Use varied sentence openings, vivid vocabulary, and varied clause placement for rhythm.",
  fluency: "Prioritize smooth transitions between sentences and logical flow between ideas.",
  formal: "Use complete sentences, avoid contractions, and maintain a professional register throughout.",
  standard: "",
  casual: "Use informal language naturally; contractions and colloquialisms are appropriate.",
};

const strengthDescriptions: Record<string, string> = {
  light: "Make minimal changes — preserve most of the original phrasing and structure.",
  medium: "Make moderate changes — improve flow, vary sentence structure, and improve word choice.",
  heavy: "Substantially rewrite — restructure sentences by varying subordinate clause placement (not just word substitution), diversify vocabulary significantly, and improve rhythm.",
};

const CITATION_RE = /\[\d+(?:,\s*\d+)*\]|\([A-Z][^)]{1,60}\d{4}[a-z]?\)|\(ibid\.\)/g;

interface CitationPosition {
  marker: string;
  sentenceIndex: number;
}

function extractCitationPositions(text: string): CitationPosition[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const positions: CitationPosition[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const matches = sentences[i].match(CITATION_RE);
    if (matches) {
      for (const m of matches) {
        positions.push({ marker: m, sentenceIndex: i });
      }
    }
  }
  return positions;
}

function reinjectCitationsAtPositions(
  original: string,
  output: string,
): string {
  const origPositions = extractCitationPositions(original);
  if (origPositions.length === 0) return output;

  const outputSentences = output.split(/(?<=[.!?])\s+/);
  const allPresent = origPositions.every((p) => output.includes(p.marker));
  if (allPresent) return output;

  for (const pos of origPositions) {
    if (output.includes(pos.marker)) continue;

    const targetIdx = Math.min(pos.sentenceIndex, outputSentences.length - 1);
    const sentence = outputSentences[targetIdx];
    const punctMatch = sentence.match(/([.!?])\s*$/);
    if (punctMatch) {
      outputSentences[targetIdx] =
        sentence.slice(0, punctMatch.index) + " " + pos.marker + punctMatch[0];
    } else {
      outputSentences[targetIdx] = sentence + " " + pos.marker;
    }
  }

  return outputSentences.join(" ");
}

function buildLanguageNote(language: string): string {
  if (!language || language === "en") return "";
  const langMap: Record<string, string> = {
    bn: "Bengali (বাংলা)",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    ur: "Urdu",
    ar: "Arabic",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
  };
  const langName = langMap[language] || language;
  return `IMPORTANT: The input text is in ${langName}. You MUST produce the output in ${langName} as well. Do NOT translate to English.`;
}

interface StructuredError {
  error: string;
  errorCode: string;
  details?: string;
}

function errorResponse(
  message: string,
  errorCode: string,
  status: number,
  details?: string,
): NextResponse {
  const body: StructuredError = { error: message, errorCode };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

async function callLocalNlp(
  text: string,
  mode: string,
  strength: string,
  language: string,
): Promise<{ paraphrased: string; mock: boolean; processing_time_ms: number } | null> {
  try {
    const res = await fetch(`${NLP_INFERENCE_URL}/api/v1/paraphrase-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode, strength, language }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      logger.warn(`Local NLP service returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      paraphrased: data.paraphrased,
      mock: data.mock ?? false,
      processing_time_ms: data.processing_time_ms ?? 0,
    };
  } catch (err) {
    logger.warn("Local NLP service unreachable", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function POST(req: NextRequest) {
  const routeDeadline = Date.now() + ROUTE_TIMEOUT_MS;

  try {
    const usageCheck = await enforceUsageLimit(req, "paraphrase");
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response;
    }

    if (usageCheck.userId) {
      const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "paraphrase");
      if (!rateCheck.allowed && rateCheck.response) {
        return rateCheck.response;
      }
    }

    const body = await req.json();
    const parsed = paraphraseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request parameters",
        "INVALID_INPUT",
        422,
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
    const { text, mode, strength, language } = parsed.data;

    const useLocal = LOCAL_MODES.has(mode);

    if (useLocal) {
      const localResult = await callLocalNlp(text, mode, strength, language);

      if (localResult && !localResult.mock) {
        const qualityCheck = checkOutputQuality(text, localResult.paraphrased, strength);

        if (usageCheck.userId) {
          await recordToolUsage(usageCheck.userId, "paraphrase");
        }

        return NextResponse.json({
          success: true,
          original: text,
          paraphrased: reinjectCitationsAtPositions(text, localResult.paraphrased),
          alternatives: [],
          mode,
          strength,
          domain: detectDomain(text),
          similarityScore: Math.round(qualityCheck.score * 100),
          qualityWarning: qualityCheck.inRange ? undefined : qualityCheck.warning,
          source: "local-qwen",
        });
      }

      logger.info("Local NLP unavailable/mock, falling through to LLM gateway");
    }

    if (Date.now() > routeDeadline) {
      return errorResponse("Request timed out", "LLM_TIMEOUT", 504);
    }

    const domain = detectDomain(text);
    const domainNote = getDomainNote(domain);
    const modeDesc = modeDescriptions[mode] ?? "natural and clear";
    const modeExtra = modeExtraInstructions[mode] ?? "";
    const strengthDesc = strengthDescriptions[strength] ?? strengthDescriptions.medium;
    const taskDescription = `Rewrite text in a ${modeDesc} style with ${strength} strength changes`;
    const languageNote = buildLanguageNote(language);

    const buildPrompt = (extraNote?: string) =>
      `${extraNote ? extraNote + "\n\n" : ""}${languageNote ? languageNote + "\n\n" : ""}${domainNote}

Rewrite the text below to sound ${modeDesc}. ${strengthDesc}${modeExtra ? " " + modeExtra : ""}

Rules:
- Preserve all proper nouns, names, technical terms, numbers, and dates exactly as written
- CRITICAL: Every citation marker present in the input (e.g. [1], [2], (Smith, 2023), (ibid.)) MUST appear verbatim in the output — never remove, merge, or reword them
- Do not add new facts or information not present in the original
- Do not translate — keep the same language as the input
- Do not change the paragraph order or split/merge paragraphs
- Return only the rewritten text — no preamble, no labels, no explanation

Text:
${text}`;

    const maxTok = Math.min(MAX_OUTPUT_TOKENS, Math.max(600, Math.ceil(text.length * 1.2)));

    let llmResult;
    try {
      const remainingMs = Math.max(1000, routeDeadline - Date.now());
      llmResult = await Promise.race([
        completeForTool("paraphrase", {
          prompt: buildPrompt(),
          temperature: 0.7,
          maxTokens: maxTok,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Route budget exhausted")), remainingMs)
        ),
      ]);
    } catch (llmError) {
      const isTimeout = llmError instanceof Error && (
        llmError.message.includes("timed out") || llmError.message.includes("budget exhausted")
      );

      if (isTimeout) {
        const fallbackLocal = await callLocalNlp(text, "standard", strength, language);
        if (fallbackLocal && !fallbackLocal.mock) {
          const qualityCheck = checkOutputQuality(text, fallbackLocal.paraphrased, strength);
          if (usageCheck.userId) {
            await recordToolUsage(usageCheck.userId, "paraphrase");
          }
          return NextResponse.json({
            success: true,
            original: text,
            paraphrased: reinjectCitationsAtPositions(text, fallbackLocal.paraphrased),
            alternatives: [],
            mode,
            requestedMode: mode,
            effectiveMode: "standard",
            strength,
            domain: detectDomain(text),
            similarityScore: Math.round(qualityCheck.score * 100),
            qualityWarning: `Requested "${mode}" mode timed out; fell back to standard mode.`,
            source: "local-qwen-fallback",
          });
        }
        return errorResponse("Paraphrase timed out", "LLM_TIMEOUT", 504);
      }

      if (useLocal) {
        return errorResponse(
          "Paraphrase service temporarily unavailable",
          "ALL_PROVIDERS_FAILED",
          503,
          "Both local and cloud paraphrase engines failed",
        );
      }

      const fallbackLocal = await callLocalNlp(text, "standard", strength, language);
      if (fallbackLocal && !fallbackLocal.mock) {
        logger.info("LLM failed, used local fallback for non-local mode");
        const qualityCheck = checkOutputQuality(text, fallbackLocal.paraphrased, strength);

        if (usageCheck.userId) {
          await recordToolUsage(usageCheck.userId, "paraphrase");
        }

        return NextResponse.json({
          success: true,
          original: text,
          paraphrased: reinjectCitationsAtPositions(text, fallbackLocal.paraphrased),
          alternatives: [],
          mode,
          requestedMode: mode,
          effectiveMode: "standard",
          strength,
          domain: detectDomain(text),
          similarityScore: Math.round(qualityCheck.score * 100),
          qualityWarning: `Requested "${mode}" mode unavailable; fell back to standard mode.`,
          source: "local-qwen-fallback",
        });
      }

      return errorResponse(
        "Paraphrase service temporarily unavailable",
        "ALL_PROVIDERS_FAILED",
        503,
      );
    }

    let paraphrased = llmResult.text.trim();
    let qualityCheck = checkOutputQuality(text, paraphrased, strength);

    if (!qualityCheck.inRange && text.length >= 50 && Date.now() < routeDeadline - 5000) {
      const retryNote = buildRetryNote(qualityCheck.direction, strength);
      try {
        const retryRemainingMs = Math.max(1000, routeDeadline - Date.now() - 2000);
        const retryResult = await Promise.race([
          completeForTool("paraphrase", {
            prompt: buildPrompt(retryNote),
            temperature: 0.75,
            maxTokens: maxTok,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Retry budget exhausted")), retryRemainingMs)
          ),
        ]);
        const retryOutput = retryResult.text.trim();
        const retryCheck = checkOutputQuality(text, retryOutput, strength);

        if (retryCheck.inRange || Math.abs(retryCheck.score - 0.5) < Math.abs(qualityCheck.score - 0.5)) {
          paraphrased = retryOutput;
          qualityCheck = retryCheck;
        }
      } catch {
        logger.warn("Quality retry failed or timed out, using first attempt");
      }
    }

    if (!qualityCheck.inRange && strength !== "light" && text.length >= 100 && Date.now() < routeDeadline - 5000) {
      try {
        const refineRemainingMs = Math.max(1000, routeDeadline - Date.now() - 2000);
        const refineResult = await Promise.race([
          refineOutput({
            original: text,
            draft: paraphrased,
            taskDescription,
            tool: "paraphrase",
            temperature: 0.3,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Refine budget exhausted")), refineRemainingMs)
          ),
        ]);
        paraphrased = refineResult;
        qualityCheck = checkOutputQuality(text, paraphrased, strength);
      } catch {
        logger.warn("Refine step failed or timed out, using current result");
      }
    }

    paraphrased = reinjectCitationsAtPositions(text, paraphrased);

    if (usageCheck.userId) {
      await recordToolUsage(usageCheck.userId, "paraphrase");
    }

    return NextResponse.json({
      success: true,
      original: text,
      paraphrased,
      alternatives: [],
      mode,
      strength,
      domain,
      similarityScore: Math.round(qualityCheck.score * 100),
      qualityWarning: qualityCheck.inRange ? undefined : qualityCheck.warning,
      source: llmResult.provider,
    });

  } catch (error) {
    logger.error("Paraphrase error", { error: error instanceof Error ? error.message : String(error) });
    return errorResponse(
      "An unexpected error occurred while paraphrasing",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function GET() {
  return NextResponse.json({
    modes: Object.keys(modeDescriptions),
    strengths: Object.keys(strengthDescriptions),
    message: "POST to this endpoint with {text, mode, strength} to paraphrase",
  });
}
