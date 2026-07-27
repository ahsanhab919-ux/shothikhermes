/**
 * Book Authoring — BYOK provider adapter + AuthorDeps factory (Track D, D-run).
 *
 * `runChapterLoop` (author.ts) is a pure orchestrator over injected effectful
 * edges. This file is the ONE place that binds those edges to real infrastructure
 * for a book run:
 *   - generateChapter → a BYOK prose call to the SAME provider the Re-educator
 *     uses (same endpoints/headers/model handles), keyed by the SAME persisted
 *     custody (second-me/key-custody), under a fail-closed token budget.
 *   - verifyChapter   → the existing Re-educator done-gate (gate.ts). Reused, not
 *     reimplemented — a generated chapter clears the exact bar a Re-educator edit
 *     must clear (spec §7: no bypassing the done-gate).
 *   - readBible/updateBible → the D2 bible block fns (bible.ts).
 *   - saveChapter    → book-service saveChapterRecord (upsert on bookId,index).
 *
 * WHY a prose call lives here (flagged for review): the Re-educator provider stack
 * (re-educator/provider.ts + adapters.ts) is a *reviewer* — `review() => Issue[]`
 * with review prompts and Issue-JSON parsing. It does not emit prose, so it is not
 * directly reusable for chapter GENERATION. Rather than fork a second BYOK stack,
 * this module reuses everything reusable — the key custody (`useByokKey`), the
 * provider vocabulary (`BYOK_PROVIDERS`/`isByokProvider`), and the adapters' HTTP
 * shape + model-handle + timeout constants — and adds only the minimal
 * text-generation call the reviewer contract omits. Network is injectable so tests
 * run with no key and no network.
 *
 * FAIL-CLOSED (spec §5 total token budget, §7 no silent shipping):
 *   - No usable BYOK key ⇒ the route never builds deps; the factory itself throws
 *     BookRunError if handed an empty key.
 *   - A per-run output-token budget is enforced BEFORE each generate call; once the
 *     budget is spent, generateChapter throws BookRunError and the run halts. A
 *     partially-authored book is left for the route to mark `failed` — never
 *     silently shipped as complete.
 */
import {
    DEFAULT_OPENAI_MODEL,
    DEFAULT_ANTHROPIC_MODEL,
    MAX_OUTPUT_TOKENS,
    REQUEST_TIMEOUT_MS,
} from '@/lib/re-educator/adapters';
import { type ByokProviderName } from '@/lib/re-educator/byok';
import { buildReEducatorGate, type ReEducatorGateOptions } from './gate';
import { getBibleBlock, updateBibleBlock, parseBible, renderBible } from './bible';
import { saveChapterRecord, recordChapterAttempt } from './book-service';
import type {
    AuthorDeps,
    AttemptRecord,
    GenerateInput,
    GateResult,
    PlannedChapter,
    SavedChapter,
} from './author';

/** Thrown when a book RUN cannot proceed: no key, over budget, or a bad wiring. */
export class BookRunError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BookRunError';
    }
}

/**
 * Default per-run output-token budget across ALL chapters of one run. Bounds the
 * blast radius of a book run the way the Re-educator caps bound a review. Callers
 * may override; non-positive ⇒ rejected (a zero budget can author nothing).
 */
export const DEFAULT_RUN_TOKEN_BUDGET = 120_000;

/** Per-chapter output-token cap for a single generate call (bounds one request). */
export const DEFAULT_CHAPTER_MAX_TOKENS = MAX_OUTPUT_TOKENS * 4; // prose needs more than a review

/** The bounded usage one prose call reports. Never contains the key or the prompt. */
export interface ProseUsage {
    provider: string;
    model: string;
    /** Output tokens the provider billed (falls back to the requested cap). */
    outputTokens: number;
}

/** One prose generation call: scoped input in, plain text + bounded usage out. */
export interface GenerateProseInput {
    system: string;
    prompt: string;
    /** Hard cap on output tokens for THIS call. */
    maxOutputTokens: number;
}

export type ProseGenerator = (input: GenerateProseInput) => Promise<{ text: string; usage: ProseUsage }>;

interface ProseAdapterOptions {
    model?: string;
    timeoutMs?: number;
    /** Injected in tests to avoid a real request. Defaults to global fetch. */
    fetchImpl?: typeof fetch;
}

/** Shared abort-timeout fetch, mirroring adapters.ts. Returns null on any failure. */
async function runFetch(
    doFetch: typeof fetch,
    url: string,
    init: RequestInit,
    timeoutMs: number
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

/**
 * Build a prose generator bound to one BYOK provider + key. Reuses the same HTTP
 * endpoints, auth headers, and model-handle defaults as the Re-educator adapters;
 * only the request shape (chat/completion for PROSE, not review JSON) and the
 * plain-text extraction differ. Fails LOUD (BookRunError) on a bad call — unlike
 * the reviewer, a chapter generator that silently returns "" would let an empty
 * draft reach the gate; better to halt the run.
 *
 * SECURITY: the key is a by-value parameter, handed to the provider and never
 * logged, returned, or stored (mirrors adapters.ts / byok.ts §8).
 */
export function buildProseGenerator(
    provider: ByokProviderName,
    apiKey: string,
    opts: ProseAdapterOptions = {}
): ProseGenerator {
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new BookRunError('buildProseGenerator: a BYOK apiKey is required.');
    }
    const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const doFetch = opts.fetchImpl ?? fetch;

    if (provider === 'openai') {
        const model = opts.model ?? DEFAULT_OPENAI_MODEL;
        return async ({ system, prompt, maxOutputTokens }) => {
            const response = await runFetch(
                doFetch,
                'https://api.openai.com/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: maxOutputTokens,
                        temperature: 0.7,
                        messages: [
                            { role: 'system', content: system },
                            { role: 'user', content: prompt },
                        ],
                    }),
                },
                timeoutMs
            );
            if (!response || !response.ok) {
                throw new BookRunError(
                    `Prose provider "openai" call failed (${response ? response.status : 'network/timeout'}).`
                );
            }
            let json: unknown;
            try {
                json = await response.json();
            } catch {
                throw new BookRunError('Prose provider "openai" returned an unparseable body.');
            }
            const j = json as {
                choices?: Array<{ message?: { content?: string } }>;
                usage?: { completion_tokens?: number };
            };
            const text = j?.choices?.[0]?.message?.content ?? '';
            const outputTokens = j?.usage?.completion_tokens ?? maxOutputTokens;
            return { text, usage: { provider: 'openai', model, outputTokens } };
        };
    }

    // anthropic
    const model = opts.model ?? DEFAULT_ANTHROPIC_MODEL;
    return async ({ system, prompt, maxOutputTokens }) => {
        const response = await runFetch(
            doFetch,
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: maxOutputTokens,
                    temperature: 0.7,
                    system,
                    messages: [{ role: 'user', content: prompt }],
                }),
            },
            timeoutMs
        );
        if (!response || !response.ok) {
            throw new BookRunError(
                `Prose provider "anthropic" call failed (${response ? response.status : 'network/timeout'}).`
            );
        }
        let json: unknown;
        try {
            json = await response.json();
        } catch {
            throw new BookRunError('Prose provider "anthropic" returned an unparseable body.');
        }
        const j = json as {
            content?: Array<{ text?: string }>;
            usage?: { output_tokens?: number };
        };
        const text = j?.content?.[0]?.text ?? '';
        const outputTokens = j?.usage?.output_tokens ?? maxOutputTokens;
        return { text, usage: { provider: 'anthropic', model, outputTokens } };
    };
}

/** Compose the prompt for one chapter. Pure; state comes from the bible, not history. */
export function buildChapterPrompt(input: GenerateInput): { system: string; prompt: string } {
    const system =
        'You are a disciplined long-form fiction author. Write the requested chapter as ' +
        'polished prose ONLY — no headings, notes, or commentary. Stay consistent with the ' +
        "story bible and the author's voice; never contradict established facts.";

    const beats =
        Array.isArray(input.chapter.beats) && input.chapter.beats.length > 0
            ? `\n\nBeats to hit (in order):\n${input.chapter.beats.map((b) => `- ${b}`).join('\n')}`
            : '';
    const repair =
        input.attempt > 0 && input.priorIssues && input.priorIssues.length > 0
            ? `\n\nThe previous draft was rejected. Fix these issues:\n${input.priorIssues
                  .map((i) => `- ${i}`)
                  .join('\n')}`
            : '';

    const prompt =
        `Story bible (the coherence spine — obey it):\n"""\n${input.bible}\n"""\n\n` +
        `Author voice (WRITING.md):\n"""\n${input.writingMd.slice(0, 4000)}\n"""\n\n` +
        `Write chapter ${input.chapter.index + 1}: ${input.chapter.intent}.${beats}${repair}`;

    return { system, prompt };
}

/**
 * Fold an accepted chapter's summary into the bible. Deterministic + pure over the
 * prior bible string (no extra model call): append a timeline line and seed the
 * synopsis on the first chapter. Reuses parseBible/renderBible so the section
 * structure round-trips. The over-limit guard lives in updateBibleBlock (fail-loud).
 */
export function foldChapterIntoBible(accepted: SavedChapter, priorBible: string): string {
    const fields = parseBible(priorBible);
    const line = `Ch${accepted.index + 1} — ${accepted.intent}`;
    if (!fields.timeline.includes(line)) fields.timeline.push(line);
    if (!fields.synopsis) {
        fields.synopsis = `A work in progress; chapter ${accepted.index + 1} (${accepted.intent}) is complete.`;
    }
    return renderBible(fields);
}

/** Everything the factory needs to bind AuthorDeps to a concrete book run. */
export interface BuildAuthorDepsInput {
    userId: string;
    bookId: string;
    /** The user's EXISTING Letta writing agent (WritingProfile.lettaAgentId). */
    agentId: string;
    /** The BYOK provider to author with. */
    provider: ByokProviderName;
    /** The recovered BYOK key (from custody or a per-request header). */
    apiKey: string;
    /** The user's WRITING.md voice content (read once by the caller). */
    writingMd: string;
    /** Optional model handle override; else the adapter default. */
    model?: string;
    /** Per-run output-token budget across all chapters (fail-closed when spent). */
    runTokenBudget?: number;
    /** Per-chapter output-token cap for one generate call. */
    chapterMaxTokens?: number;
    /** Options threaded to the Re-educator done-gate. */
    gateOptions?: ReEducatorGateOptions;

    // ---- Injectable seams (tests replace these; production uses the defaults) ----
    /** Prose generator; defaults to buildProseGenerator(provider, apiKey, ...). */
    generator?: ProseGenerator;
    /** Done-gate; defaults to buildReEducatorGate(gateOptions). */
    verifyChapter?: (draft: string, chapter: PlannedChapter) => Promise<GateResult>;
    /** Bible read; defaults to getBibleBlock(agentId, bookId).content. */
    readBible?: () => Promise<string>;
    /** Bible write; defaults to updateBibleBlock(agentId, bookId, content). */
    persistBible?: (content: string) => Promise<void>;
    /** Chapter persist; defaults to saveChapterRecord(userId, { bookId, ... }). */
    saveChapter?: (chapter: SavedChapter) => Promise<void>;
    /** Attempt-history write; defaults to a fail-soft recordChapterAttempt(...). */
    recordAttempt?: (record: AttemptRecord) => Promise<void>;
    /** Injected in tests to avoid a real network in the default generator. */
    fetchImpl?: typeof fetch;
    /** Optional sink for per-call usage (ledger/telemetry). Never sees the key. */
    onUsage?: (usage: ProseUsage) => void;
}

/**
 * Build the concrete AuthorDeps for a book run. The heart of the wiring: the pure
 * loop is handed real (but injectable) effectful edges, all fail-closed.
 */
export function buildAuthorDeps(input: BuildAuthorDepsInput): AuthorDeps {
    if (!input.userId) throw new BookRunError('buildAuthorDeps: userId is required.');
    if (!input.bookId) throw new BookRunError('buildAuthorDeps: bookId is required.');
    if (!input.agentId) throw new BookRunError('buildAuthorDeps: agentId is required.');
    if (typeof input.writingMd !== 'string') {
        throw new BookRunError('buildAuthorDeps: writingMd must be a string.');
    }

    const runTokenBudget = input.runTokenBudget ?? DEFAULT_RUN_TOKEN_BUDGET;
    if (!Number.isFinite(runTokenBudget) || runTokenBudget <= 0) {
        throw new BookRunError('buildAuthorDeps: runTokenBudget must be a positive number.');
    }
    const chapterMaxTokens = input.chapterMaxTokens ?? DEFAULT_CHAPTER_MAX_TOKENS;
    if (!Number.isInteger(chapterMaxTokens) || chapterMaxTokens <= 0) {
        throw new BookRunError('buildAuthorDeps: chapterMaxTokens must be a positive integer.');
    }

    const generator =
        input.generator ??
        buildProseGenerator(input.provider, input.apiKey, {
            model: input.model,
            fetchImpl: input.fetchImpl,
        });

    // Running token spend across the whole run — the fail-closed budget gate.
    let tokensUsed = 0;

    const generateChapter = async (gen: GenerateInput): Promise<string> => {
        // Enforce the budget BEFORE spending more: once the run budget is exhausted,
        // halt loudly rather than silently ship an unfinished book (spec §5/§7).
        if (tokensUsed >= runTokenBudget) {
            throw new BookRunError(
                `Run token budget exhausted (${tokensUsed}/${runTokenBudget}); halting before chapter ${
                    gen.chapter.index + 1
                }.`
            );
        }
        const { system, prompt } = buildChapterPrompt(gen);
        const remaining = runTokenBudget - tokensUsed;
        const maxOutputTokens = Math.min(chapterMaxTokens, remaining);
        const { text, usage } = await generator({ system, prompt, maxOutputTokens });
        tokensUsed += usage.outputTokens;
        input.onUsage?.(usage);
        if (typeof text !== 'string' || text.trim().length === 0) {
            // An empty draft would be trivially rejected by the gate, but failing
            // loud here gives a clearer signal than a mysterious gate rejection.
            throw new BookRunError(
                `Prose provider returned empty text for chapter ${gen.chapter.index + 1}.`
            );
        }
        return text;
    };

    const verifyChapter = input.verifyChapter ?? buildReEducatorGate(input.gateOptions);

    const readBible =
        input.readBible ??
        (async () => (await getBibleBlock(input.agentId, input.bookId)).content);

    const persistBible =
        input.persistBible ??
        (async (content: string) => {
            await updateBibleBlock(input.agentId, input.bookId, content);
        });

    const saveChapter =
        input.saveChapter ??
        (async (chapter: SavedChapter) => {
            await saveChapterRecord(input.userId, {
                bookId: input.bookId,
                index: chapter.index,
                intent: chapter.intent,
                content: chapter.content,
                status: 'accepted',
                attempts: chapter.attempts,
            });
        });

    const updateBible = async (accepted: SavedChapter, priorBible: string): Promise<void> => {
        await persistBible(foldChapterIntoBible(accepted, priorBible));
    };

    // FAIL-SOFT: attempt history is observability, not the source of truth. A
    // rejected write here must NOT abort authoring or lose an accepted chapter
    // (the intentional asymmetry with saveChapter, which fails loud). Log + continue.
    const recordAttempt =
        input.recordAttempt ??
        (async (record: AttemptRecord): Promise<void> => {
            try {
                await recordChapterAttempt(input.userId, {
                    bookId: input.bookId,
                    index: record.index,
                    attempt: record.attempt,
                    status: record.status,
                    gateIssues: record.gateIssues,
                    tokensUsed: record.tokensUsed,
                    modelHandle: record.model ?? input.model,
                });
            } catch (error) {
                console.error(
                    `Failed to record chapter attempt (book ${input.bookId}, chapter ${record.index}, try ${record.attempt}); continuing.`,
                    error
                );
            }
        });

    return {
        writingMd: input.writingMd,
        generateChapter,
        verifyChapter,
        readBible,
        saveChapter,
        updateBible,
        recordAttempt,
    };
}

export default { buildAuthorDeps, buildProseGenerator, BookRunError };
