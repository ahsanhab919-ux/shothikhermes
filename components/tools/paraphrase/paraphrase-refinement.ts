import type { WritingStudioSeedIntent } from "@/lib/writing-studio-seed";

export interface ParaphraseQualityAssessment {
  score: number;
  summary: string;
  warnings: string[];
  label: "High confidence" | "Needs review" | "Low confidence";
}

export interface ParaphraseVariationPreset {
  id: string;
  title: string;
  description: string;
  mode: string;
  synonymLabel: string;
  intent: WritingStudioSeedIntent;
}

export const PARAPHRASE_VARIATION_PRESETS: ParaphraseVariationPreset[] = [
  {
    id: "balanced",
    title: "Balanced",
    description: "Keeps the original meaning while improving clarity and flow.",
    mode: "Standard",
    synonymLabel: "Intermediate",
    intent: "book",
  },
  {
    id: "expressive",
    title: "Expressive",
    description: "Uses stronger variation for more natural and less repetitive phrasing.",
    mode: "Humanize",
    synonymLabel: "Advanced",
    intent: "book",
  },
  {
    id: "academic",
    title: "Academic",
    description: "Produces a more formal, source-friendly tone for research or assignment writing.",
    mode: "Formal",
    synonymLabel: "Basic",
    intent: "research",
  },
];

function normalizeText(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function assessParaphraseQuality(
  inputText: string,
  outputText: string,
): ParaphraseQualityAssessment {
  const input = normalizeText(inputText);
  const output = normalizeText(outputText);

  if (!output) {
    return {
      score: 0,
      summary: "No output to review yet.",
      warnings: [],
      label: "Low confidence",
    };
  }

  const warnings: string[] = [];
  let score = 100;

  if (input && output === input) {
    warnings.push("Output is almost identical to the original text.");
    score -= 50;
  }

  if (output.split(" ").length < Math.max(5, Math.floor(input.split(" ").length * 0.55))) {
    warnings.push("Output is much shorter than the original and may have dropped details.");
    score -= 20;
  }

  const sentences = outputText
    .split(/(?<=[.!?।])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const uniqueSentences = new Set(sentences.map((sentence) => normalizeText(sentence)));
  if (sentences.length > 1 && uniqueSentences.size < sentences.length) {
    warnings.push("Repeated sentence patterns may reduce variation quality.");
    score -= 15;
  }

  if (warnings.length === 0) {
    return {
      score: 96,
      summary: "The paraphrased result looks distinct, complete, and ready to reuse.",
      warnings,
      label: "High confidence",
    };
  }

  if (score >= 70) {
    return {
      score,
      summary: "The result is usable, but you may want to review a few sentences before reusing it.",
      warnings,
      label: "Needs review",
    };
  }

  return {
    score,
    summary: "The output may need another pass with a different variation preset or shorter input.",
    warnings,
    label: "Low confidence",
  };
}

export function findMatchingParaphrasePreset(mode: string, synonymLabel: string) {
  return (
    PARAPHRASE_VARIATION_PRESETS.find(
      (preset) => preset.mode === mode && preset.synonymLabel === synonymLabel,
    ) || null
  );
}
