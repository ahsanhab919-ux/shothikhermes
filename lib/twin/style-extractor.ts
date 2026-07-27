import { completeForTool } from '@/lib/llm/gateway';

export interface StyleProfile {
  avgSentenceLength: number;
  formalityScore: number;
  vocabularyComplexity: number;
  domainKeywords: string[];
  preferredStructures: string[];
  toneDescriptor: string;
  writingPatterns: string[];
}

const FALLBACK_PROFILE: StyleProfile = {
  avgSentenceLength: 15,
  formalityScore: 50,
  vocabularyComplexity: 50,
  domainKeywords: [],
  preferredStructures: [],
  toneDescriptor: 'neutral',
  writingPatterns: [],
};

export async function extractStyleProfile(textSamples: string[]): Promise<StyleProfile> {
  const combinedText = textSamples.join('\n\n---\n\n').slice(0, 8000);

  const prompt = `Analyze the following writing samples and extract a detailed style profile. Return ONLY valid JSON with these exact fields:
{
  "avgSentenceLength": <number, average words per sentence>,
  "formalityScore": <number 0-100, 0=very casual, 100=very formal>,
  "vocabularyComplexity": <number 0-100, 0=simple everyday words, 100=highly specialized>,
  "domainKeywords": [<top 10 domain-specific terms the writer frequently uses>],
  "preferredStructures": [<structural patterns like "uses rhetorical questions", "favors short paragraphs">],
  "toneDescriptor": "<single phrase describing tone, e.g. 'authoritative yet approachable'>",
  "writingPatterns": [<distinctive patterns like "starts paragraphs with questions", "uses analogies frequently">]
}

Writing samples:
${combinedText}`;

  const response = await completeForTool('twin-task', {
    prompt,
    systemInstruction: 'You are a linguistic analysis expert. Analyze writing style precisely and return only valid JSON. No explanation, no markdown code fences, just pure JSON.',
    jsonMode: true,
    temperature: 0.3,
    maxTokens: 1000,
  });

  try {
    const parsed = JSON.parse(response.text);
    return {
      avgSentenceLength: Number(parsed.avgSentenceLength) || FALLBACK_PROFILE.avgSentenceLength,
      formalityScore: Number(parsed.formalityScore) || FALLBACK_PROFILE.formalityScore,
      vocabularyComplexity: Number(parsed.vocabularyComplexity) || FALLBACK_PROFILE.vocabularyComplexity,
      domainKeywords: Array.isArray(parsed.domainKeywords) ? parsed.domainKeywords : [],
      preferredStructures: Array.isArray(parsed.preferredStructures) ? parsed.preferredStructures : [],
      toneDescriptor: String(parsed.toneDescriptor || FALLBACK_PROFILE.toneDescriptor),
      writingPatterns: Array.isArray(parsed.writingPatterns) ? parsed.writingPatterns : [],
    };
  } catch {
    return FALLBACK_PROFILE;
  }
}

export function computeKnowledgeScore(
  knowledgeEntries: Array<{ sourceType: string; content: string }>
): number {
  if (knowledgeEntries.length === 0) return 0;

  const uniqueSourceTypes = new Set(knowledgeEntries.map((e) => e.sourceType));
  const totalContentLength = knowledgeEntries.reduce((sum, e) => sum + (e.content?.length ?? 0), 0);

  const entryPoints = Math.min(40, knowledgeEntries.length * 5);
  const diversityPoints = Math.min(20, uniqueSourceTypes.size * 5);
  const volumePoints = Math.min(40, Math.floor(totalContentLength / 500));

  return Math.min(100, entryPoints + diversityPoints + volumePoints);
}
