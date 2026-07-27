/**
 * Re-educator — VERIFY meaning-preservation (semantic entailment) gate (Phase 2 #5).
 *
 * The engine's VERIFY stage (Stage 4, spec §3) already runs a DETERMINISTIC gate
 * on every applied edit (`verifyEdit` in engine.ts): re-run the flagging guard on
 * the revised text and confirm it no longer flags the edited span, and that the
 * diff stayed within bound. That gate is sufficient for MECHANICAL fixes, where
 * "did the fix work?" is a syntactic question a guard can answer.
 *
 * A SEMANTIC edit (clarity / voice-drift rephrase from a provider) needs a
 * second, different question answered: "does the revised text still MEAN what the
 * original meant?" A guard cannot answer that. This file adds that second gate as
 * a small, pure, provider-backed entailment check — kept deliberately separate
 * from the apply path so it can be built and tested in isolation (spec §7b#5).
 *
 * Design rules (mirror the rest of Phase 2):
 *   - FAIL CLOSED. Absent verifier, non-2xx, network error, timeout, or an
 *     unparseable answer ⇒ meaning is treated as NOT preserved ⇒ the caller must
 *     revert-and-requeue the edit. We NEVER assume meaning intact on doubt. This
 *     is the safe default: a meaning-changing edit that slips through is far worse
 *     than a good edit that gets deferred to the author.
 *   - No apply path here. This step ships the CHECKER and wires it as a second
 *     VERIFY gate; semantic edits still land as `propose` (drafted, never
 *     auto-applied). When an apply path for semantic edits is enabled (Auto-mode
 *     semantic application), it consumes this gate — see APPLY_PATH_TODO in
 *     engine.ts.
 *   - BYOK-agnostic. The key is a plain parameter, never persisted or logged
 *     (spec §8), exactly as the Phase 2 #3 adapters.
 *
 * Spec: RE-EDUCATOR-SPEC.md §3 (Stage 4 VERIFY), §7b#5 (this step), §8
 * (fail-closed, never log the key).
 */

/** Hard caps for the entailment call — bounded like the review adapters (§4a). */
export const ENTAILMENT_MAX_OUTPUT_TOKENS = 16;
export const ENTAILMENT_TIMEOUT_MS = 15_000;
/** Truncate each side before sending — an entailment check needs the sentences,
 * not an essay. Keeps token spend bounded even on a large flagged span. */
export const ENTAILMENT_MAX_CHARS = 1_200;

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';

/**
 * The one question the engine asks the VERIFY gate: does `after` preserve the
 * meaning of `before`? Returns `true` only on an explicit, confident YES. Any
 * ambiguity, error, or "no" ⇒ `false` (revert-and-requeue). Implementations MAY
 * be flaky (network); callers treat a thrown/rejected verifier as `false`.
 */
export interface MeaningVerifier {
  /** Stable identifier recorded on the outcome/ledger, e.g. "openai". */
  readonly name: string;
  verify(before: string, after: string): Promise<boolean>;
}

/**
 * Interpret a model's short answer as a strict boolean. Only an explicit
 * affirmative ("yes"/"true"/"preserved") counts as meaning-preserved; everything
 * else — "no", empty, prose, JSON we can't read — is `false` (fail closed).
 * Exported for direct unit testing.
 */
export function parseEntailmentAnswer(raw: string): boolean {
  if (!raw) return false;
  const t = raw.trim().toLowerCase();
  // Accept a bare token or a JSON-ish "{ preserved: true }" / "answer: yes".
  if (/^(yes|true|preserved|equivalent|same)\b/.test(t)) return true;
  if (/"?(preserved|entailed|equivalent)"?\s*[:=]\s*(true|"yes")/.test(t)) return true;
  return false;
}

/** The instruction. We demand a single-token answer to keep it cheap and
 * unambiguous, and we bias hard toward NO on any meaning shift. Exported so the
 * exact wording is testable/reviewable. */
export function buildEntailmentPrompt(before: string, after: string): string {
  const b = before.slice(0, ENTAILMENT_MAX_CHARS);
  const a = after.slice(0, ENTAILMENT_MAX_CHARS);
  return (
    `You are a strict meaning-preservation checker for an editing tool.\n` +
    `Decide whether the REVISED text preserves the full meaning of the ORIGINAL:\n` +
    `same claims, same facts, same commitments, nothing added or removed. A change\n` +
    `in wording or style is fine; a change in MEANING is not. If in any doubt, answer NO.\n\n` +
    `Answer with a single word: YES or NO.\n\n` +
    `ORIGINAL:\n"""\n${b}\n"""\n\nREVISED:\n"""\n${a}\n"""`
  );
}

/** Run a fetch (injected or global) with an abort-based timeout, failing closed
 * to `null` on any network error, timeout, or abort. Same discipline as the
 * review adapters — inject `fetchImpl` in tests to avoid real requests. */
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

/** Options for the provider-backed verifiers. Key is a plain BYOK-agnostic param. */
export interface VerifierOptions {
  apiKey: string | undefined;
  model?: string;
  timeoutMs?: number;
  /** Injected for tests: replace the network call. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * OpenAI-backed meaning verifier — POST /v1/chat/completions, single-token
 * answer. Fails closed to `false` on absent key / non-2xx / network / parse.
 */
export function openAiVerifier(opts: VerifierOptions): MeaningVerifier {
  const model = opts.model ?? DEFAULT_OPENAI_MODEL;
  const timeoutMs = opts.timeoutMs ?? ENTAILMENT_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    name: 'openai',
    async verify(before: string, after: string): Promise<boolean> {
      if (!opts.apiKey) return false;
      // A no-op edit trivially preserves meaning; skip the call.
      if (before === after) return true;
      const response = await runFetch(
        doFetch,
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: ENTAILMENT_MAX_OUTPUT_TOKENS,
            temperature: 0,
            messages: [
              { role: 'system', content: 'Answer only YES or NO.' },
              { role: 'user', content: buildEntailmentPrompt(before, after) },
            ],
          }),
        },
        timeoutMs,
      );
      if (!response || !response.ok) return false;
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return false;
      }
      const content =
        (json as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
          ?.content ?? '';
      return parseEntailmentAnswer(content);
    },
  };
}

/**
 * Anthropic-backed meaning verifier — POST /v1/messages. Fails closed to `false`
 * on absent key / non-2xx / network / parse.
 */
export function anthropicVerifier(opts: VerifierOptions): MeaningVerifier {
  const model = opts.model ?? DEFAULT_ANTHROPIC_MODEL;
  const timeoutMs = opts.timeoutMs ?? ENTAILMENT_TIMEOUT_MS;
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    name: 'anthropic',
    async verify(before: string, after: string): Promise<boolean> {
      if (!opts.apiKey) return false;
      if (before === after) return true;
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
            max_tokens: ENTAILMENT_MAX_OUTPUT_TOKENS,
            temperature: 0,
            system: 'Answer only YES or NO.',
            messages: [{ role: 'user', content: buildEntailmentPrompt(before, after) }],
          }),
        },
        timeoutMs,
      );
      if (!response || !response.ok) return false;
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return false;
      }
      const content = (json as { content?: Array<{ text?: string }> })?.content?.[0]?.text ?? '';
      return parseEntailmentAnswer(content);
    },
  };
}

/**
 * The gate the engine calls. Given the edit's before/after and an OPTIONAL
 * verifier, return whether meaning is preserved. Fail-closed:
 *   - no verifier                       ⇒ false (cannot confirm ⇒ don't keep)
 *   - verifier throws / rejects         ⇒ false
 *   - verifier returns non-boolean-ish  ⇒ false (defensive)
 *
 * This is the single entry point engine.ts uses so the fail-closed policy lives
 * in exactly one place and every caller inherits it.
 */
export async function verifyMeaningPreserved(
  verifier: MeaningVerifier | undefined,
  before: string,
  after: string,
): Promise<boolean> {
  if (!verifier) return false;
  try {
    return (await verifier.verify(before, after)) === true;
  } catch {
    return false;
  }
}
