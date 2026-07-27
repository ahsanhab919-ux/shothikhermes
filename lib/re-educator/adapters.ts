/**
 * Re-educator — OpenAI + Anthropic + Gemini semantic provider adapters (Phase 2 #3).
 *
 * Phase 2 #2 defined the `SemanticProvider` contract and the `providerToReviewer`
 * adapter that enforces input scoping + fail-closed output validation. This file
 * implements REAL providers behind that contract: thin `fetch`-based calls to
 * OpenAI (`/v1/chat/completions`), Anthropic (`/v1/messages`), and Gemini
 * (`/v1beta/models/{model}:generateContent`). No SDK — the repo talks to models via
 * plain HTTP (matches the no-SDK, Letta-handle style).
 *
 * Design rules (spec §7b#3):
 *   - Structured-JSON output: the model is asked to return a strict JSON object
 *     `{ issues: [{ span:{start,end}, category, severity, rationale, suggestion? }] }`.
 *     We parse defensively; the downstream `providerToReviewer` layer does the
 *     authoritative validation/clamping, so a lie here is dropped there, not
 *     trusted.
 *   - Strict caps: at most `MAX_SPANS` candidate spans are ever sent, each
 *     snippet is truncated to `MAX_SNIPPET_CHARS`, and the model is capped at
 *     `MAX_OUTPUT_TOKENS`. A run cannot balloon into unbounded token spend.
 *   - Fail CLOSED: absent key, non-2xx, network error, timeout, or unparseable
 *     body ⇒ return `[]`. A flaky model call must NEVER crash a run; the engine
 *     simply stays deterministic-only for that pass. (The reviewer-level adapter
 *     also catches, but each provider is independently robust.)
 *
 * The BYOK key is a plain parameter (`apiKey`) — this file does not care where it
 * came from (env, per-request header, encrypted profile). Phase 2 #4 wires the
 * source. Nothing here persists or logs the key.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 (semantic review), §7b#3 (this step), §8 (never
 * crash on a model call; adapter-layer enforcement lives one layer out).
 */

import type { SemanticProvider, SemanticProviderInput } from './provider';
import { SEMANTIC_CATEGORIES } from './provider';
import type { Issue, Span } from './types';

/** Hard caps — the cost/safety guardrails (§4a). Kept conservative; Phase 2 #6
 * may surface these in config, but the defaults must always be bounded. */
export const MAX_SPANS = 12;
export const MAX_SNIPPET_CHARS = 600;
export const MAX_OUTPUT_TOKENS = 1024;
export const REQUEST_TIMEOUT_MS = 20_000;

/** Default model handles. Overridable per adapter; chosen small/cheap on purpose
 * (the semantic pass only ever sees a handful of short flagged spans). */
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
export const DEFAULT_OMNIROUTE_MODEL = 'auto';
export const OMNIROUTE_BASE_URL = 'http://localhost:20128/v1/chat/completions';

/** One flagged region handed to the model: its span plus the exact snippet. */
interface SpanSnippet {
  index: number;
  start: number;
  end: number;
  snippet: string;
}

/** Clamp the candidate spans to the cap and attach the (truncated) source text
 * for each. Pure. The model is shown ONLY these regions. */
function toSnippets(text: string, spans: Span[]): SpanSnippet[] {
  return spans.slice(0, MAX_SPANS).map((s, index) => ({
    index,
    start: s.start,
    end: s.end,
    snippet: text.slice(s.start, s.end).slice(0, MAX_SNIPPET_CHARS),
  }));
}

/** The shared instruction. We tell the model exactly which categories it may use
 * and demand strict JSON. Anything off-spec is dropped downstream, but a clear
 * instruction reduces waste. */
export function buildPrompt(input: SemanticProviderInput, snippets: SpanSnippet[]): string {
  const cats = SEMANTIC_CATEGORIES.join(', ');
  const writingMd = input.writingMd
    ? `\n\nThe author's WRITING.md (voice, rules, thesis) — align findings to it:\n"""\n${input.writingMd.slice(0, 4000)}\n"""`
    : '';
  const spanList = snippets
    .map((s) => `- span ${s.index} [${s.start},${s.end}]: ${JSON.stringify(s.snippet)}`)
    .join('\n');

  return (
    `You are a disciplined writing reviewer. Review ONLY the numbered spans below.\n` +
    `Do NOT review or comment on any text outside these spans.\n` +
    `For each span that has a genuine issue, emit one finding. Skip clean spans.\n\n` +
    `Allowed categories (use EXACTLY one per finding): ${cats}.\n` +
    `- clarity: unclear/confusing phrasing.\n` +
    `- voice-drift: diverges from the author's voice/rules.\n` +
    `- unsupported-assertion: a claim needing evidence (flag only; never rewrite).\n` +
    `Severity is one of: info, minor, major.\n` +
    `You may include an optional "suggestion" (a rephrase) for clarity/voice-drift ` +
    `only; never for unsupported-assertion.\n\n` +
    `Return STRICT JSON, no prose, exactly:\n` +
    `{"issues":[{"span":{"start":<int>,"end":<int>},"category":"<one-of-allowed>",` +
    `"severity":"<info|minor|major>","rationale":"<short>","suggestion":"<optional>"}]}\n` +
    `The span start/end MUST equal one of the provided span ranges.${writingMd}\n\n` +
    `Spans:\n${spanList}`
  );
}

/**
 * Parse a model's textual response into raw issue objects. Defensive: strips
 * markdown code fences, finds the outermost JSON object, and returns `[]` on any
 * failure. Does NOT validate categories/spans — that is `providerToReviewer`'s
 * job; here we only get from "text" to "array of candidate objects".
 */
export function parseIssuesJson(content: string): unknown[] {
  if (!content) return [];
  let body = content.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();
  // If there is leading/trailing prose, grab the outermost {...}.
  const first = body.indexOf('{');
  const last = body.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return [];
  try {
    const parsed = JSON.parse(body.slice(first, last + 1)) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return [];
    const issues = (parsed as Record<string, unknown>).issues;
    return Array.isArray(issues) ? issues : [];
  } catch {
    return [];
  }
}

/** Run a fetch (injected or global) with an abort-based timeout, failing closed
 * to `null` on any network error, timeout, or abort. The single network path
 * both adapters share — inject `fetchImpl` in tests to avoid real requests. */
async function runFetch(
  doFetch: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await doFetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Options common to both adapters. The key is a plain parameter (BYOK-agnostic). */
export interface AdapterOptions {
  apiKey: string | undefined;
  model?: string;
  timeoutMs?: number;
  /** Injected for tests: replace the network call. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Override the chat-completions endpoint (OpenAI-compatible gateways, e.g. OmniRoute). Defaults to OpenAI. */
  baseUrl?: string;
}

/**
 * OpenAI adapter — POST /v1/chat/completions with response_format json_object.
 * Fails closed to `[]` on absent key / non-2xx / network / parse error.
 */
export function openAiProvider(opts: AdapterOptions): SemanticProvider {
  const model = opts.model ?? DEFAULT_OPENAI_MODEL;
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? fetch;
  const url = opts.baseUrl ?? 'https://api.openai.com/v1/chat/completions';
  return {
    name: 'openai',
    async review(input: SemanticProviderInput): Promise<Issue[]> {
      if (!opts.apiKey) return [];
      const snippets = toSnippets(input.text, input.spans);
      if (snippets.length === 0) return [];
      const prompt = buildPrompt(input, snippets);

      const response = await runFetch(
        doFetch,
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You return only strict JSON.' },
              { role: 'user', content: prompt },
            ],
          }),
        },
        timeoutMs,
      );

      if (!response || !response.ok) return [];
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return [];
      }
      const content =
        (json as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
          ?.content ?? '';
      return parseIssuesJson(content) as Issue[];
    },
  };
}

/**
 * Anthropic adapter — POST /v1/messages. Fails closed to `[]` on absent key /
 * non-2xx / network / parse error.
 */
export function anthropicProvider(opts: AdapterOptions): SemanticProvider {
  const model = opts.model ?? DEFAULT_ANTHROPIC_MODEL;
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    name: 'anthropic',
    async review(input: SemanticProviderInput): Promise<Issue[]> {
      if (!opts.apiKey) return [];
      const snippets = toSnippets(input.text, input.spans);
      if (snippets.length === 0) return [];
      const prompt = buildPrompt(input, snippets);

      const response = await runFetch(
        doFetch,
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': opts.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: 0,
            system: 'You return only strict JSON.',
            messages: [{ role: 'user', content: prompt }],
          }),
        },
        timeoutMs,
      );

      if (!response || !response.ok) return [];
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return [];
      }
      const content =
        (json as { content?: Array<{ text?: string }> })?.content?.[0]?.text ?? '';
      return parseIssuesJson(content) as Issue[];
    },
  };
}

/**
 * Gemini adapter — POST /v1beta/models/{model}:generateContent. The key travels in
 * the `x-goog-api-key` header (NOT the URL query string, so it never lands in logs).
 * Fails closed to `[]` on absent key / non-2xx / network / parse error.
 */
export function geminiProvider(opts: AdapterOptions): SemanticProvider {
  const model = opts.model ?? DEFAULT_GEMINI_MODEL;
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    name: 'gemini',
    async review(input: SemanticProviderInput): Promise<Issue[]> {
      if (!opts.apiKey) return [];
      const snippets = toSnippets(input.text, input.spans);
      if (snippets.length === 0) return [];
      const prompt = buildPrompt(input, snippets);

      const response = await runFetch(
        doFetch,
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': opts.apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              responseMimeType: 'application/json',
            },
          }),
        },
        timeoutMs,
      );

      if (!response || !response.ok) return [];
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return [];
      }
      const content =
        (json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
          ?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return parseIssuesJson(content) as Issue[];
    },
  };
}
