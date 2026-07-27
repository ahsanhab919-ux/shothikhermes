import { NextRequest, NextResponse } from "next/server";
import { humanizerV5Schema } from "@/lib/validation";
import { completeForTool } from "@/lib/llm/gateway";
import { detectDomain, getDomainNote } from "@/lib/llm/domain-detector";
import { refineOutput } from "@/lib/llm/refine";
import { logger } from "@/lib/logger";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const MAX_OUTPUT_TOKENS = 8000;

const MODEL_TO_MODE: Record<string, string> = {
  panda: "standard",
  raven: "creative",
};

function levelToIntensity(level: unknown): "light" | "medium" | "heavy" {
  if (
    level === 1 ||
    level === "1" ||
    level === "standard" ||
    level === "light"
  )
    return "light";
  if (
    level === 3 ||
    level === "3" ||
    level === "aggressive" ||
    level === "heavy"
  )
    return "heavy";
  return "medium";
}

export async function POST(req: NextRequest) {
  try {
    const usageCheck = await enforceUsageLimit(req, "humanize");
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response;
    }

    if (usageCheck.userId) {
      const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "humanize");
      if (!rateCheck.allowed && rateCheck.response) {
        return rateCheck.response;
      }
    }

    const body = await req.json();
    const parsed = humanizerV5Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const { text, model, level, language } = parsed.data;

    const mode = MODEL_TO_MODE[model] ?? "standard";
    const intensity = levelToIntensity(level);

    const modeInstructions: Record<string, string> = {
      standard:
        "Rewrite it to sound natural and human-written — thoughtful and polished. Maintain a formal register if the original is formal; do not simplify academic or technical language.",
      creative:
        "Rewrite it with creative flair — vivid language, varied sentence rhythm, and an engaging, distinctive voice.",
      academic:
        "Rewrite it in a rigorous academic tone with precise vocabulary, complete sentences, and scholarly register. Prefer active voice where natural. Use hedging language where appropriate (e.g. 'suggests', 'indicates', 'it is plausible that').",
      casual:
        "Rewrite it in a casual, conversational tone — friendly, relaxed, first-person where appropriate.",
    };

    const intensityModifiers: Record<string, string> = {
      light:
        "Make only light edits — fix awkward phrasing and word choice while preserving the original structure and most of the wording.",
      medium:
        "Make moderate changes — improve flow, vary sentence structure (including occasionally splitting or merging sentences), and diversify vocabulary while keeping the core message intact.",
      heavy:
        "Substantially rewrite — restructure sentences, vary the opening words of consecutive sentences (not just mid-sentence changes), diversify vocabulary, and adjust rhythm, while preserving all factual content and core meaning.",
    };

    const domain = detectDomain(text);
    const domainNote = getDomainNote(domain);
    const taskDescription = `Rewrite text in a ${mode} style with ${intensity} intensity to sound more human-written`;

    const prompt = `${domainNote}

${modeInstructions[mode] ?? modeInstructions.standard} ${intensityModifiers[intensity]}

Anti-AI-detection rules (critical):
- Vary the OPENING WORDS of each sentence — do not start consecutive sentences with the same word or phrase
- Do NOT use filler phrases like "In conclusion", "It is worth noting", "It is important to mention", "Furthermore, it should be noted" — these are strong AI signals
- Do NOT add transitional meta-commentary that wasn't in the original
- Occasionally vary sentence length: mix short punchy sentences with longer ones
- Use hedging naturally in academic contexts ("may", "suggests", "appears to", "evidence indicates")

Preservation rules:
- Preserve all proper nouns, names, numbers, dates, and technical terms exactly as written
- Preserve citation markers: [1], (Smith, 2023), (ibid.), et al.
- Do not add new facts or information not present in the original
- Return only the rewritten text — no labels, preamble, or explanation

Text:
${text}`;

    const llmResult = await completeForTool("humanize", {
      prompt,
      temperature: 0.7,
      maxTokens: Math.min(MAX_OUTPUT_TOKENS, Math.max(1000, text.length * 2)),
    });

    let humanized = llmResult.text.trim();

    if (text.length >= 100 && (intensity === "medium" || intensity === "heavy")) {
      humanized = await refineOutput({
        original: text,
        draft: humanized,
        taskDescription,
        tool: "humanize",
        temperature: 0.3,
      });
    }

    const aiScore =
      intensity === "heavy" ? 15 : intensity === "medium" ? 28 : 42;

    if (usageCheck.userId) {
      recordToolUsage(usageCheck.userId, "humanize").catch(() => {});
    }

    return NextResponse.json({
      output: [
        {
          text: humanized,
          aiPercentage: aiScore,
          score: 100 - aiScore,
          model: model ?? "panda",
          language: language ?? "en",
        },
      ],
    });
  } catch (err) {
    logger.error("[humanizerV5] Error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to humanize text" },
      { status: 500 }
    );
  }
}
