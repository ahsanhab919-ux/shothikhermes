import { z } from "zod";
import { Redis } from "@upstash/redis";
import { runHallucinationGuardrail, trackAIInteraction } from "./hallucination-guardrail";
import { addToGoldenDataset, testAgainstGoldenDataset } from "./golden-dataset";

const redis = Redis.fromEnv();

// RAG Context retrieval
interface ContextRetriever {
  (query: string, options?: any): Promise<string[]>;
}

// LLM Generator
interface LLMGenerator {
  (prompt: string, options?: any): Promise<string>;
}

// Quality Evaluator (second AI)
interface QualityEvaluator {
  (prompt: string): Promise<string>;
}

// Complete RAG pipeline config
interface RAGConfig {
  // Context retrieval
  retriever: ContextRetriever;
  maxContextChunks: number;
  minRelevanceScore: number;
  
  // Generation
  generator: LLMGenerator;
  systemPrompt: string;
  
  // Quality control
  evaluator?: QualityEvaluator;
  enableGuardrails: boolean;
  enableTracking: boolean;
  
  // Fallbacks
  fallbackMessage: string;
}

/**
 * Build RAG prompt with context
 */
function buildRAGPrompt(
  question: string,
  context: string[],
  systemPrompt: string
): string {
  const contextSection = context.length > 0
    ? `CONTEXT:\n${context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}\n\n`
    : "";
  
  return `${systemPrompt}

${contextSection}QUESTION: ${question}

INSTRUCTIONS:
- Answer based ONLY on the provided context
- If the context doesn't contain the answer, say "I don't have information about that"
- Be specific and cite the relevant context section
- Do not make up information not in the context

ANSWER:`;
}

/**
 * Main RAG pipeline with hallucination prevention
 */
export async function runRAGPipeline(
  question: string,
  config: RAGConfig,
  userId?: string
): Promise<{
  answer: string;
  context: string[];
  warnings: string[];
  metadata: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    contextCount: number;
    guardrailResult?: any;
  };
}> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  // Step 1: Retrieve context
  const retrievalStart = Date.now();
  let context: string[] = [];
  
  try {
    context = await config.retriever(question, {
      limit: config.maxContextChunks,
      minScore: config.minRelevanceScore,
    });
  } catch (error) {
    warnings.push("Context retrieval failed");
  }
  
  const retrievalTime = Date.now() - retrievalStart;
  
  // Step 2: Check if we have relevant context
  if (context.length === 0) {
    const fallback = config.fallbackMessage || 
      "I don't have sufficient information to answer that question.";
    
    return {
      answer: fallback,
      context: [],
      warnings: ["No relevant context found"],
      metadata: {
        retrievalTime,
        generationTime: 0,
        totalTime: Date.now() - startTime,
        contextCount: 0,
      },
    };
  }
  
  // Step 3: Generate answer
  const generationStart = Date.now();
  const prompt = buildRAGPrompt(question, context, config.systemPrompt);
  
  let answer: string;
  try {
    answer = await config.generator(prompt);
  } catch (error) {
    return {
      answer: "I encountered an error while generating the answer. Please try again.",
      context,
      warnings: ["Generation failed: " + (error as Error).message],
      metadata: {
        retrievalTime,
        generationTime: Date.now() - generationStart,
        totalTime: Date.now() - startTime,
        contextCount: context.length,
      },
    };
  }
  
  const generationTime = Date.now() - generationStart;
  
  // Step 4: Run hallucination guardrails
  let guardrailResult: any;
  
  if (config.enableGuardrails) {
    const guardrailStart = Date.now();
    
    const guardrailOutput = await runHallucinationGuardrail(
      question,
      context,
      answer,
      {
        checkPatterns: true,
        checkRelevance: true,
        useEvaluator: !!config.evaluator,
        evaluateFn: config.evaluator,
      }
    );
    
    guardrailResult = {
      ...guardrailOutput.metadata,
      processingTime: Date.now() - guardrailStart,
    };
    
    // Update answer if guardrail blocked it
    if (!guardrailOutput.shouldProceed) {
      answer = guardrailOutput.answer;
      warnings.push(...guardrailOutput.warnings);
    } else {
      warnings.push(...guardrailOutput.warnings);
    }
  }
  
  // Step 5: Track interaction
  if (config.enableTracking && userId) {
    await trackAIInteraction(userId, {
      question,
      context,
      answer,
      hadHallucination: warnings.length > 0,
      warnings,
    });
  }
  
  return {
    answer,
    context,
    warnings,
    metadata: {
      retrievalTime,
      generationTime,
      totalTime: Date.now() - startTime,
      contextCount: context.length,
      guardrailResult,
    },
  };
}

/**
 * Context retriever using Convex vector search
 */
export function createConvexRetriever(
  convexClient: any,
  options: {
    table: string;
    vectorField: string;
    contentField: string;
  }
): ContextRetriever {
  return async (query: string, searchOptions?: any) => {
    // Generate embedding for query
    // This would use your embedding model
    const embedding = await generateEmbedding(query);
    
    // Search Convex
    const results = await convexClient.query(
      `${options.table}:search`,
      {
        vector: embedding,
        limit: searchOptions?.limit || 5,
      }
    );
    
    return results
      .filter((r: any) => r.score >= (searchOptions?.minScore || 0.7))
      .map((r: any) => r[options.contentField]);
  };
}

/**
 * Generate text embedding using Gemini text-embedding-004.
 * Returns a 768-dimensional float vector suitable for cosine similarity search.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey =
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const baseUrl =
    process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com";

  const response = await fetch(
    `${baseUrl}/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini embedding API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const values: number[] | undefined = data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding API returned an empty embedding vector");
  }

  return values;
}

/**
 * LLM generator using Kimi/Moonshot
 */
export function createKimiGenerator(
  apiKey: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): LLMGenerator {
  return async (prompt: string) => {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "kimi-k2-thinking",
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };
}

/**
 * Quality evaluator using a second AI call
 */
export function createQualityEvaluator(
  generator: LLMGenerator
): QualityEvaluator {
  return async (prompt: string) => {
    return generator(prompt);
  };
}

/**
 * Pre-built RAG pipeline for Shothik documentation
 */
export async function createShothikRAGPipeline(
  convexClient: any,
  kimiApiKey: string
): Promise<(question: string, userId?: string) => Promise<{
  answer: string;
  context: string[];
  warnings: string[];
  metadata: any;
}>> {
  const retriever = createConvexRetriever(convexClient, {
    table: "documentation",
    vectorField: "embedding",
    contentField: "content",
  });
  
  const generator = createKimiGenerator(kimiApiKey, {
    model: "kimi-k2-thinking",
    temperature: 0.3,
  });
  
  const evaluator = createQualityEvaluator(generator);
  
  const config: RAGConfig = {
    retriever,
    maxContextChunks: 5,
    minRelevanceScore: 0.7,
    generator,
    systemPrompt: `You are Shothik's AI assistant. Answer questions about the Shothik platform based ONLY on the provided documentation context.`,
    evaluator,
    enableGuardrails: true,
    enableTracking: true,
    fallbackMessage: "I don't have information about that in the documentation. Please check the docs or contact support.",
  };
  
  return (question: string, userId?: string) =>
    runRAGPipeline(question, config, userId);
}

/**
 * Scheduled test runner for golden dataset
 */
export async function runScheduledTests(
  generateFn: (question: string, context: string[]) => Promise<string>
): Promise<void> {
  const results = await testAgainstGoldenDataset(generateFn, {
    threshold: 0.7,
  });
  
  // Store results
  await redis.setex(
    "ai:golden:last-test",
    86400 * 7, // 7 days
    JSON.stringify({
      timestamp: Date.now(),
      ...results,
    })
  );
  
  // Alert if pass rate drops
  const passRate = results.total > 0 ? results.passed / results.total : 0;
  if (passRate < 0.8) {
    console.error(`🚨 Golden dataset pass rate dropped to ${(passRate * 100).toFixed(1)}%`);
    // TODO: Send alert to team
  }
}
