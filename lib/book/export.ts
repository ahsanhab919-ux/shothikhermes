/**
 * Book Authoring — manuscript assembly / export (Track D, Step D5 of
 * BOOK-AUTHORING-SPEC.md §1[5], §6, §7).
 *
 * Stitch the accepted chapters (from the D3 loop) into a single finished
 * manuscript: a title page, an optional table of contents, the chapters in
 * order, and optional back matter. Output is MARKDOWN ONLY — the spec is
 * explicit that PDF/ePub are a later, separable concern (office/pdf territory),
 * NOT part of v1 (§7 "No PDF/ePub in v1"). This module deliberately produces a
 * `.md` string + a safe filename; it does not touch the filesystem.
 *
 * Design (senior-dev):
 *  - PURE + deterministic. No I/O, no models, no Letta. Same discipline as
 *    ingest.ts — a plain function of its inputs, fully unit-testable.
 *  - FAIL-CLOSED on an incomplete book. A manuscript is a finished artifact; we
 *    refuse to "export" a book with a missing or failed chapter, an out-of-range
 *    duplicate index, or empty chapter bodies. Silently shipping a book with a
 *    hole in it is the export equivalent of the done-gate's "no silent shipping"
 *    rule (§7). The caller must resolve gaps first.
 *  - NO publishing-platform metadata (§7): title + optional subtitle/author/
 *    attribution only. No keyword/category/ISBN forms — this is authoring, not a
 *    storefront.
 *  - Chapters are stitched in ASCENDING index order regardless of input order,
 *    so the caller cannot accidentally emit a shuffled book.
 */

/** Thrown when a manuscript cannot be assembled from the given inputs. */
export class BookExportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BookExportError';
    }
}

/** A chapter ready for assembly (the accepted output of the D3 loop). */
export interface ManuscriptChapter {
    index: number;
    /** Chapter title/intent — becomes the chapter heading. */
    intent: string;
    /** The accepted chapter body (markdown/prose). */
    content: string;
}

/** Book-level metadata for the front (and a little back) matter. */
export interface ManuscriptMeta {
    title: string;
    subtitle?: string;
    author?: string;
    /** Attribution line (e.g. SecondMe identity fingerprint) for the colophon. */
    attribution?: string;
    /** Extra back-matter markdown (afterword, acknowledgements). Optional. */
    backMatter?: string;
    /** Include an auto-generated table of contents. Default true. */
    includeToc?: boolean;
}

export interface AssembledManuscript {
    /** The full manuscript as a single markdown document. */
    markdown: string;
    /** A filesystem-safe filename (no extension chosen by caller; we suggest .md). */
    filename: string;
    /** Number of chapters stitched. */
    chapterCount: number;
    /** Approximate word count of chapter bodies (front/back matter excluded). */
    wordCount: number;
    /** Character count of the full assembled document. */
    charCount: number;
}

/** Slugify a title into a safe filename stem (no extension). */
export function toFilenameStem(title: string): string {
    const base = String(title ?? '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '') // drop punctuation/diacritic marks
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return base.length > 0 ? base.slice(0, 80) : 'manuscript';
}

function countWords(text: string): number {
    const m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
}

/**
 * Validate + stitch chapters into a single markdown manuscript. Pure.
 *
 * Rules (fail-closed):
 *  - title must be a non-empty string.
 *  - chapters must be a non-empty array.
 *  - every chapter must have a non-empty trimmed `content` (no blank chapters).
 *  - indices must be unique (no two chapters claiming the same slot).
 * Chapters are emitted in ascending index order.
 */
export function assembleManuscript(
    chapters: ManuscriptChapter[],
    meta: ManuscriptMeta
): AssembledManuscript {
    if (!meta || typeof meta.title !== 'string' || meta.title.trim().length === 0) {
        throw new BookExportError('assembleManuscript: meta.title is required.');
    }
    if (!Array.isArray(chapters) || chapters.length === 0) {
        throw new BookExportError('assembleManuscript: at least one chapter is required.');
    }

    // Defensive copy, sorted by index; detect duplicates and blank bodies.
    const sorted = [...chapters].sort((a, b) => a.index - b.index);
    const seen = new Set<number>();
    for (const ch of sorted) {
        if (!Number.isInteger(ch.index)) {
            throw new BookExportError(`assembleManuscript: chapter index must be an integer (got ${ch.index}).`);
        }
        if (seen.has(ch.index)) {
            throw new BookExportError(`assembleManuscript: duplicate chapter index ${ch.index}.`);
        }
        seen.add(ch.index);
        if (typeof ch.content !== 'string' || ch.content.trim().length === 0) {
            throw new BookExportError(
                `assembleManuscript: chapter ${ch.index} ("${ch.intent}") has no content.`
            );
        }
    }

    const includeToc = meta.includeToc !== false; // default true
    const lines: string[] = [];

    // --- Front matter ---------------------------------------------------------
    lines.push(`# ${meta.title.trim()}`);
    if (meta.subtitle && meta.subtitle.trim()) {
        lines.push('', `## ${meta.subtitle.trim()}`);
    }
    if (meta.author && meta.author.trim()) {
        lines.push('', `_by ${meta.author.trim()}_`);
    }
    lines.push('', '---', '');

    // --- Table of contents ----------------------------------------------------
    if (includeToc) {
        lines.push('## Contents', '');
        sorted.forEach((ch, i) => {
            lines.push(`${i + 1}. ${ch.intent.trim() || `Chapter ${ch.index}`}`);
        });
        lines.push('', '---', '');
    }

    // --- Chapters (ascending index order) ------------------------------------
    let wordCount = 0;
    sorted.forEach((ch, i) => {
        const heading = ch.intent.trim() || `Chapter ${ch.index}`;
        lines.push(`## ${heading}`, '', ch.content.trim(), '');
        wordCount += countWords(ch.content);
        // Section break between chapters (not after the last).
        if (i < sorted.length - 1) lines.push('---', '');
    });

    // --- Back matter ----------------------------------------------------------
    if (meta.backMatter && meta.backMatter.trim()) {
        lines.push('---', '', meta.backMatter.trim(), '');
    }
    if (meta.attribution && meta.attribution.trim()) {
        lines.push('---', '', `<sub>${meta.attribution.trim()}</sub>`, '');
    }

    const markdown = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

    return {
        markdown,
        filename: `${toFilenameStem(meta.title)}.md`,
        chapterCount: sorted.length,
        wordCount,
        charCount: markdown.length,
    };
}

export default { assembleManuscript, toFilenameStem };
