import { z } from "zod";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Hallucination detection result
interface HallucinationCheck {
  isHallucination: boolean;
  confidence: number;
  reasons: string[];
  suggestedAction: "allow" | "flag" | "block";
}

// Context relevance check
interface ContextRelevance {
  isRelevant: boolean;
  relevanceScore: number;
  missingContext: string[];
}

// Known hallucination patterns
const HALLUCINATION_PATTERNS = [
  // Confidence without basis
  /\b(certainly|definitely|absolutely|without a doubt)\b.*\?/i,
  
  // Made-up citations
  /\b(according to|as stated in|research from)\s+["']?[^"']{3,50}["']?\s*(\([^)]*\))?/i,
  
  // Vague specifics
  /\b(studies show|research indicates|experts say)\b.*\b(\d+%|many|some|several)\b/i,
  
  // Contradictory statements
  /\b(however|but|although)\b.*\b(always|never|all|none)\b/i,
  
  // Uncertain certainty
  /\b(I believe|I think|in my opinion)\b.*\b(is|are|will|can)\b/i,
];

// Factual consistency checks
const FACTUAL_RED_FLAGS = [
  "as everyone knows",
  "common knowledge",
  "widely accepted",
  "experts agree",
  "studies have shown",
  "research proves",
];

/**
 * Check if response contains hallucination patterns
 */
export function detectHallucinationPatterns(response: string): HallucinationCheck {
  const reasons: string[] = [];
  let patternMatches = 0;
  
  // Check for hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(response)) {
      patternMatches++;
      reasons.push(`Matched pattern: ${pattern.source.slice(0, 50)}...`);
    }
  }
  
  // Check for factual red flags
  for (const flag of FACTUAL_RED_FLAGS) {
    if (response.toLowerCase().includes(flag)) {
      reasons.push(`Contains vague claim: "${flag}"`);
    }
  }
  
  // Check for inconsistent numbers
  const numbers = response.match(/\b\d{4,}\b/g);
  if (numbers && numbers.length > 3) {
    reasons.push("Contains many specific numbers (potential fabrication)");
  }
  
  // Calculate confidence
  const confidence = Math.min(1, patternMatches * 0.2 + reasons.length * 0.1);
  
  // Determine action
  let suggestedAction: "allow" | "flag" | "block" = "allow";
  if (confidence > 0.7) {
    suggestedAction = "block";
  } else if (confidence > 0.3) {
    suggestedAction = "flag";
  }
  
  return {
    isHallucination: confidence > 0.3,
    confidence,
    reasons,
    suggestedAction,
  };
}

/**
 * Check if retrieved context is relevant to the question
 */
export function checkContextRelevance(
  question: string,
  context: string[],
  answer: string
): ContextRelevance {
  const questionKeywords = extractKeywords(question);
  const answerKeywords = extractKeywords(answer);
  
  let totalRelevance = 0;
  const missingContext: string[] = [];
  
  for (const ctx of context) {
    const ctxKeywords = extractKeywords(ctx);
    const overlap = countOverlap(questionKeywords, ctxKeywords);
    const relevance = overlap / Math.max(questionKeywords.length, 1);
    totalRelevance += relevance;
  }
  
  const avgRelevance = context.length > 0 ? totalRelevance / context.length : 0;
  
  // Check if answer uses context
  const contextKeywords = context.flatMap(extractKeywords);
  const answerContextOverlap = countOverlap(answerKeywords, contextKeywords);
  const answerRelevance = answerContextOverlap / Math.max(answerKeywords.length, 1);
  
  // Combined score
  const relevanceScore = (avgRelevance * 0.4) + (answerRelevance * 0.6);
  
  // Identify missing context
  for (const keyword of questionKeywords) {
    if (!context.some(ctx => ctx.toLowerCase().includes(keyword.toLowerCase()))) {
      missingContext.push(keyword);
    }
  }
  
  return {
    isRelevant: relevanceScore > 0.3,
    relevanceScore,
    missingContext: missingContext.slice(0, 5),
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Remove stop words and extract meaningful terms
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "must", "shall", "can",
    "need", "dare", "ought", "used", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through",
    "during", "before", "after", "above", "below", "between",
    "under", "again", "further", "then", "once", "here", "there",
    "when", "where", "why", "how", "all", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "just", "and",
    "but", "if", "or", "because", "until", "while", "this", "that"
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Count overlapping keywords
 */
function countOverlap(arr1: string[], arr2: string[]): number {
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  return arr1.filter(s => set2.has(s.toLowerCase())).length;
}

/**
 * Use a second AI to evaluate answer quality (guardrail)
 */
export async function evaluateAnswerQuality(
  question: string,
  context: string[],
  answer: string,
  evaluateFn: (prompt: string) => Promise<string>
): Promise<{
  isValid: boolean;
  score: number;
  feedback: string;
}> {
  const evaluationPrompt = `
You are a quality evaluator. Assess if the following answer is accurate based ONLY on the provided context.

QUESTION: ${question}

CONTEXT:
${context.join("\n\n")}

ANSWER TO EVALUATE:
${answer}

Evaluate on these criteria:
1. Does the answer use ONLY information from the context? (yes/no)
2. Does the answer directly address the question? (yes/no)
3. Are there any claims not supported by the context? (list them)
4. Overall validity score (0-100)

Respond in this exact format:
VALID: [yes/no]
SCORE: [0-100]
FEEDBACK: [brief explanation]
`;

  try {
    const evaluation = await evaluateFn(evaluationPrompt);
    
    // Parse evaluation
    const validMatch = evaluation.match(/VALID:\s*(yes|no)/i);
    const scoreMatch = evaluation.match(/SCORE:\s*(\d+)/);
    const feedbackMatch = evaluation.match(/FEEDBACK:\s*(.+)/i);
    
    const isValid = validMatch?.[1].toLowerCase() === "yes";
    const score = parseInt(scoreMatch?.[1] || "0");
    const feedback = feedbackMatch?.[1] || "No feedback provided";
    
    return { isValid, score, feedback };
  } catch (error) {
    return {
      isValid: false,
      score: 0,
      feedback: "Evaluation failed: " + (error as Error).message,
    };
  }
}

/**
 * Main hallucination guardrail
 */
export async function runHallucinationGuardrail(
  question: string,
  context: string[],
  answer: string,
  options: {
    checkPatterns?: boolean;
    checkRelevance?: boolean;
    useEvaluator?: boolean;
    evaluateFn?: (prompt: string) => Promise<string>;
  } = {}
): Promise<{
  shouldProceed: boolean;
  answer: string;
  warnings: string[];
  metadata: {
    patternCheck?: HallucinationCheck;
    relevanceCheck?: ContextRelevance;
    qualityCheck?: { isValid: boolean; score: number; feedback: string };
  };
}> {
  const warnings: string[] = [];
  const metadata: any = {};
  
  // Step 1: Pattern detection
  if (options.checkPatterns !== false) {
    const patternCheck = detectHallucinationPatterns(answer);
    metadata.patternCheck = patternCheck;
    
    if (patternCheck.suggestedAction === "block") {
      return {
        shouldProceed: false,
        answer: "I don't have sufficient information to answer that accurately.",
        warnings: patternCheck.reasons,
        metadata,
      };
    }
    
    if (patternCheck.suggestedAction === "flag") {
      warnings.push(...patternCheck.reasons);
    }
  }
  
  // Step 2: Context relevance
  if (options.checkRelevance !== false && context.length > 0) {
    const relevanceCheck = checkContextRelevance(question, context, answer);
    metadata.relevanceCheck = relevanceCheck;
    
    if (!relevanceCheck.isRelevant) {
      warnings.push("Answer may not be based on provided context");
      
      if (relevanceCheck.relevanceScore < 0.1) {
        return {
          shouldProceed: false,
          answer: "I don't have information about that in the provided context.",
          warnings,
          metadata,
        };
      }
    }
  }
  
  // Step 3: Quality evaluation (if evaluator provided)
  if (options.useEvaluator && options.evaluateFn) {
    const qualityCheck = await evaluateAnswerQuality(
      question,
      context,
      answer,
      options.evaluateFn
    );
    metadata.qualityCheck = qualityCheck;
    
    if (!qualityCheck.isValid || qualityCheck.score < 50) {
      return {
        shouldProceed: false,
        answer: "I cannot provide a reliable answer based on the available information.",
        warnings: [qualityCheck.feedback],
        metadata,
      };
    }
  }
  
  return {
    shouldProceed: true,
    answer,
    warnings,
    metadata,
  };
}

/**
 * Track AI interactions for improvement
 */
export async function trackAIInteraction(
  userId: string,
  interaction: {
    question: string;
    context: string[];
    answer: string;
    hadHallucination: boolean;
    warnings: string[];
  }
): Promise<void> {
  const key = `ai:interactions:${userId}:${new Date().toISOString().split("T")[0]}`;
  
  await redis.lpush(key, JSON.stringify({
    ...interaction,
    timestamp: Date.now(),
  }));
  
  await redis.ltrim(key, 0, 999); // Keep last 1000
  await redis.expire(key, 86400 * 30); // 30 days
  
  // Track hallucination rate
  if (interaction.hadHallucination) {
    await redis.incr(`ai:hallucinations:${new Date().toISOString().split("T")[0]}`);
  }
  await redis.incr(`ai:total:${new Date().toISOString().split("T")[0]}`);
}

/**
 * Get hallucination statistics
 */
export async function getHallucinationStats(days: number = 7): Promise<{
  totalInteractions: number;
  hallucinations: number;
  rate: number;
}> {
  let total = 0;
  let hallucinations = 0;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    
    const dayTotal = parseInt(await redis.get(`ai:total:${dateKey}`) || "0");
    const dayHallucinations = parseInt(await redis.get(`ai:hallucinations:${dateKey}`) || "0");
    
    total += dayTotal;
    hallucinations += dayHallucinations;
  }
  
  return {
    totalInteractions: total,
    hallucinations,
    rate: total > 0 ? hallucinations / total : 0,
  };
}
