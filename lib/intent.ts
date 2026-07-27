export type PresentationType =
  | "pitch_deck"
  | "educational_lecture"
  | "marketing_overview"
  | "research_summary"
  | "technical_demo";

export type AudienceType = "Executives" | "Developers" | "Students" | "General";

export type ToneType = "Professional" | "Persuasive" | "Casual" | "Educational";

export interface IntentDetection {
  type: PresentationType;
  audience: AudienceType;
  tone: ToneType;
  keywords: string[];
  confidence: number;
}

const PRESENTATION_PATTERNS = {
  pitch_deck: {
    keywords: [
      "funding",
      "investment",
      "pitch",
      "business model",
      "revenue",
      "market opportunity",
      "tam sam som",
      "investor",
      "valuation",
      "growth",
      "traction",
      "metrics",
      "runway",
      "raise",
      "series",
      "seed",
    ],
    phrases: [
      "raising",
      "seeking investment",
      "business plan",
      "market size",
      "competitive advantage",
    ],
  },
  educational_lecture: {
    keywords: [
      "learn",
      "tutorial",
      "course",
      "lesson",
      "teach",
      "students",
      "education",
      "training",
      "workshop",
      "syllabus",
      "curriculum",
      "objectives",
      "understand",
      "explain",
      "demonstrate",
    ],
    phrases: [
      "learning objectives",
      "by the end",
      "will understand",
      "key concepts",
      "step by step",
    ],
  },
  marketing_overview: {
    keywords: [
      "product",
      "launch",
      "campaign",
      "brand",
      "customers",
      "marketing",
      "sales",
      "engagement",
      "conversion",
      "roi",
      "strategy",
      "outreach",
      "promotion",
      "awareness",
    ],
    phrases: [
      "product launch",
      "go to market",
      "target audience",
      "value proposition",
      "market strategy",
    ],
  },
  research_summary: {
    keywords: [
      "research",
      "study",
      "findings",
      "methodology",
      "data",
      "analysis",
      "results",
      "conclusion",
      "hypothesis",
      "experiment",
      "survey",
      "participants",
      "statistical",
      "evidence",
      "literature",
    ],
    phrases: [
      "research question",
      "key findings",
      "methodology",
      "data analysis",
      "future research",
    ],
  },
  technical_demo: {
    keywords: [
      "demo",
      "architecture",
      "implementation",
      "code",
      "api",
      "system",
      "technical",
      "infrastructure",
      "deployment",
      "database",
      "framework",
      "algorithm",
      "performance",
      "scalability",
      "integration",
    ],
    phrases: [
      "technical overview",
      "system architecture",
      "how it works",
      "implementation details",
      "tech stack",
    ],
  },
};

const AUDIENCE_PATTERNS = {
  Executives: {
    keywords: [
      "roi",
      "revenue",
      "business",
      "strategy",
      "investment",
      "growth",
      "market",
      "competitive",
      "profit",
      "leadership",
      "decision",
      "vision",
    ],
    phrases: ["bottom line", "strategic", "business value", "executive summary"],
  },
  Developers: {
    keywords: [
      "code",
      "api",
      "technical",
      "implementation",
      "architecture",
      "framework",
      "library",
      "debug",
      "deploy",
      "git",
      "repository",
      "algorithm",
    ],
    phrases: ["technical details", "code example", "how to implement", "developer guide"],
  },
  Students: {
    keywords: [
      "learn",
      "tutorial",
      "beginner",
      "introduction",
      "basics",
      "fundamentals",
      "course",
      "lesson",
      "practice",
      "exercise",
      "homework",
    ],
    phrases: ["learning objectives", "getting started", "step by step", "practice problems"],
  },
  General: {
    keywords: [
      "overview",
      "introduction",
      "basics",
      "simple",
      "easy",
      "understand",
      "everyone",
      "anyone",
      "beginner friendly",
    ],
    phrases: ["easy to understand", "no experience needed", "simple introduction"],
  },
};

const TONE_PATTERNS = {
  Professional: {
    keywords: [
      "professional",
      "formal",
      "business",
      "corporate",
      "executive",
      "strategic",
      "enterprise",
      "industry",
      "analysis",
      "metrics",
    ],
    phrases: ["in conclusion", "furthermore", "therefore", "accordingly"],
  },
  Persuasive: {
    keywords: [
      "best",
      "revolutionary",
      "innovative",
      "unique",
      "exceptional",
      "outstanding",
      "leading",
      "proven",
      "guaranteed",
      "transform",
    ],
    phrases: ["you should", "imagine", "don't miss", "act now", "limited time"],
  },
  Casual: {
    keywords: [
      "easy",
      "simple",
      "fun",
      "cool",
      "awesome",
      "hey",
      "let's",
      "quick",
      "friendly",
      "relax",
    ],
    phrases: ["let's dive in", "pretty cool", "check it out", "super easy"],
  },
  Educational: {
    keywords: [
      "learn",
      "understand",
      "explain",
      "teach",
      "demonstrate",
      "explore",
      "discover",
      "study",
      "examine",
      "analyze",
    ],
    phrases: [
      "let's explore",
      "we will learn",
      "to understand",
      "key concepts",
      "important to note",
    ],
  },
};

function calculateMatchScore(
  text: string,
  keywords: string[],
  phrases: string[]
): { score: number; matched: string[] } {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  let score = 0;

  // Check keywords
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword);
      score += 1;
    }
  }

  // Check phrases (worth more points)
  for (const phrase of phrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      matched.push(phrase);
      score += 2;
    }
  }

  return { score, matched };
}

export function detectIntent(text: string): IntentDetection {
  if (!text || text.trim().length === 0) {
    return {
      type: "educational_lecture",
      audience: "General",
      tone: "Professional",
      keywords: [],
      confidence: 0,
    };
  }

  // Detect presentation type
  let bestType: PresentationType = "educational_lecture";
  let bestTypeScore = 0;
  let typeKeywords: string[] = [];

  for (const [type, patterns] of Object.entries(PRESENTATION_PATTERNS)) {
    const { score, matched } = calculateMatchScore(text, patterns.keywords, patterns.phrases);
    if (score > bestTypeScore) {
      bestTypeScore = score;
      bestType = type as PresentationType;
      typeKeywords = matched;
    }
  }

  // Detect audience
  let bestAudience: AudienceType = "General";
  let bestAudienceScore = 0;

  for (const [audience, patterns] of Object.entries(AUDIENCE_PATTERNS)) {
    const { score } = calculateMatchScore(text, patterns.keywords, patterns.phrases);
    if (score > bestAudienceScore) {
      bestAudienceScore = score;
      bestAudience = audience as AudienceType;
    }
  }

  // Detect tone
  let bestTone: ToneType = "Professional";
  let bestToneScore = 0;

  for (const [tone, patterns] of Object.entries(TONE_PATTERNS)) {
    const { score } = calculateMatchScore(text, patterns.keywords, patterns.phrases);
    if (score > bestToneScore) {
      bestToneScore = score;
      bestTone = tone as ToneType;
    }
  }

  // Calculate overall confidence (0-1 scale)
  const totalScore = bestTypeScore + bestAudienceScore + bestToneScore;
  const maxPossibleScore = 30; // Rough estimate
  const confidence = Math.min(totalScore / maxPossibleScore, 1);

  return {
    type: bestType,
    audience: bestAudience,
    tone: bestTone,
    keywords: typeKeywords.slice(0, 5), // Top 5 keywords
    confidence: Math.round(confidence * 100) / 100,
  };
}
