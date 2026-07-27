/**
 * Writing-context reader (Phase 1 #3) — bridges the user's WRITING.md (a Letta
 * core-memory block) into deterministic guard inputs for the Re-educator.
 *
 * Design stance (senior-dev, deliberate):
 *
 *   WRITING.md is prose written for a human / an LLM (see DEFAULT_WRITING_MD in
 *   src/lib/letta.ts) — not structured guard config. Turning free-form prose
 *   into reliable rules is a *semantic* job, and that is exactly what the Phase 2
 *   BYOK reviewer is for. So Phase 1 does two honest things and nothing more:
 *
 *     1. Derives a STABLE VERSION TAG (content hash) for the ledger, so every
 *        run is auditable against the exact WRITING.md revision it saw. This is
 *        the reliably-extractable value and the real point of #3.
 *     2. Extracts only the UNAMBIGUOUSLY-STRUCTURED bits into guard options:
 *        explicit "avoid X -> prefer Y" terminology lines, "Don't: <phrase>"
 *        banned phrases, and the Voice & Tone section as VoiceProfile
 *        referenceText. Anything requiring interpretation is left for Phase 2 —
 *        we do not guess.
 *
 *   And it NEVER fails the run: if Letta is unreachable, the block is missing, or
 *   parsing finds nothing, callers get an empty context (version 'none') and the
 *   engine proceeds deterministically. Writing context enriches a run; it is
 *   never a hard dependency of it.
 *
 * Spec: RE-EDUCATOR-SPEC.md §6 (reads Letta writing_md via src/lib/letta.ts).
 */

import { createHash } from 'node:crypto';
import type { GuardOptions } from './service';
import type { TerminologyRule } from './guards';

export interface WritingContext {
  guardOptions: GuardOptions;
  /** Stable tag for the ledger: 'none' when no context, else 'wmd:<hash12>'. */
  writingMdVersion: string;
  /** Raw WRITING.md content, when present. Passed to the semantic reviewer
   * (Phase 2 #4) as voice/rules context. Undefined when there is no context. */
  writingMd?: string;
}

/** The empty, deterministic-only context. */
export const EMPTY_WRITING_CONTEXT: WritingContext = {
  guardOptions: {},
  writingMdVersion: 'none',
};

/** Short, stable version tag derived from WRITING.md content (sha256, 12 hex). */
export function deriveVersionTag(content: string): string {
  if (!content.trim()) return 'none';
  const hash = createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 12);
  return `wmd:${hash}`;
}

/**
 * Parse WRITING.md markdown into guard options + a version tag. Pure; no I/O.
 * Conservative by design — only unambiguous structure is honoured.
 */
export function parseWritingContext(content: string): WritingContext {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) return EMPTY_WRITING_CONTEXT;

  const sections = splitSections(content);
  const terminologyRules = parseTerminology(
    sectionBody(sections, ['terminology & style', 'terminology', 'style']),
    sectionBody(sections, ["do / don't", 'do/dont', "do / don't", 'do', "don't"]),
  );
  const bannedPhrases = parseBannedPhrases(
    sectionBody(sections, ["do / don't", 'do/dont', "don't", 'dont']),
  );
  const voiceRef = sectionBody(sections, ['voice & tone', 'voice and tone', 'voice', 'tone']);

  const guardOptions: GuardOptions = {};
  if (terminologyRules.length > 0) guardOptions.terminologyRules = terminologyRules;
  if (bannedPhrases.length > 0 || voiceRef) {
    guardOptions.voiceProfile = {};
    if (voiceRef) guardOptions.voiceProfile.referenceText = voiceRef;
    if (bannedPhrases.length > 0) guardOptions.voiceProfile.bannedPhrases = bannedPhrases;
  }

  return { guardOptions, writingMdVersion: deriveVersionTag(content), writingMd: content };
}

/** Split markdown into a map of lowercased H2/H3 heading -> raw body text. */
function splitSections(md: string): Map<string, string> {
  const out = new Map<string, string>();
  const lines = md.split(/\r?\n/);
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current !== null) out.set(current, buf.join('\n').trim());
    buf = [];
  };
  for (const line of lines) {
    const m = /^#{2,3}\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1].trim().toLowerCase();
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

/** Body of the first section whose heading matches any of `names`. */
function sectionBody(sections: Map<string, string>, names: string[]): string {
  for (const n of names) {
    const v = sections.get(n);
    if (v !== undefined) return v;
  }
  return '';
}

/**
 * Extract explicit terminology rules. We accept a handful of unambiguous forms
 * an author is likely to write, and ignore everything else:
 *   - "avoid X -> prefer Y"        (arrow forms: ->, →, =>)
 *   - "X -> Y"                     (bare arrow)
 *   - "use Y instead of X"
 *   - "prefer Y over X"
 * Placeholder/template lines (wrapped in _italics_) are skipped.
 */
function parseTerminology(styleBody: string, doDontBody: string): TerminologyRule[] {
  const rules: TerminologyRule[] = [];
  const seen = new Set<string>();
  const push = (avoid: string, prefer: string) => {
    const a = clean(avoid);
    const p = clean(prefer);
    if (!a || !p || a.toLowerCase() === p.toLowerCase()) return;
    const key = a.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rules.push({ avoid: a, prefer: p, note: 'from WRITING.md' });
  };

  for (const raw of `${styleBody}\n${doDontBody}`.split(/\r?\n/)) {
    const line = stripListMarker(raw);
    if (!line || isPlaceholder(line)) continue;

    let m =
      /^(?:avoid\s+)?["'“]?(.+?)["'”]?\s*(?:->|→|=>)\s*(?:prefer\s+)?["'“]?(.+?)["'”]?$/i.exec(
        line,
      );
    if (m) {
      push(m[1], m[2]);
      continue;
    }
    m = /\buse\s+["'“]?(.+?)["'”]?\s+instead of\s+["'“]?(.+?)["'”]?$/i.exec(line);
    if (m) {
      push(m[2], m[1]);
      continue;
    }
    m = /\bprefer\s+["'“]?(.+?)["'”]?\s+over\s+["'“]?(.+?)["'”]?$/i.exec(line);
    if (m) {
      push(m[2], m[1]);
      continue;
    }
  }
  return rules;
}

/**
 * Banned phrases: "Don't:" bullet items in the Do / Don't section. We take the
 * inline "Don't:" prefix items and any bullets that follow a "Don't" line.
 */
function parseBannedPhrases(doDontBody: string): string[] {
  if (!doDontBody) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  let inDont = false;

  for (const raw of doDontBody.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const marker = stripListMarker(line);
    // Section toggles: "Do:" turns collection off, "Don't:" turns it on. An
    // inline value after "Don't:" is itself collected.
    const dontInline = /^don'?t\s*:?\s*(.*)$/i.exec(marker);
    const doInline = /^do\s*:?\s*(.*)$/i.exec(marker);
    if (doInline && !dontInline) {
      inDont = false;
      continue;
    }
    if (dontInline) {
      inDont = true;
      const rest = dontInline[1];
      if (rest && !isPlaceholder(rest)) add(rest);
      continue;
    }
    if (inDont && !isPlaceholder(marker)) add(marker);
  }

  function add(phrase: string) {
    const p = clean(phrase);
    if (!p) return;
    const key = p.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function stripListMarker(s: string): string {
  return s.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim();
}
function isPlaceholder(s: string): boolean {
  // Template hints in DEFAULT_WRITING_MD are wrapped in _underscores_.
  const t = s.trim();
  return t.startsWith('_') && t.endsWith('_');
}
function clean(s: string): string {
  return s.replace(/^["'“]+|["'”]+$/g, '').trim();
}

/**
 * Read the user's WRITING.md and parse it into a WritingContext. Async wrapper
 * around the (injectable) fetch. NEVER throws: any failure — no profile, Letta
 * down, missing block — degrades to EMPTY_WRITING_CONTEXT so the run proceeds.
 *
 * The fetcher is injected so this is unit-testable without Letta/Mongo. The
 * route supplies the real one (getOrCreateWritingProfile -> getWritingMd).
 */
export async function readWritingContext(
  userId: string,
  fetchWritingMd: (userId: string) => Promise<string | null>,
): Promise<WritingContext> {
  try {
    const content = await fetchWritingMd(userId);
    if (!content) return EMPTY_WRITING_CONTEXT;
    return parseWritingContext(content);
  } catch (err) {
    // Enrichment is best-effort; never let it fail a run.
    console.warn('readWritingContext: falling back to deterministic-only context:', err);
    return EMPTY_WRITING_CONTEXT;
  }
}
