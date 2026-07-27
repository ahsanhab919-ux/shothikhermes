import { z } from "zod";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Golden dataset entry
interface GoldenEntry {
  id: string;
  question: string;
  context: string[];
  expectedAnswer: string;
  tags: string[];
  createdAt: number;
  lastTestedAt?: number;
  driftScore?: number;
}

// Test result
interface TestResult {
  entryId: string;
  timestamp: number;
  actualAnswer: string;
  similarityScore: number;
  passed: boolean;
  differences: string[];
}

// Golden dataset schema
const goldenEntrySchema = z.object({
  question: z.string().min(10),
  context: z.array(z.string()),
  expectedAnswer: z.string().min(20),
  tags: z.array(z.string()).default([]),
});

export type GoldenEntryInput = z.infer<typeof goldenEntrySchema>;

/**
 * Add entry to golden dataset
 */
export async function addToGoldenDataset(
  entry: GoldenEntryInput
): Promise<GoldenEntry> {
  const validated = goldenEntrySchema.parse(entry);
  
  const goldenEntry: GoldenEntry = {
    id: `golden_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...validated,
    createdAt: Date.now(),
  };
  
  await redis.hset("ai:golden:dataset", {
    [goldenEntry.id]: JSON.stringify(goldenEntry),
  });
  
  // Add to tag index
  for (const tag of entry.tags) {
    await redis.sadd(`ai:golden:tags:${tag}`, goldenEntry.id);
  }
  
  return goldenEntry;
}

/**
 * Get all golden dataset entries
 */
export async function getGoldenDataset(
  tags?: string[]
): Promise<GoldenEntry[]> {
  let entryIds: string[] = [];
  
  if (tags && tags.length > 0) {
    // Get entries matching tags
    for (const tag of tags) {
      const ids = await redis.smembers(`ai:golden:tags:${tag}`);
      entryIds.push(...ids);
    }
    entryIds = [...new Set(entryIds)]; // Deduplicate
  }
  
  const entries = await redis.hgetall<Record<string, string>>("ai:golden:dataset");
  
  if (!entries) return [];
  
  const parsed = Object.values(entries)
    .map(e => {
      try {
        return JSON.parse(e) as GoldenEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is GoldenEntry => e !== null);
  
  if (entryIds.length > 0) {
    return parsed.filter(e => entryIds.includes(e.id));
  }
  
  return parsed;
}

/**
 * Calculate similarity between two texts (simple version)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Find differences between expected and actual answers
 */
function findDifferences(expected: string, actual: string): string[] {
  const differences: string[] = [];
  
  // Check for missing key phrases
  const expectedPhrases = expected.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  for (const phrase of expectedPhrases) {
    const keyWords = phrase.trim().split(/\s+/).slice(0, 5).join(" ");
    if (!actual.toLowerCase().includes(keyWords.toLowerCase())) {
      differences.push(`Missing: "${phrase.trim().slice(0, 50)}..."`);
    }
  }
  
  // Check for added claims
  const actualPhrases = actual.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  for (const phrase of actualPhrases) {
    const keyWords = phrase.trim().split(/\s+/).slice(0, 5).join(" ");
    if (!expected.toLowerCase().includes(keyWords.toLowerCase())) {
      differences.push(`Added: "${phrase.trim().slice(0, 50)}..."`);
    }
  }
  
  return differences.slice(0, 5);
}

/**
 * Test AI system against golden dataset
 */
export async function testAgainstGoldenDataset(
  generateFn: (question: string, context: string[]) => Promise<string>,
  options: {
    tags?: string[];
    threshold?: number;
  } = {}
): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const entries = await getGoldenDataset(options.tags);
  const threshold = options.threshold || 0.7;
  
  const results: TestResult[] = [];
  let passed = 0;
  
  for (const entry of entries) {
    try {
      const actualAnswer = await generateFn(entry.question, entry.context);
      const similarityScore = calculateSimilarity(entry.expectedAnswer, actualAnswer);
      
      const differences = findDifferences(entry.expectedAnswer, actualAnswer);
      
      const testPassed = similarityScore >= threshold && differences.length < 3;
      
      if (testPassed) passed++;
      
      const result: TestResult = {
        entryId: entry.id,
        timestamp: Date.now(),
        actualAnswer,
        similarityScore,
        passed: testPassed,
        differences,
      };
      
      results.push(result);
      
      // Update entry with drift score
      await redis.hset("ai:golden:dataset", {
        [entry.id]: JSON.stringify({
          ...entry,
          lastTestedAt: Date.now(),
          driftScore: 1 - similarityScore,
        }),
      });
      
      // Store test result
      await redis.lpush(
        `ai:golden:results:${entry.id}`,
        JSON.stringify(result)
      );
      await redis.ltrim(`ai:golden:results:${entry.id}`, 0, 99);
      
    } catch (error) {
      results.push({
        entryId: entry.id,
        timestamp: Date.now(),
        actualAnswer: "",
        similarityScore: 0,
        passed: false,
        differences: [`Error: ${(error as Error).message}`],
      });
    }
  }
  
  return {
    total: entries.length,
    passed,
    failed: entries.length - passed,
    results,
  };
}

/**
 * Check for model drift
 */
export async function checkForDrift(
  threshold: number = 0.2
): Promise<{
  hasDrift: boolean;
  driftingEntries: Array<{
    entry: GoldenEntry;
    recentScore: number;
    historicalAvg: number;
  }>;
}> {
  const entries = await getGoldenDataset();
  const driftingEntries: Array<{
    entry: GoldenEntry;
    recentScore: number;
    historicalAvg: number;
  }> = [];
  
  for (const entry of entries) {
    const results = await redis.lrange(`ai:golden:results:${entry.id}`, 0, 9);
    
    if (results.length < 2) continue;
    
    const parsed = results
      .map(r => {
        try {
          return JSON.parse(r) as TestResult;
        } catch {
          return null;
        }
      })
      .filter((r): r is TestResult => r !== null);
    
    if (parsed.length < 2) continue;
    
    const recent = parsed[0].similarityScore;
    const historical = parsed.slice(1).reduce((sum, r) => sum + r.similarityScore, 0) / (parsed.length - 1);
    
    if (historical - recent > threshold) {
      driftingEntries.push({
        entry,
        recentScore: recent,
        historicalAvg: historical,
      });
    }
  }
  
  return {
    hasDrift: driftingEntries.length > 0,
    driftingEntries,
  };
}

/**
 * Get golden dataset statistics
 */
export async function getGoldenStats(): Promise<{
  totalEntries: number;
  totalTests: number;
  averageScore: number;
  driftDetected: boolean;
}> {
  const entries = await getGoldenDataset();
  
  let totalTests = 0;
  let totalScore = 0;
  let driftCount = 0;
  
  for (const entry of entries) {
    const results = await redis.lrange(`ai:golden:results:${entry.id}`, 0, -1);
    totalTests += results.length;
    
    for (const result of results) {
      try {
        const parsed = JSON.parse(result) as TestResult;
        totalScore += parsed.similarityScore;
      } catch {
        // Ignore
      }
    }
    
    if (entry.driftScore && entry.driftScore > 0.2) {
      driftCount++;
    }
  }
  
  return {
    totalEntries: entries.length,
    totalTests,
    averageScore: totalTests > 0 ? totalScore / totalTests : 0,
    driftDetected: driftCount > 0,
  };
}

/**
 * Seed initial golden dataset for Shothik
 */
export async function seedGoldenDataset(): Promise<void> {
  const existing = await getGoldenDataset();
  if (existing.length > 0) return; // Already seeded
  
  const seedEntries: GoldenEntryInput[] = [
    {
      question: "What are the main features of Shothik's Writing Studio?",
      context: [
        "Shothik Writing Studio supports three use cases: Books, Research Papers, and University Assignments.",
        "Key features include chapter management, AI-powered suggestions, and publishing integration.",
        "Users can export to ePub, PDF, and other formats with accessibility compliance.",
      ],
      expectedAnswer: "Shothik's Writing Studio supports three main use cases: Books, Research Papers, and University Assignments. It offers chapter management, AI-powered writing suggestions, and direct publishing integration. Users can export their work to multiple formats including ePub and PDF with full accessibility compliance.",
      tags: ["features", "writing-studio"],
    },
    {
      question: "How does the AI Economic Infrastructure work?",
      context: [
        "The AI Economic Infrastructure includes token cost simulation, dynamic pricing, and fraud detection.",
        "It uses a 4-layer fraud detection system: Payment, Token, Agent, and Internal.",
        "Cost optimizations include TOON format (40-60% savings) and smart routing.",
      ],
      expectedAnswer: "Shothik's AI Economic Infrastructure provides token cost simulation with dynamic pricing based on complexity, risk, and load. It features a 4-layer fraud detection system covering Payment, Token, Agent, and Internal threats. Cost optimizations include the TOON format for 40-60% token savings and intelligent routing between AI providers.",
      tags: ["economic-infrastructure", "pricing"],
    },
    {
      question: "What security measures does Shothik implement?",
      context: [
        "Shothik implements JWT authentication, rate limiting, and input validation with Zod.",
        "API security includes OWASP API Top 10 compliance checks.",
        "Additional features: idempotency keys, API key management, and security monitoring.",
      ],
      expectedAnswer: "Shothik implements comprehensive security including JWT authentication, Redis-based rate limiting, and Zod input validation. API security covers all OWASP API Top 10 requirements with additional features like idempotency keys, API key management for external developers, and real-time security monitoring with automated threat detection.",
      tags: ["security", "api"],
    },
  ];
  
  for (const entry of seedEntries) {
    await addToGoldenDataset(entry);
  }
}
