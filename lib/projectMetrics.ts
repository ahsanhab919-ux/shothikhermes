export type ReadinessCriteria = {
  wordCount: number;
  genreTarget: number;
  grammarPassing: boolean;
  hasCitations: boolean;
  hasCoverArt: boolean;
  hasMetadata: boolean;
  hasPricing: boolean;
  projectType: 'book' | 'research' | 'assignment';
};

export type ReadinessCriterionResult = {
  id: string;
  label: string;
  weight: number;
  met: boolean;
  score: number;
  hint: string;
};

export type ReadinessResult = {
  score: number;
  criteria: ReadinessCriterionResult[];
};

export function computeReadinessScore(criteria: ReadinessCriteria): ReadinessResult {
  const wordRatio = Math.min(1, criteria.wordCount / Math.max(1, criteria.genreTarget));
  const wordMet = wordRatio >= 0.9;
  const needsCitations =
    criteria.projectType === 'research' || criteria.projectType === 'assignment';

  const items: ReadinessCriterionResult[] = [
    {
      id: 'wordcount',
      label: 'Word count',
      weight: 25,
      met: wordMet,
      score: Math.round(wordRatio * 25),
      hint: wordMet
        ? `${criteria.wordCount.toLocaleString()} words — target met`
        : `${criteria.wordCount.toLocaleString()} / ${criteria.genreTarget.toLocaleString()} words needed`,
    },
    {
      id: 'grammar',
      label: 'Grammar check passed',
      weight: 20,
      met: criteria.grammarPassing,
      score: criteria.grammarPassing ? 20 : 0,
      hint: criteria.grammarPassing
        ? 'No critical grammar issues detected'
        : 'Run grammar analysis in Write mode (Neuro tab)',
    },
    {
      id: 'citations',
      label: needsCitations ? 'Citations present' : 'Citations (n/a for books)',
      weight: 15,
      met: criteria.hasCitations || !needsCitations,
      score: needsCitations ? (criteria.hasCitations ? 15 : 0) : 15,
      hint: needsCitations
        ? criteria.hasCitations
          ? 'Citation markers detected in document'
          : 'Add [Author, Year] citation markers where you cite sources'
        : 'Not required for books',
    },
    {
      id: 'cover',
      label: 'Cover art uploaded',
      weight: 15,
      met: criteria.hasCoverArt,
      score: criteria.hasCoverArt ? 15 : 0,
      hint: criteria.hasCoverArt
        ? 'Cover image is set'
        : 'Upload a cover image in Format → Cover Art',
    },
    {
      id: 'metadata',
      label: 'Metadata complete',
      weight: 15,
      met: criteria.hasMetadata,
      score: criteria.hasMetadata ? 15 : 0,
      hint: criteria.hasMetadata
        ? 'Title, description and category are set'
        : 'Complete book details in Publish → Book Details',
    },
    {
      id: 'pricing',
      label: 'Pricing configured',
      weight: 10,
      met: criteria.hasPricing,
      score: criteria.hasPricing ? 10 : 0,
      hint: criteria.hasPricing
        ? 'Price is configured'
        : 'Set a retail price in Publish → Pricing',
    },
  ];

  return {
    score: Math.min(100, items.reduce((s, i) => s + i.score, 0)),
    criteria: items,
  };
}

export const GENRE_TARGETS: Record<string, number> = {
  book: 80000,
  novel: 80000,
  novella: 30000,
  research: 8000,
  assignment: 3000,
};
