/**
 * Book Authoring — ingest + classify (Track D, Step D1 of BOOK-AUTHORING-SPEC.md §1[1]).
 *
 * The first stage of the authoring pipeline. A user uploads a single `.md`
 * document that is EITHER an outline (headings + terse beats) OR a
 * draft-in-progress (headings + substantial prose). This module answers three
 * questions, deterministically and without any I/O:
 *
 *   1. sourceKind — 'outline' | 'partial'   (how much prose is already written?)
 *   2. kind       — 'fiction' | 'nonfiction' (a HINT, user-overridable)
 *   3. structure  — the ordered chapter list w/ per-chapter intent + beats
 *
 * Design (senior-dev):
 *  - Pure + fully unit-testable. No DB, no model calls, no Letta. Those belong
 *    to later steps (D2 story bible, D3 chapter loop). This is the same
 *    discipline as `parseSkillProfile` — hand-rolled validation, a dedicated
 *    error type, no zod.
 *  - Heading extraction reuses `marked.lexer()` (already a repo dependency)
 *    rather than a fragile hand-rolled regex. Deterministic token output.
 *  - Classification is HEURISTIC and explicitly a hint. The spec calls fiction
 *    the fast path (needs no paid runtime), so an ambiguous doc defaults to
 *    fiction — the safe default — and the caller may override `kind`. We do not
 *    pretend a heuristic is ground truth; we expose the signals we used.
 *  - Fail-closed bounds (MAX_INPUT_CHARS, MAX_CHAPTERS) — long-form authoring is
 *    expensive downstream; reject oversized input here, not after model spend.
 */
import { marked } from 'marked';

/** Thrown when an uploaded document cannot be ingested. */
export class BookIngestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BookIngestError';
    }
}

/** Upper bound on raw input size (chars). Keeps ingest cheap + bounds downstream cost. */
export const MAX_INPUT_CHARS = 500_000;
/** Upper bound on chapters extracted from a single document. */
export const MAX_CHAPTERS = 200;
/**
 * Prose-density threshold (avg body chars per chapter) at/above which we treat
 * the document as an in-progress manuscript rather than an outline. An outline
 * is headings + short beats; a partial has real paragraphs.
 */
export const PARTIAL_PROSE_THRESHOLD = 400;

/** Whether the upload is a skeletal outline or a manuscript with real prose. */
export type BookSourceKind = 'outline' | 'partial';
/** Fiction vs non-fiction — a HINT (user may override). Drives the D4 research path. */
export type BookKind = 'fiction' | 'nonfiction';

/** One planned chapter extracted from the document structure. */
export interface IngestedChapter {
    /** Zero-based position in reading order. */
    index: number;
    /** The chapter heading text — becomes the chapter's `intent` seed. */
    intent: string;
    /** Heading level (marked `depth`), preserved for later plan grouping. */
    depth: number;
    /** Terse bullet/line beats found under this heading (outline signal). */
    beats: string[];
    /** Count of prose body chars under this heading (partial-manuscript signal). */
    proseChars: number;
}

/** The signals behind the `kind` guess — exposed so callers can trust-but-verify. */
export interface KindSignals {
    /** Reference/citation markers found (links, footnotes, "References"/"Bibliography"). */
    citationHits: number;
    /** Whether the document contained any markdown link. */
    hasLinks: boolean;
    /** Human-readable reason for the chosen kind. */
    reason: string;
}

/** The full result of ingesting one document. */
export interface IngestResult {
    sourceKind: BookSourceKind;
    kind: BookKind;
    /** Document title if a single top-level (H1) heading was present, else null. */
    title: string | null;
    chapters: IngestedChapter[];
    kindSignals: KindSignals;
}

/** The minimal heading shape we care about, lifted out of marked's Token union. */
interface HeadingInfo {
    depth: number;
    text: string;
}

/** Pull heading depth+text from a marked token, or null if it is not a heading. */
function asHeading(tok: unknown): HeadingInfo | null {
    if (
        typeof tok === 'object' &&
        tok !== null &&
        (tok as { type?: unknown }).type === 'heading' &&
        typeof (tok as { depth?: unknown }).depth === 'number' &&
        typeof (tok as { text?: unknown }).text === 'string'
    ) {
        const t = tok as { depth: number; text: string };
        return { depth: t.depth, text: t.text };
    }
    return null;
}

/** A raw markdown line that reads as a terse outline beat (bullet / numbered / dashed). */
function asBeat(line: string): string | null {
    const t = line.trim();
    if (t.length === 0) return null;
    const m = t.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.*)$/);
    if (!m) return null;
    const body = m[1].trim();
    return body.length > 0 ? body : null;
}

const CITATION_RE =
    /(^#+\s*(references|bibliography|works cited|sources|citations)\b)|(\[\^[^\]]+\])/gim;
const LINK_RE = /\[[^\]]+\]\([^)]+\)/g;

/**
 * Validate + classify + structure an uploaded markdown document. Pure; no I/O.
 *
 * Rules:
 *  - `raw` must be a non-empty string within MAX_INPUT_CHARS.
 *  - The document MUST contain at least one heading (that is what defines a
 *    chapter boundary); a wall of prose with no headings is rejected — the user
 *    should provide at least an outline structure.
 *  - Chapters are the headings at the SHALLOWEST heading depth that repeats
 *    (so an H1 title + many H2 chapters yields the H2s; a doc that is all H1s
 *    yields the H1s). A lone H1 is treated as the title, not a chapter.
 */
export function ingestBookDocument(raw: unknown, kindOverride?: BookKind): IngestResult {
    if (typeof raw !== 'string') {
        throw new BookIngestError('Document must be a string.');
    }
    const text = raw.trim();
    if (text.length === 0) {
        throw new BookIngestError('Document is empty.');
    }
    if (raw.length > MAX_INPUT_CHARS) {
        throw new BookIngestError(
            `Document exceeds ${MAX_INPUT_CHARS} characters (got ${raw.length}).`
        );
    }
    if (kindOverride !== undefined && kindOverride !== 'fiction' && kindOverride !== 'nonfiction') {
        throw new BookIngestError('kindOverride must be "fiction" or "nonfiction" when provided.');
    }

    const tokens = marked.lexer(text);
    const headings: HeadingInfo[] = tokens
        .map(asHeading)
        .filter((h): h is HeadingInfo => h !== null);
    if (headings.length === 0) {
        throw new BookIngestError(
            'Document has no headings; provide at least an outline (e.g. "## Chapter 1").'
        );
    }

    // A single leading H1 with deeper headings below is the title, not a chapter.
    const minDepth = Math.min(...headings.map((h) => h.depth));
    const atMin = headings.filter((h) => h.depth === minDepth);
    let title: string | null = null;
    let chapterDepth = minDepth;
    if (atMin.length === 1 && headings.length > 1) {
        // Lone top heading = title; chapters are the next-shallowest level.
        title = atMin[0].text.trim();
        const deeper = headings.filter((h) => h.depth > minDepth);
        chapterDepth = deeper.length > 0 ? Math.min(...deeper.map((h) => h.depth)) : minDepth;
    }

    // Slice the raw text by chapter-heading occurrences to measure per-chapter body.
    const lines = text.split('\n');
    const headingLineRe = new RegExp(`^#{${chapterDepth}}\\s+(.*\\S)\\s*$`);
    // Any heading at chapterDepth OR shallower ends the current chapter's body.
    const boundaryRe = new RegExp(`^#{1,${chapterDepth}}\\s+`);

    const chapters: IngestedChapter[] = [];
    let current: IngestedChapter | null = null;
    let bodyBuf: string[] = [];

    const flush = () => {
        if (!current) return;
        const beats: string[] = [];
        let proseChars = 0;
        for (const l of bodyBuf) {
            const beat = asBeat(l);
            if (beat) {
                beats.push(beat);
            } else if (l.trim().length > 0 && !/^#{1,6}\s/.test(l)) {
                proseChars += l.trim().length;
            }
        }
        current.beats = beats;
        current.proseChars = proseChars;
        chapters.push(current);
        current = null;
        bodyBuf = [];
    };

    for (const line of lines) {
        const chMatch = line.match(headingLineRe);
        if (chMatch) {
            flush();
            if (chapters.length >= MAX_CHAPTERS) {
                throw new BookIngestError(`Document exceeds ${MAX_CHAPTERS} chapters.`);
            }
            current = {
                index: chapters.length,
                intent: chMatch[1].trim(),
                depth: chapterDepth,
                beats: [],
                proseChars: 0,
            };
            bodyBuf = [];
            continue;
        }
        // A shallower heading (e.g. the H1 title, or a part divider) ends any open
        // chapter body without starting a new chapter.
        if (current && boundaryRe.test(line) && !chMatch) {
            flush();
            continue;
        }
        if (current) bodyBuf.push(line);
    }
    flush();

    if (chapters.length === 0) {
        throw new BookIngestError('No chapter headings could be extracted.');
    }

    // sourceKind: prose density measured over chapters that actually contain
    // prose. Averaging across ALL chapters lets back-matter (References, empty
    // stubs) dilute the signal and mis-label a real manuscript as an outline, so
    // we ignore zero-prose sections and require at least one prose chapter.
    const proseChapters = chapters.filter((c) => c.proseChars > 0);
    const avgProse =
        proseChapters.length > 0
            ? proseChapters.reduce((s, c) => s + c.proseChars, 0) / proseChapters.length
            : 0;
    const sourceKind: BookSourceKind =
        avgProse >= PARTIAL_PROSE_THRESHOLD ? 'partial' : 'outline';

    // kind: heuristic hint. Citation/reference signals lean non-fiction; otherwise
    // default fiction (the fast, runtime-free path). Explicit override wins.
    const citationHits = (text.match(CITATION_RE) || []).length;
    const linkHits = (text.match(LINK_RE) || []).length;
    const hasLinks = linkHits > 0;
    let kind: BookKind;
    let reason: string;
    if (kindOverride) {
        kind = kindOverride;
        reason = `caller override: ${kindOverride}`;
    } else if (citationHits > 0 || linkHits >= 3) {
        kind = 'nonfiction';
        reason = `citation/reference signals present (citationHits=${citationHits}, links=${linkHits})`;
    } else {
        kind = 'fiction';
        reason = 'no strong citation signals; defaulting to fiction (runtime-free path)';
    }

    return {
        sourceKind,
        kind,
        title,
        chapters,
        kindSignals: { citationHits, hasLinks, reason },
    };
}
