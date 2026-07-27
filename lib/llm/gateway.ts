import { logger } from '@/lib/logger';

type ProviderName = 'kimi' | 'deepseek' | 'gemini';
type ToolName = 'humanize' | 'summarize' | 'cowriter' | 'book-agent' | 'grammar' | 'translator' | 'ai-detector' | 'paraphrase' | 'twin-task';

const TOOL_ROUTING: Record<ToolName, ProviderName> = {
  humanize: 'gemini',
  summarize: 'gemini',
  cowriter: 'gemini',
  'book-agent': 'gemini',
  grammar: 'gemini',
  translator: 'gemini',
  'ai-detector': 'gemini',
  paraphrase: 'gemini',
  'twin-task': 'gemini',
};

const PROVIDER_COSTS: Record<ProviderName, { input: number; output: number }> = {
  kimi:     { input: 0.6,   output: 2.5  },
  deepseek: { input: 0.14,  output: 0.28 },
  gemini:   { input: 0.075, output: 0.30 },
};

const FALLBACK_CHAIN: Record<ProviderName, ProviderName[]> = {
  kimi:     ['kimi', 'gemini', 'deepseek'],
  deepseek: ['deepseek', 'kimi', 'gemini'],
  gemini:   ['gemini', 'deepseek', 'kimi'],
};

export const TOOL_SYSTEM_INSTRUCTIONS: Partial<Record<ToolName, string>> = {
  humanize: `You are a professional editor with 15 years of experience rewriting AI-generated text to sound authentically human. You specialize in preserving the writer's intended meaning while transforming voice, rhythm, and phrasing. You never add information, never remove facts, and never change proper nouns, numbers, or technical terms. You output only the rewritten text — never labels, preamble, or commentary.`,

  paraphrase: `You are a senior linguistic editor. Your job is to rewrite text in a specified style and strength while preserving all factual content exactly. You are precise: you change phrasing and structure, but never invent details, change names, alter numbers, or mistranslate. You output only the rewritten text — no labels, no explanation.`,

  summarize: `You are a world-class research analyst and science communicator. Your summaries are always accurate, well-structured, and grounded strictly in the source material — never in external knowledge or assumption. You adapt your format to the requested summary type. You output only the summary — never preamble or explanation.`,

  grammar: `You are a professional proofreader and copy editor. You identify genuine grammar, spelling, punctuation, and style errors — but you never flag correct usage, deliberate stylistic choices, technical terms, LaTeX equations, code snippets, or proper nouns. You return structured JSON exactly as instructed. You are conservative: when in doubt, do not flag.`,

  translator: `You are a professional human translator fluent in all major world languages. You translate naturally and idiomatically — not word-for-word. You preserve all formatting, markdown, proper nouns, brand names, numbers, URLs, and technical terms. You output only the translated text — no labels or commentary.`,

  'ai-detector': `You are a forensic linguistics expert specialising in detecting AI-generated text. You have deep knowledge of how language models write — their patterns, tendencies, and tells. You are calibrated and careful: you do not misclassify formal academic writing as AI-generated just because it is structured. You always provide specific evidence from the text to justify your score. You return only the JSON object requested.`,

  cowriter: `You are an expert writing co-author. You seamlessly continue, extend, or improve any text in the exact tone, style, vocabulary, and register of the existing writing. You never repeat input text, never add meta-commentary, and never explain what you are doing — you simply write. You preserve all technical terms, LaTeX, code, citations, and named entities exactly as written.`,
};

export interface GatewayRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  jsonMode?: boolean;
}

export interface GatewayResponse {
  text: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  provider: ProviderName;
  costUsd: number;
}

export function estimateCost(provider: ProviderName, inputTokens: number, outputTokens: number): number {
  const rates = PROVIDER_COSTS[provider];
  return ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1_000_000;
}

async function callKimi(request: GatewayRequest): Promise<GatewayResponse> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const messages = request.systemInstruction
    ? [
        { role: 'system', content: request.systemInstruction },
        { role: 'user', content: request.prompt },
      ]
    : [{ role: 'user', content: request.prompt }];

  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'kimi-k2-thinking',
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Kimi ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = data.choices[0].message.content.trim();
  const inputTokens = data.usage?.prompt_tokens || Math.ceil(request.prompt.length / 4);
  const outputTokens = data.usage?.completion_tokens || Math.ceil(text.length / 4);

  return {
    text,
    tokensUsed: inputTokens + outputTokens,
    inputTokens,
    outputTokens,
    provider: 'kimi',
    costUsd: estimateCost('kimi', inputTokens, outputTokens),
  };
}

async function callDeepSeek(request: GatewayRequest): Promise<GatewayResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const messages = request.systemInstruction
    ? [
        { role: 'system', content: request.systemInstruction },
        { role: 'user', content: request.prompt },
      ]
    : [{ role: 'user', content: request.prompt }];

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = data.choices[0].message.content.trim();
  const inputTokens = data.usage?.prompt_tokens || Math.ceil(request.prompt.length / 4);
  const outputTokens = data.usage?.completion_tokens || Math.ceil(text.length / 4);

  return {
    text,
    tokensUsed: inputTokens + outputTokens,
    inputTokens,
    outputTokens,
    provider: 'deepseek',
    costUsd: estimateCost('deepseek', inputTokens, outputTokens),
  };
}

async function callGemini(request: GatewayRequest): Promise<GatewayResponse> {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const generationConfig: Record<string, unknown> = {
    temperature: request.temperature ?? 0.7,
    maxOutputTokens: request.maxTokens ?? 2000,
  };
  if (request.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    generationConfig,
  };

  if (request.systemInstruction) {
    body.system_instruction = { parts: [{ text: request.systemInstruction }] };
  }

  const res = await fetch(
    `${baseUrl}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    const reason = candidate?.finishReason ?? 'UNKNOWN';
    throw new Error(`Gemini returned no text content (finishReason: ${reason})`);
  }
  const inputTokens = data.usageMetadata?.promptTokenCount || Math.ceil(request.prompt.length / 4);
  const outputTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

  return {
    text,
    tokensUsed: inputTokens + outputTokens,
    inputTokens,
    outputTokens,
    provider: 'gemini',
    costUsd: estimateCost('gemini', inputTokens, outputTokens),
  };
}

const PROVIDERS: Record<ProviderName, (r: GatewayRequest) => Promise<GatewayResponse>> = {
  kimi: callKimi,
  deepseek: callDeepSeek,
  gemini: callGemini,
};

const LLM_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_LLM = 5;
const SEMAPHORE_WAIT_MS = 10_000;

let activeLlmCalls = 0;
const waitQueue: Array<() => void> = [];

function acquireSemaphore(timeoutMs: number): Promise<void> {
  if (activeLlmCalls < MAX_CONCURRENT_LLM) {
    activeLlmCalls++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = waitQueue.indexOf(onRelease);
      if (idx !== -1) waitQueue.splice(idx, 1);
      reject(new Error('LLM concurrency limit reached — timed out waiting for slot'));
    }, timeoutMs);
    function onRelease() {
      clearTimeout(timer);
      activeLlmCalls++;
      resolve();
    }
    waitQueue.push(onRelease);
  });
}

function releaseSemaphore() {
  activeLlmCalls--;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift()!;
    next();
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function completeForTool(tool: ToolName, request: GatewayRequest): Promise<GatewayResponse> {
  await acquireSemaphore(SEMAPHORE_WAIT_MS);
  try {
    const preferred = TOOL_ROUTING[tool];
    const chain = FALLBACK_CHAIN[preferred];

    const systemInstruction = request.systemInstruction ?? TOOL_SYSTEM_INSTRUCTIONS[tool];

    let lastError: Error | null = null;
    for (const provider of chain) {
      try {
        return await withTimeout(
          PROVIDERS[provider]({ ...request, systemInstruction }),
          LLM_TIMEOUT_MS,
          `LLM:${provider}`
        );
      } catch (err) {
        lastError = err as Error;
        logger.warn(`[LLMGateway] ${provider} failed for "${tool}"`, { error: (err as Error).message });
      }
    }

    throw lastError ?? new Error('All LLM providers failed');
  } finally {
    releaseSemaphore();
  }
}

export { TOOL_ROUTING, PROVIDER_COSTS, FALLBACK_CHAIN };
export type { ToolName, ProviderName };
