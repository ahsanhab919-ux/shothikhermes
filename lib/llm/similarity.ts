export interface SimilarityBounds {
  min: number;
  max: number;
}

const STRENGTH_BOUNDS: Record<string, SimilarityBounds> = {
  light:  { min: 0.55, max: 0.90 },
  medium: { min: 0.30, max: 0.65 },
  heavy:  { min: 0.05, max: 0.40 },
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function trigramSet(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const trigrams = new Set<string>();
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

function jaccardIndex(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return intersection / union;
}

export function wordSimilarity(a: string, b: string): number {
  const wordScore = jaccardIndex(tokenize(a), tokenize(b));
  const trigramScore = jaccardIndex(trigramSet(a), trigramSet(b));
  return wordScore * 0.6 + trigramScore * 0.4;
}

export function getBoundsForStrength(strength: string): SimilarityBounds {
  return STRENGTH_BOUNDS[strength] ?? STRENGTH_BOUNDS.medium;
}

export interface QualityCheckResult {
  score: number;
  inRange: boolean;
  direction: 'too-similar' | 'too-different' | 'ok';
  warning?: string;
}

export function checkOutputQuality(
  original: string,
  output: string,
  strength: string
): QualityCheckResult {
  const score = wordSimilarity(original, output);
  const bounds = getBoundsForStrength(strength);

  if (score > bounds.max) {
    return {
      score,
      inRange: false,
      direction: 'too-similar',
      warning: `Output is too similar to the original (${Math.round(score * 100)}% overlap). A ${strength} rewrite should change more.`,
    };
  }

  if (score < bounds.min) {
    return {
      score,
      inRange: false,
      direction: 'too-different',
      warning: `Output diverged too much from the original (${Math.round(score * 100)}% overlap). Key content may have been lost.`,
    };
  }

  return { score, inRange: true, direction: 'ok' };
}

export function buildRetryNote(direction: 'too-similar' | 'too-different' | 'ok', strength: string): string {
  if (direction === 'ok') return '';
  if (direction === 'too-similar') {
    return `Important: The previous rewrite was too similar to the original. For a "${strength}" rewrite, you must make substantially more changes — vary sentence structure more, choose different vocabulary, and rephrase ideas differently while still preserving the core meaning and all factual content.`;
  }
  return `Important: The previous rewrite changed too much and may have lost key content. For a "${strength}" rewrite, stay closer to the original's core ideas and factual content. Use more words from the original while still improving the style.`;
}
