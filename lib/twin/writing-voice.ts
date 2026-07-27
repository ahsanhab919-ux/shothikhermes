/**
 * Twin writing-voice helpers (feature 3b).
 *
 * Resolve the CURRENT master's learned WRITING.md voice (userId-keyed, via the
 * `writingProfiles` agent) and, after generation, annotate the produced text
 * with voice-drift findings. Both are ADDITIVE and degrade gracefully:
 *   - resolveWritingMd never throws — if Letta is unset/unavailable it logs and
 *     returns undefined so task execution falls back to heuristic-only.
 *   - computeVoiceDriftFindings is a pure, no-LLM annotation — it never alters
 *     the generated text.
 *
 * Transfer-safety: the agent is resolved from the master's `userId` (never from
 * `twin.lettaAgentId`), so a transferred twin never carries the prior owner's
 * voice.
 */
import { getOrCreateWritingProfile } from '@/lib/writingProfile';
import { getWritingMd, DEFAULT_WRITING_MD } from '@/lib/letta';
import { voiceDrift } from '@/lib/re-educator/guards/voice-drift';
import type { Issue } from '@/lib/re-educator/types';
import { executeTask, type TaskInput, type TwinProfile } from './task-executor';
import type { StyleProfile } from './style-extractor';

/**
 * Voice-gate tunables (feature 3c). Exposed as constants so the block rule is
 * auditable and adjustable in one place.
 *
 *   DRIFT_RATIO_THRESHOLD  — lexical-drift (severity 'info') findings only block
 *     when the fraction of drifted sentences EXCEEDS this. A single/few drift
 *     findings never block; banned-phrase findings always do.
 *   DEFAULT_DRIFT_THRESHOLD — per-sentence cosine-distance cutoff forwarded to the
 *     voice-drift guard (HIGHER = more permissive).
 *   DEFAULT_MAX_REPAIR_ATTEMPTS — bounded repair regenerations (so up to
 *     1 + N total generations); the synchronous twin path keeps this tight.
 *     Env-tunable via TWIN_VOICE_MAX_REPAIR_ATTEMPTS (clamped to 0-3).
 *   DEFAULT_MAX_TOTAL_MS — overall wall-clock budget for the generate→gate→regen
 *     loop; once exceeded no NEW attempt is issued (the first always runs) and the
 *     current best-effort draft is returned. Env-tunable via TWIN_VOICE_MAX_TOTAL_MS.
 */
export const DRIFT_RATIO_THRESHOLD = 0.3;
export const DEFAULT_DRIFT_THRESHOLD = 0.85;
export const DEFAULT_MAX_REPAIR_ATTEMPTS = 2;
export const DEFAULT_MAX_TOTAL_MS = 60000;

/** Resolve the repair-attempt bound from env, clamped to [0, 3]. */
function resolveMaxAttempts(): number {
  const raw = process.env.TWIN_VOICE_MAX_REPAIR_ATTEMPTS;
  if (raw === undefined || raw.trim() === '') return DEFAULT_MAX_REPAIR_ATTEMPTS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_REPAIR_ATTEMPTS;
  return Math.max(0, Math.min(3, Math.floor(parsed)));
}

/** Resolve the overall wall-clock budget (ms) from env; positive or default. */
function resolveMaxTotalMs(): number {
  const raw = process.env.TWIN_VOICE_MAX_TOTAL_MS;
  if (raw === undefined || raw.trim() === '') return DEFAULT_MAX_TOTAL_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_TOTAL_MS;
}

/** True while there is still budget to issue another generation attempt. */
export function hasTimeBudget(start: number, now: number, maxTotalMs: number): boolean {
  return now - start < maxTotalMs;
}

/** Normalize whitespace so a byte-for-byte default match is robust to line
 *  endings and trailing spaces. */
function normalizeWs(s: string): string {
  return s.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

/**
 * True when every meaningful body line is still a template placeholder (empty,
 * or underscore-wrapped like `_..._`) after stripping headings, list markers, and
 * Do/Don't sub-labels — i.e. an untouched scaffold with no real voice content.
 */
function isAllPlaceholder(md: string): boolean {
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,6}\s+/.test(line)) continue; // heading
    let body = line.replace(/^(?:[-*+]|\d+[.)])\s+/, '');
    body = body.replace(/^(?:don['’]?t|do not|do|avoid|never use)\s*:?\s*/i, '').trim();
    if (!body) continue;
    if (/^_.*_$/.test(body) || /^_+$/.test(body)) continue; // placeholder token
    return false; // found real, non-placeholder content
  }
  return true;
}

/**
 * Resolve the user's learned WRITING.md content by userId. Returns undefined
 * (and logs a warning) if the profile/agent cannot be reached — Letta must never
 * be a hard dependency of the twin writing path.
 *
 * Also returns undefined when the content is the untouched DEFAULT_WRITING_MD
 * scaffold (whitespace-normalized) or is still all placeholders. Such users get
 * true pre-3b behavior: no WRITING.md prompt block and a no-op voice gate.
 */
export async function resolveWritingMd(userId: string): Promise<string | undefined> {
  try {
    const { lettaAgentId } = await getOrCreateWritingProfile(userId);
    const { content } = await getWritingMd(lettaAgentId);
    if (!content?.trim()) return undefined;
    if (normalizeWs(content) === normalizeWs(DEFAULT_WRITING_MD)) return undefined;
    if (isAllPlaceholder(content)) return undefined;
    return content;
  } catch (err) {
    console.warn('[twin] WRITING.md voice unavailable; proceeding heuristic-only:', err);
    return undefined;
  }
}

/**
 * Annotate generated text against the WRITING.md reference voice. Pure/no-LLM.
 * Returns [] when there is no reference. Never mutates the text.
 *
 * 3c: additively forwards `bannedPhrases` (so the banned-phrase gate has teeth)
 * and `driftThreshold` to the guard. Existing 2-arg call sites are unaffected.
 */
export function computeVoiceDriftFindings(
  text: string,
  writingMd?: string,
  opts?: { bannedPhrases?: string[]; driftThreshold?: number }
): Issue[] {
  if (!writingMd) return [];
  return voiceDrift(text, {
    referenceText: writingMd,
    bannedPhrases: opts?.bannedPhrases,
    driftThreshold: opts?.driftThreshold,
  });
}

/**
 * Extract discouraged phrases from a WRITING.md "Don't" section.
 *
 * Recognizes the labels `Don't` / `Do not` / `Avoid` / `Never use` (case-
 * insensitive) as capture triggers, and `Do` as a capture-off trigger. These may
 * appear as markdown headings (`## Don't`), bold labels (`**Don't:**`), OR — as in
 * the shipped combined `## Do / Don't` heading — as inline list sub-labels
 * (`- Do:` / `- Don't:`). A combined heading opens capture; the inline sub-labels
 * then refine it (Do → off, Don't → on). When a Don't sub-label carries trailing
 * content (`- Don't: use jargon`), that content is captured too.
 *
 * Every captured phrase is reduced to a bare term: the label prefix and any
 * leading list marker are stripped, quotes are unwrapped, and empty or
 * placeholder items (e.g. underscore-wrapped `_..._`) are skipped. When no Don't
 * section is found, returns [] — the gate degrades to drift-only.
 */
export function extractBannedPhrases(writingMd?: string): string[] {
  if (!writingMd) return [];

  const isDontLabel = (s: string) => /^(?:don['’]?t|do not|avoid|never use)\b/i.test(s);
  const isDoLabel = (s: string) => /^do\b/i.test(s) && !isDontLabel(s);
  const stripDontPrefix = (s: string) =>
    s.replace(/^(?:don['’]?t|do not|avoid|never use)\s*:?\s*/i, '');
  const isPlaceholder = (s: string) => s === '' || /^_.*_$/.test(s) || /^_+$/.test(s);

  const phrases: string[] = [];
  const pushPhrase = (rawPhrase: string) => {
    const quoted = rawPhrase.match(/["“”'']([^"“”'']+)["“”'']/);
    const phrase = (quoted ? quoted[1] : rawPhrase)
      .replace(/\*\*/g, '')
      .replace(/^["“”'']|["“”'']$/g, '')
      .trim();
    if (!isPlaceholder(phrase)) phrases.push(phrase);
  };

  let capturing = false;

  for (const raw of writingMd.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // Headings / bold labels open or close a Don't capture window. A combined
    // "Do / Don't" heading counts as Don't (its inline sub-labels then refine it).
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    const boldLabel = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    const headingLabel = heading?.[1] ?? boldLabel?.[1];
    if (headingLabel !== undefined) {
      capturing = /don['’]?t|do not|avoid|never use/i.test(headingLabel);
      continue;
    }

    // Strip a leading list marker to inspect the item / inline sub-label.
    const listMatch = line.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
    const content = (listMatch ? listMatch[1] : line).trim();

    // Inline sub-labels flip the capture toggle within a combined section.
    if (isDoLabel(content)) {
      capturing = false;
      continue;
    }
    if (isDontLabel(content)) {
      capturing = true;
      const rest = stripDontPrefix(content).trim();
      if (rest) pushPhrase(rest);
      continue;
    }

    // Only capture genuine list items inside an open Don't window.
    if (!capturing || !listMatch) continue;
    pushPhrase(content);
  }

  return phrases;
}

// Mirrors lib/re-educator/guards/voice-drift.ts so the drift-ratio denominator
// counts EXACTLY the sentences the guard is willing to flag (>=5 non-stopword
// tokens). Kept in sync locally to keep this fix within lib/twin/*.
const VOICE_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'is',
  'are', 'was', 'were', 'be', 'it', 'this', 'that', 'with', 'as', 'at', 'by',
  'from', 'we', 'you', 'i', 'they', 'he', 'she', 'our', 'your', 'their',
]);

function nonStopwordTokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z']+/g) ?? []).filter((w) => !VOICE_STOPWORDS.has(w));
}

/**
 * Count the QUALIFYING sentences — those with >=5 non-stopword tokens, matching
 * the voice-drift guard's population (it skips shorter sentences as "too short to
 * judge"). This is the drift-ratio denominator, so numerator (drift findings) and
 * denominator share the same basis; the ratio means drifted / qualifying.
 */
function countQualifyingSentences(text: string): number {
  const matches = text.match(/[^.!?]*[.!?]+|\S[^.!?]*$/g) ?? ([] as string[]);
  let n = 0;
  for (const m of matches) {
    const body = m.trim();
    if (body.length === 0) continue;
    if (nonStopwordTokens(body).length >= 5) n += 1;
  }
  return n;
}

/**
 * The hard voice pass-rule, built DIRECTLY over the voice-drift Issue[] (NOT the
 * re-educator, which maps voice-drift to non-blocking `propose` under STANDARD).
 *
 *   - Banned-phrase findings (severity 'minor') ALWAYS block.
 *   - Lexical-drift findings (severity 'info') block ONLY when the drifted-sentence
 *     ratio exceeds DRIFT_RATIO_THRESHOLD. The ratio is (# drift findings) /
 *     (# QUALIFYING sentences, i.e. those with >=5 non-stopword tokens — the same
 *     population the guard judges); if that count is absent, the drift count is
 *     used as the denominator (conservative — any lone drift finding then blocks).
 */
export function passesVoiceGate(
  findings: Issue[],
  sentenceCount?: number
): { passed: boolean; blockingFindings: Issue[] } {
  const banned = findings.filter((f) => f.severity === 'minor');
  const drift = findings.filter((f) => f.severity === 'info');

  const denom =
    sentenceCount && sentenceCount > 0 ? sentenceCount : drift.length;
  const driftRatio = denom > 0 ? drift.length / denom : 0;
  const blockingDrift = driftRatio > DRIFT_RATIO_THRESHOLD ? drift : [];

  const blockingFindings = [...banned, ...blockingDrift];
  return { passed: blockingFindings.length === 0, blockingFindings };
}

/** Human-readable repair block threaded into the next executeTask call. */
function buildRepairFeedback(blocking: Issue[], bannedPhrases: string[]): string {
  const issues = blocking.map((i) => `- ${i.rationale}`).join('\n');
  const bannedLine =
    bannedPhrases.length > 0
      ? `\nAvoid these phrases entirely: ${bannedPhrases
          .map((p) => `"${p}"`)
          .join(', ')}.`
      : '';
  return `The previous draft drifted from the author's WRITING.md voice. Revise to fix:\n${issues}${bannedLine}`;
}

export interface GenerateWithVoiceGateParams {
  task: TaskInput;
  profile: TwinProfile;
  styleProfile?: StyleProfile | null;
  writingMd?: string | null;
  maxAttempts?: number;
  driftThreshold?: number;
  /** Overall wall-clock budget (ms). Defaults to env / DEFAULT_MAX_TOTAL_MS. */
  maxTotalMs?: number;
  /** Injectable clock (ms) for testing the budget; defaults to Date.now. */
  now?: () => number;
}

export interface VoiceGateResult {
  text: string;
  voiceGatePassed: boolean;
  repairAttempts: number;
  finalFindings: Issue[];
  bestEffort: boolean;
}

/**
 * Generate Twin text behind a HARD voice gate with a bounded repair loop. Mirrors
 * the book engine's generate→gate→regen shape (lib/book/author.ts
 * authorChapterOnce), but with the CUSTOM voice pass-rule (passesVoiceGate) and
 * caller-driven regeneration via the gateway (executeTask) — the re-educator never
 * rewrites voice text.
 *
 *   - No reference voice (writingMd empty) → NO-OP gate: one generation, always
 *     passed (preserves 3b behavior for users with no profile).
 *   - Else: generate → computeVoiceDriftFindings → passesVoiceGate. On pass, return
 *     with the attempts used. On fail, thread the blocking findings + banned
 *     phrases back as repairFeedback and regenerate, up to maxAttempts. After
 *     exhaustion, return the LAST draft flagged voiceGatePassed:false, bestEffort:true.
 *
 * Always returns text — never leaves the caller with no output.
 */
export async function generateWithVoiceGate(
  params: GenerateWithVoiceGateParams
): Promise<VoiceGateResult> {
  const { task, profile, styleProfile } = params;
  const writingMd = params.writingMd ?? undefined;
  const maxAttempts = Math.max(
    0,
    Math.min(3, Math.floor(params.maxAttempts ?? resolveMaxAttempts()))
  );
  const driftThreshold = params.driftThreshold ?? DEFAULT_DRIFT_THRESHOLD;
  const maxTotalMs = params.maxTotalMs ?? resolveMaxTotalMs();
  const now = params.now ?? Date.now;

  // No-op gate: nothing to measure against, so a single generation is final.
  if (!writingMd || !writingMd.trim()) {
    const text = await executeTask(task, profile, styleProfile, writingMd);
    return {
      text,
      voiceGatePassed: true,
      repairAttempts: 0,
      finalFindings: [],
      bestEffort: false,
    };
  }

  const bannedPhrases = extractBannedPhrases(writingMd);

  const start = now();
  let attempt = 0;
  let repairFeedback: string | undefined;
  let lastText = '';
  let lastFindings: Issue[] = [];

  // attempt 0 = first try (always runs); each failing attempt under both the
  // attempt bound AND the wall-clock budget regenerates. Total generations are
  // capped at 1 + maxAttempts, or fewer if the budget is exhausted first.
  while (true) {
    const text = await executeTask(task, profile, styleProfile, writingMd, repairFeedback);
    const findings = computeVoiceDriftFindings(text, writingMd, {
      bannedPhrases,
      driftThreshold,
    });
    const gate = passesVoiceGate(findings, countQualifyingSentences(text));

    lastText = text;
    lastFindings = findings;

    if (gate.passed) {
      return {
        text,
        voiceGatePassed: true,
        repairAttempts: attempt,
        finalFindings: findings,
        bestEffort: false,
      };
    }

    // Stop issuing NEW attempts once the attempt bound or the time budget is hit.
    if (attempt >= maxAttempts || !hasTimeBudget(start, now(), maxTotalMs)) break;

    repairFeedback = buildRepairFeedback(gate.blockingFindings, bannedPhrases);
    attempt += 1;
  }

  // Exhausted the bound (or the budget) without passing — best-effort, flagged.
  return {
    text: lastText,
    voiceGatePassed: false,
    repairAttempts: attempt,
    finalFindings: lastFindings,
    bestEffort: true,
  };
}
