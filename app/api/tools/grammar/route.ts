import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { grammarCheckSchema } from "@/lib/validation";
import { completeForTool } from "@/lib/llm/gateway";
import { detectDomain, getDomainNote } from "@/lib/llm/domain-detector";
import { logger } from "@/lib/logger";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";
import { defineRoute, z } from "@/lib/api-validation";

interface LLMIssue {
  text: string;
  correction: string;
  type: string;
  explanation: string;
}

interface LLMResult {
  issues: LLMIssue[];
  correctedText: string;
}

export const POST = defineRoute({
  method: "post",
  path: "/api/tools/grammar",
  summary: "Grammar Checker Tool",
  description: "Analyzes text for grammar, spelling, punctuation, and style errors using LLMs.",
  tags: ["Writing Tools"],
  config: {
    // Relying on internal tool rate limiter logic instead of edge rate limit for now
    requireAuth: false, 
  },
  schemas: {
    // We use the existing grammarCheckSchema from your validation lib,
    // but we have to wrap it if it's not a direct ZodObject. Assuming it is:
    body: grammarCheckSchema as any,
    response: z.object({
      success: z.boolean(),
      text: z.string(),
      correctedText: z.string(),
      issues: z.array(z.any()),
      corrections: z.array(z.any()),
      cost: z.number(),
      remainingCredits: z.number(),
    }),
  },
  handler: async ({ req, body }) => {
    // 1. Existing Usage & Rate Limit checks (these rely on req)
    const usageCheck = await enforceUsageLimit(req, "grammar");
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response;
    }

    if (usageCheck.userId) {
      const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "grammar");
      if (!rateCheck.allowed && rateCheck.response) {
        return rateCheck.response;
      }
    }

    const { text, language } = body as any;

    const langNote = language && language !== "en" ? ` The text is written in ${language}.` : "";
    const domain = detectDomain(text);
    const domainNote = getDomainNote(domain);

    const prompt = `${domainNote}${langNote ? " " + langNote : ""}

You are a precise grammar and style editor. Carefully check the following text for grammar, spelling, punctuation, and style errors.

Do NOT flag or alter:
- LaTeX equations (anything inside $...$ or \\begin{...}...\\end{...})
- Code blocks or inline code
- Chemical formulas (e.g. H2O, NaCl, CO2)
- Gene names, protein names, species names in Latin (e.g. Homo sapiens)
- Dataset names, model names, software names (e.g. BERT, GPT-4, MATLAB)
- Proper nouns, institution names, country names
- Citation markers: [1], [2], (Smith, 2023), (ibid.), et al.
- British spelling variants (e.g. "colour", "analyse", "organisation") — these are correct for non-American English
- Deliberate stylistic choices (e.g. sentence fragments used for emphasis)

Conservatism rule: Only flag genuine, clear errors. When uncertain, do not flag. A false positive is worse than a missed error.

Style note: If a sentence is grammatically correct but unusually complex or convoluted for academic writing, flag it as type "style" with a suggestion to simplify. Only do this for sentences over 40 words.

Return a raw JSON object — no markdown fences, no code blocks, just the JSON:
{
  "issues": [
    {
      "text": "exact problematic phrase copied verbatim from the original",
      "correction": "corrected version of that phrase",
      "type": "grammar",
      "explanation": "Why this is wrong, in plain terms a non-native English speaker can understand (max 20 words)"
    }
  ],
  "correctedText": "The complete corrected version of the entire text"
}

The "type" field must be one of: "grammar", "spelling", "punctuation", "style".
If there are no errors, return: {"issues":[],"correctedText":"${text.slice(0, 50).replace(/"/g, '\\"')}..."}

Text to check:
${text}`;

    const llmResult = await completeForTool("grammar", {
      prompt,
      temperature: 0.1,
      maxTokens: Math.min(8000, Math.max(1000, text.length * 2)),
      jsonMode: true,
    });

    let rawResult: LLMResult = { issues: [], correctedText: text };

    try {
      const raw = llmResult.text.trim();
      const jsonStr = raw.startsWith("{")
        ? raw
        : raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
      rawResult = JSON.parse(jsonStr) as LLMResult;
    } catch (parseErr) {
      logger.warn("Grammar tools/grammar: failed to parse LLM JSON", {
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
      });
    }

    const correctedText = rawResult.correctedText ?? text;

    const issues = (rawResult.issues ?? []).map((issue) => {
      const startIndex = text.indexOf(issue.text);
      const endIndex = startIndex >= 0 ? startIndex + issue.text.length : startIndex;
      const severity =
        issue.type === "grammar" ? "high" : issue.type === "spelling" ? "high" : "medium";

      return {
        id: randomUUID(),
        type: issue.type as "grammar" | "spelling" | "style" | "punctuation",
        message: issue.explanation,
        suggestion: issue.correction,
        startIndex: Math.max(0, startIndex),
        endIndex: Math.max(0, endIndex),
        context: issue.text,
        severity: severity as "low" | "medium" | "high",
      };
    });

    const corrections = (rawResult.issues ?? []).map((i) => ({
      original: i.text,
      corrected: i.correction,
      explanation: i.explanation,
    }));

    if (usageCheck.userId) {
      await recordToolUsage(usageCheck.userId, "grammar");
    }

    return NextResponse.json({
      success: true,
      text,
      issues,
      corrections,
      correctedText,
      cost: 0,
      remainingCredits: 9999,
    });
  }
});
