export type ContentDomain = 'academic' | 'technical' | 'creative' | 'business' | 'casual';

const ACADEMIC_PATTERNS = [
  /\\\[[\s\S]*?\\\]/,
  /\$\$[\s\S]*?\$\$/,
  /\$[^$\n]+\$/,
  /\\begin\{/,
  /\\frac\{/,
  /\\sum_/,
  /\\int_/,
  /\\alpha|\\beta|\\gamma|\\delta|\\theta|\\lambda|\\mu|\\sigma|\\omega/,
  /et al\./i,
  /\[\d+\]/,
  /ibid\./i,
  /\(p\.\s*\d+\)/i,
  /doi:\s*10\./i,
];

const ACADEMIC_KEYWORDS = [
  'hypothesis', 'methodology', 'findings', 'abstract', 'conclusion',
  'literature review', 'statistical', 'correlation', 'coefficient',
  'significance', 'p-value', 'regression', 'analysis', 'empirical',
  'theoretical framework', 'paradigm', 'dissertation', 'peer-reviewed',
];

const TECHNICAL_PATTERNS = [
  /```[\s\S]*?```/,
  /^( {4}|\t)\S/m,
  /\b(function|const|let|var|def|class|import|export|async|await|return)\b/,
  /\b(API|JSON|HTTP|REST|SQL|HTML|CSS|XML|YAML|TOML)\b/,
  /->\s*\w+|=>\s*\{/,
  /\w+\(\w*\)\s*\{/,
  /<\/?[a-z][a-z0-9]*(\s|\/?>)/i,
];

const TECHNICAL_KEYWORDS = [
  'algorithm', 'database', 'server', 'client', 'endpoint', 'authentication',
  'middleware', 'deployment', 'repository', 'compile', 'runtime',
  'interface', 'implementation', 'framework', 'library', 'package', 'module',
];

const BUSINESS_KEYWORDS = [
  'stakeholder', 'deliverable', 'synergy', 'kpi', 'roi', 'revenue', 'budget',
  'milestone', 'roadmap', 'strategy', 'objective', 'quarterly', 'fiscal',
  'onboarding', 'scalable', 'bandwidth', 'leverage', 'action item', 'takeaway',
  'q1', 'q2', 'q3', 'q4', 'yoy', 'b2b', 'b2c', 'saas', 'mrr', 'arr',
];

const CREATIVE_PATTERNS = [
  /"[^"]+"\s+(?:said|whispered|shouted|asked|replied|muttered|cried|laughed)/i,
  /\b(?:she|he|they|I)\s+(?:whispered|smiled|frowned|sighed|gasped|wept)/i,
  /\b(?:once upon a time|the next morning|as the sun rose|in the darkness)\b/i,
];

const CASUAL_PATTERNS = [
  /\b(don't|can't|won't|it's|I'm|you're|they're|we're|isn't|aren't|wasn't)\b/i,
  /\b(lol|omg|tbh|btw|fyi|imo|ikr|ngl|rn|gonna|wanna|gotta)\b/i,
  /!{2,}/,
  /\?{2,}/,
  /\.{3,}/,
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function countKeywords(lowerText: string, keywords: string[]): number {
  return keywords.reduce((count, kw) => count + (lowerText.includes(kw) ? 1 : 0), 0);
}

export function detectDomain(text: string): ContentDomain {
  const lower = text.toLowerCase();

  const academicScore =
    countMatches(text, ACADEMIC_PATTERNS) * 3 +
    countKeywords(lower, ACADEMIC_KEYWORDS);

  const technicalScore =
    countMatches(text, TECHNICAL_PATTERNS) * 3 +
    countKeywords(lower, TECHNICAL_KEYWORDS);

  const businessScore = countKeywords(lower, BUSINESS_KEYWORDS) * 2;

  const creativeScore = countMatches(text, CREATIVE_PATTERNS) * 3;

  const casualScore = countMatches(text, CASUAL_PATTERNS) * 2;

  const scores: Record<ContentDomain, number> = {
    academic: academicScore,
    technical: technicalScore,
    business: businessScore,
    creative: creativeScore,
    casual: casualScore,
  };

  const top = (Object.entries(scores) as [ContentDomain, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return top[1] >= 2 ? top[0] : 'casual';
}

export function getDomainNote(domain: ContentDomain): string {
  const notes: Record<ContentDomain, string> = {
    academic:
      'Note: This is academic or scholarly text. Preserve all citations, LaTeX equations, mathematical notation, and technical terminology exactly as written. Do not simplify or rephrase specialised terms.',
    technical:
      'Note: This is technical content (code, documentation, or engineering text). Preserve all code snippets, variable names, function names, technical acronyms, and syntax exactly. Do not paraphrase technical terms.',
    creative:
      'Note: This is creative writing (fiction, narrative, or literary text). Preserve the author\'s voice, stylistic choices, intentional fragments, and narrative perspective. Do not normalise deliberately unusual phrasing.',
    business:
      'Note: This is professional business writing. Use clear, concise, and direct language. Maintain a professional register. Preserve all proper nouns, brand names, and business metrics exactly.',
    casual:
      'Note: This is informal or conversational writing. Maintain the casual register and natural voice. Contractions and colloquial expressions are appropriate.',
  };
  return notes[domain];
}
