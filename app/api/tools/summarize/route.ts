import { NextRequest, NextResponse } from "next/server";
import { completeForTool } from "@/lib/llm/gateway";
import { summarizeSchema } from "@/lib/validation";
import { detectDomain, getDomainNote } from "@/lib/llm/domain-detector";
import { logger } from "@/lib/logger";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const CITATION_RE = /\[\d+(?:,\s*\d+)*\]|\([A-Z][^)]{1,60}\d{4}[a-z]?\)|\(ibid\.\)/g;

function reinjectMissingCitations(original: string, output: string): string {
  const markers = original.match(CITATION_RE) ?? [];
  if (markers.length === 0) return output;
  const missing = markers.filter((m) => !output.includes(m));
  if (missing.length === 0) return output;
  return output.trimEnd() + " " + missing.join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const usageCheck = await enforceUsageLimit(req, "summarize");
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response;
    }

    if (usageCheck.userId) {
      const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "summarize");
      if (!rateCheck.allowed && rateCheck.response) {
        return rateCheck.response;
      }
    }

    const body = await req.json();
    const parsed = summarizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const { text, type, length } = parsed.data;

    const lengthTargets: Record<string, string> = {
      short: "2–3 sentences or 2–3 bullet points (roughly 10–15% of original length)",
      medium: "4–6 sentences or 5–7 bullet points (roughly 25–30% of original length)",
      long: "3–4 paragraphs or 8–10 bullet points (roughly 40–50% of original length)",
    };

    const typePrompts: Record<string, string> = {
      "key-points": `Extract the most important key points as a markdown bullet list (use "- " prefix). Structure each point as: key claim → supporting evidence → implication where applicable. Focus on central arguments, key findings, and main conclusions. Target length: ${lengthTargets[length]}.`,
      paragraph: `Write a concise prose summary that captures the main ideas in flowing sentences. Follow this structure: open with the key claim, support with evidence, close with implications or conclusions. Target length: ${lengthTargets[length]}.`,
      bullets: `Summarize as a clear markdown bullet list (use "- " prefix) with one idea per bullet. Order by importance. Target length: ${lengthTargets[length]}.`,
      tldr: `Write a TL;DR — short, direct, and scannable. Start with the single most important takeaway. Then add 1–2 supporting points. Target length: ${lengthTargets[length]}.`,
      abstract: `Write a structured academic abstract suitable for a STEM research paper. Follow this order: (1) Background/motivation — one sentence on the problem context, (2) Objective — what this work investigates, (3) Methods — key techniques, datasets, or experimental setup, (4) Results — principal quantitative findings with metrics, (5) Conclusion — significance and implications. Use formal academic register. Preserve all citation markers, statistical values, and technical terminology exactly. Target length: ${lengthTargets[length]}.`,
    };

    const domain = detectDomain(text);
    const domainNote = getDomainNote(domain);

    const prompt = `${domainNote}

Task: ${typePrompts[type] ?? typePrompts["key-points"]}

Rules:
- Only include information present in the original text — do not add external facts or interpretations
- CRITICAL: Every citation marker present in the source (e.g. [1], [2], (Smith, 2023), et al.) MUST appear verbatim in the summary — never drop, truncate, or reword them
- Preserve all methodology terms, measurements, and statistical language (e.g. p-values, confidence intervals, sample sizes)
- Preserve proper nouns, author names, institution names, and technical terminology exactly
- Do not add phrases like "In conclusion" or "In summary" as openers — start directly with the content
- Return only the summary itself — no preamble, no labels, no explanation

Text to summarize:
${text}`;

    const summaryTokens = Math.min(4000, Math.max(600, Math.ceil(text.length * 0.5)));
    const llmResult = await completeForTool("summarize", {
      prompt,
      temperature: 0.3,
      maxTokens: summaryTokens,
    });

    const summary = reinjectMissingCitations(text, llmResult.text.trim());

    if (usageCheck.userId) {
      await recordToolUsage(usageCheck.userId, "summarize");
    }

    return NextResponse.json({
      success: true,
      summary,
      type,
      length,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round((summary.length / text.length) * 100),
    });
  } catch (error) {
    logger.error("[summarize] Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
