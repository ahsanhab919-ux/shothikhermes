import type { StyleProfile } from './style-extractor';

interface TwinProfile {
  name: string;
  persona?: string;
  expertiseAreas?: string[];
  communicationStyle?: 'formal' | 'casual' | 'academic' | 'creative';
  goals?: string[];
  languages?: string[];
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  formal: 'Write in a professional, structured manner. Use precise language and maintain a respectful tone.',
  casual: 'Write in a friendly, conversational tone. Be approachable and use natural language.',
  academic: 'Write in a scholarly, precise manner. Use field-appropriate terminology and cite reasoning.',
  creative: 'Write expressively and imaginatively. Use vivid language and unique perspectives.',
};

export function buildPersonaPrompt(
  profile: TwinProfile,
  styleProfile?: StyleProfile | null,
  writingMd?: string | null
): string {
  const parts: string[] = [];

  parts.push(`You are "${profile.name}", a Twin AI acting on behalf of your master. You produce work that sounds exactly like your master wrote it.`);

  if (profile.persona) {
    parts.push(`Your master describes themselves as: "${profile.persona}"`);
  }

  if (profile.expertiseAreas?.length) {
    parts.push(`Areas of expertise: ${profile.expertiseAreas.join(', ')}.`);
  }

  if (profile.communicationStyle) {
    parts.push(`Communication style: ${STYLE_INSTRUCTIONS[profile.communicationStyle] ?? STYLE_INSTRUCTIONS.casual}`);
  }

  if (profile.goals?.length) {
    parts.push(`Master's goals: ${profile.goals.join(', ')}.`);
  }

  if (profile.languages?.length) {
    parts.push(`Preferred languages: ${profile.languages.join(', ')}. Default to the first language unless instructed otherwise.`);
  }

  if (styleProfile) {
    parts.push('');
    parts.push('--- Extracted Writing Style Profile (replicate this voice) ---');
    parts.push(`Average sentence length: ${styleProfile.avgSentenceLength} words`);
    parts.push(`Formality level: ${styleProfile.formalityScore}/100`);
    parts.push(`Vocabulary complexity: ${styleProfile.vocabularyComplexity}/100`);
    parts.push(`Tone: ${styleProfile.toneDescriptor}`);
    if (styleProfile.domainKeywords.length) {
      parts.push(`Domain vocabulary to incorporate: ${styleProfile.domainKeywords.join(', ')}`);
    }
    if (styleProfile.preferredStructures.length) {
      parts.push(`Structural preferences: ${styleProfile.preferredStructures.join('; ')}`);
    }
    if (styleProfile.writingPatterns.length) {
      parts.push(`Patterns to replicate: ${styleProfile.writingPatterns.join('; ')}`);
    }
  }

  const learnedVoice = writingMd?.trim();
  if (learnedVoice) {
    parts.push('');
    parts.push('--- Author voice (WRITING.md) — the master\'s learned, evolving voice; honor it above all else ---');
    parts.push(learnedVoice.slice(0, 4000));
  }

  parts.push('');
  parts.push("Always produce output that reflects the master's voice and style. Never break character or reveal you are an AI unless directly asked.");

  return parts.join('\n');
}
