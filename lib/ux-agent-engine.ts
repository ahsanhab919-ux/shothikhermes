export type UXSeverity = 'error' | 'warning' | 'info';
export type UXIssueType = 'PASSIVE_VOICE' | 'LONG_SENTENCE' | 'JARGON' | 'WEAK_CTA' | 'DENSE_PARAGRAPH';

export interface UXIssue {
  id: string;
  severity: UXSeverity;
  type: UXIssueType;
  label: string;
  excerpt: string;
  description: string;
  fix?: string;
}

export interface UXAnalysisResult {
  readabilityScore: number;
  gradeLevel: string;
  issues: UXIssue[];
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}

const JARGON_LIST = [
  'leverage', 'synergy', 'utilize', 'paradigm', 'scalable', 'disruptive',
  'robust', 'seamless', 'streamline', 'holistic', 'agile', 'proactive',
  'innovative', 'cutting-edge', 'deep dive', 'circle back', 'bandwidth',
  'pivot', 'ecosystem', 'boilerplate', 'ideate', 'learnings', 'actionable',
  'impactful', 'stakeholder', 'deliverable', 'going forward', 'touch base',
  'low-hanging fruit', 'move the needle', 'best-of-breed', 'value-add',
  'unlock', 'empower', 'solution', 'optimize', 'surface',
];

const WEAK_CTA_PHRASES = [
  'click here', 'read more', 'learn more', 'find out more', 'various', 'several things',
];

const PASSIVE_VOICE_PATTERNS = [
  /\bwas\s+\w+ed\b/gi,
  /\bwere\s+\w+ed\b/gi,
  /\bis being\s+\w+ed\b/gi,
  /\bhas been\s+\w+ed\b/gi,
  /\bhad been\s+\w+ed\b/gi,
  /\bwill be\s+\w+ed\b/gi,
];

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

function tokenizeSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

function scoreToGradeLevel(score: number): string {
  if (score >= 90) return 'Grade 5';
  if (score >= 80) return 'Grade 6';
  if (score >= 70) return 'Grade 7';
  if (score >= 60) return 'Grade 8–9';
  if (score >= 50) return 'Grade 10–11';
  if (score >= 30) return 'Grade 12 / College';
  return 'Graduate Level';
}

function truncate(text: string, max = 60): string {
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

let issueIdCounter = 0;
function newId(): string {
  return `ux-${++issueIdCounter}`;
}

export function analyzeUX(text: string): UXAnalysisResult {
  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plainText) {
    return {
      readabilityScore: 100,
      gradeLevel: 'Grade 5',
      issues: [],
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
    };
  }

  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = tokenizeSentences(plainText);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);

  const syllableCount = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const rawScore =
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / Math.max(1, wordCount));
  const readabilityScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const gradeLevel = scoreToGradeLevel(readabilityScore);

  const issues: UXIssue[] = [];

  for (const sentence of sentences) {
    const sentWords = sentence.split(/\s+/).filter(w => w.length > 0);
    const len = sentWords.length;
    if (len > 45) {
      issues.push({
        id: newId(),
        severity: 'error',
        type: 'LONG_SENTENCE',
        label: 'Long Sentence',
        excerpt: truncate(sentence),
        description: `This sentence is ${len} words — very hard to parse. Split into 2–3 shorter sentences.`,
        fix: 'Break after a natural pause or conjunction.',
      });
    } else if (len > 30) {
      issues.push({
        id: newId(),
        severity: 'warning',
        type: 'LONG_SENTENCE',
        label: 'Long Sentence',
        excerpt: truncate(sentence),
        description: `This sentence is ${len} words. Aim for under 25 words for clarity.`,
        fix: 'Split at a conjunction or use a dash to create a pause.',
      });
    }

    for (const pattern of PASSIVE_VOICE_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(sentence);
      if (match) {
        issues.push({
          id: newId(),
          severity: 'warning',
          type: 'PASSIVE_VOICE',
          label: 'Passive Voice',
          excerpt: truncate(sentence),
          description: "Passive constructions hide who's doing the action and reduce clarity.",
          fix: `Rewrite actively: who does what? e.g., "The team wrote the report."`,
        });
        break;
      }
    }
  }

  for (const jargon of JARGON_LIST) {
    const re = new RegExp(`\\b${jargon.replace(/[-\s]/g, '[\\s\\-]')}\\b`, 'gi');
    if (re.test(plainText)) {
      issues.push({
        id: newId(),
        severity: 'info',
        type: 'JARGON',
        label: 'Jargon',
        excerpt: truncate(jargon),
        description: `"${jargon}" is business jargon that reduces trust and clarity.`,
        fix: `Replace with plain language: what does "${jargon}" actually mean here?`,
      });
    }
  }

  for (const phrase of WEAK_CTA_PHRASES) {
    const re = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (re.test(plainText)) {
      issues.push({
        id: newId(),
        severity: 'warning',
        type: 'WEAK_CTA',
        label: 'Weak CTA',
        excerpt: truncate(phrase),
        description: `"${phrase}" is a weak, generic call-to-action that doesn't tell users what they'll get.`,
        fix: 'Use specific action verbs: "Download the guide", "See pricing", "Start free trial".',
      });
    }
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(w => w.length > 0);
    if (paraWords.length > 120) {
      issues.push({
        id: newId(),
        severity: 'warning',
        type: 'DENSE_PARAGRAPH',
        label: 'Dense Paragraph',
        excerpt: truncate(para),
        description: `This paragraph is ${paraWords.length} words. Dense blocks reduce scan-ability.`,
        fix: 'Break into 2–3 shorter paragraphs, or use a list for enumerated items.',
      });
    }
  }

  return {
    readabilityScore,
    gradeLevel,
    issues,
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
  };
}
