import { NextRequest, NextResponse } from "next/server";
import { translateSchema } from "@/lib/validation";
import { completeForTool } from "@/lib/llm/gateway";
import { detectDomain, getDomainNote } from "@/lib/llm/domain-detector";
import { logger } from "@/lib/logger";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const SUPPORTED_LANGUAGES = [
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
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "cs", name: "Czech" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
];

const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.name])
);

export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

export async function POST(req: NextRequest) {
  try {
    const usageCheck = await enforceUsageLimit(req, "translator");
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response;
    }

    if (usageCheck.userId) {
      const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "translator");
      if (!rateCheck.allowed && rateCheck.response) {
        return rateCheck.response;
      }
    }

    const body = await req.json();
    const parsed = translateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const { text, sourceLang, targetLang } = parsed.data;

    const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
    const sourceName =
      sourceLang === "auto"
        ? "the source language"
        : (LANGUAGE_NAMES[sourceLang] ?? sourceLang);

    const domain = detectDomain(text);
    const domainNote = getDomainNote(domain);

    const prompt = `${domainNote}

Translate the following text from ${sourceName} to ${targetName}.

Rules:
- Preserve the original formatting exactly: markdown, bullet points, numbered lists, headers, bold/italic, and line breaks
- Preserve the register (formal stays formal, academic stays academic, technical stays technical) — do not simplify or casualize the language
- Translate the MEANING of idioms and cultural expressions — do not translate them word-for-word; adapt to a natural ${targetName} equivalent
- Do NOT Westernize or localize idioms — translate meaning faithfully without imposing cultural framing
- Keep proper nouns, institution names, brand names, and product names in their original form unless they have an established official ${targetName} equivalent
- Preserve technical terms and acronyms (e.g. AI, HTML, API, DNA) as-is unless a well-established ${targetName} term exists
- Preserve citation markers exactly: [1], (Smith, 2023), (ibid.), et al.
- Preserve all numbers, dates, URLs, and email addresses exactly as written
- Preserve LaTeX equations and code blocks without alteration
- Return only the translated text — no preamble, no labels, no explanation

Text:
${text}`;

    const llmResult = await completeForTool("translator", {
      prompt,
      temperature: 0.2,
      maxTokens: Math.min(8000, Math.max(500, text.length * 2)),
    });

    const translated = llmResult.text.trim();

    if (usageCheck.userId) {
      await recordToolUsage(usageCheck.userId, "translator");
    }

    return NextResponse.json({
      success: true,
      original: text,
      translated,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    logger.error("[translator] Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to translate" }, { status: 500 });
  }
}
